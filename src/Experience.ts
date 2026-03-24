import * as THREE from "three";
import gsap from "gsap";
import { Sizes } from "@/core/Sizes";
import { Renderer } from "@/core/Renderer";
import { Loop } from "@/core/Loop";
import { Machine } from "@/objects/Machine";
import { Capsule } from "@/objects/Capsule";
import { Environment } from "@/objects/Environment";
import { FloatingStars } from "@/objects/FloatingStars";
import { GameState } from "@/state/GameState";
import { UIManager } from "@/ui/UIManager";
import { encodeParticipantsToURL } from "@/config";
import { GameStateType } from "@/types";
import type { Participant, LoopCallback } from "@/types";
import { playEntryAnimation } from "@/animations/EntryAnimation";
import { playSpinAnimation } from "@/animations/SpinAnimation";
import { playRevealAnimation } from "@/animations/RevealAnimation";
import { createSparkles } from "@/effects/SparkleEffect";
import { createConfetti } from "@/effects/ConfettiEffect";

export class Experience implements LoopCallback {
  canvas!: HTMLCanvasElement;
  sizes!: Sizes;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: Renderer;
  loop!: Loop;
  machine!: Machine;
  capsules!: Capsule[];
  floatingStars!: FloatingStars;
  gameState!: GameState;
  ui!: UIManager;
  participants!: Participant[];
  winnerIndex: number = -1;
  private spinTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(canvas: HTMLCanvasElement, participants: Participant[]) {
    this.canvas = canvas;
    this.participants = participants;

    // Core
    this.sizes = new Sizes();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, this.sizes.width / this.sizes.height, 0.1, 100);
    this.camera.position.set(0, 3.5, 9);
    this.camera.lookAt(0, 2, 0);
    this.renderer = new Renderer(canvas, this.sizes);
    this.loop = new Loop();

    // Resize handler
    this.sizes.on("resize", () => {
      this.camera.aspect = this.sizes.width / this.sizes.height;
      this.camera.updateProjectionMatrix();
    });

    // Objects
    new Environment(this.scene);
    this.machine = new Machine(this.scene);
    this.capsules = participants.map((p, i) => {
      const c = new Capsule(p, i);
      c.addToScene(this.scene);
      return c;
    });
    this.floatingStars = new FloatingStars(this.scene);

    // State & UI
    this.gameState = new GameState();
    this.ui = new UIManager();
    this.ui.bindEvents({
      start: () => this.startEntry(),
      spin: () => this.spinGacha(),
      reset: () => this.resetGame(),
      edit: () => this.openEditor(),
      saveParticipants: (nextParticipants) => this.applyParticipantEdits(nextParticipants),
    });
    this.ui.setEditEnabled(true);

    // Loop
    this.loop.add(this);
    this.loop.add(this.floatingStars);
    this.loop.start();

    // Intro camera animation
    gsap.from(this.camera.position, { y: 6, z: 14, duration: 2.5, ease: "power3.out" });
  }

  update(_delta: number, elapsed: number): void {
    if (this.gameState.is(GameStateType.Idle)) {
      this.machine.group.position.y = Math.sin(elapsed * 0.7) * 0.04;
      this.machine.group.rotation.y = Math.sin(elapsed * 0.3) * 0.03;
      this.capsules.forEach((c, i) => {
        const a = elapsed * 0.4 + i * Math.PI * 0.5;
        c.group.position.x = Math.cos(a) * 2.2;
        c.group.position.z = Math.sin(a) * 2.2;
        c.group.position.y = 6 + Math.sin(elapsed * 1.2 + i) * 0.3;
        c.group.rotation.y += 0.015;
        c.group.rotation.x = Math.sin(elapsed * 0.8 + i) * 0.2;
      });
    } else if (this.gameState.is(GameStateType.Ready)) {
      this.machine.group.position.y = Math.sin(elapsed * 0.7) * 0.02;
      this.capsules.forEach((c, i) => {
        c.group.position.y = 3.8 + Math.sin(elapsed * 1.8 + i * 1.3) * 0.1;
        c.group.rotation.x += 0.003;
        c.group.rotation.y += 0.005;
      });
    } else if (this.gameState.is(GameStateType.Done) && this.winnerIndex >= 0) {
      const w = this.capsules[this.winnerIndex];
      w.group.position.y = 2.5 + Math.sin(elapsed * 1.2) * 0.08;
      w.group.rotation.y += 0.008;
    }

    this.renderer.render(this.scene, this.camera);
  }

  private startEntry(): void {
    if (!this.gameState.is(GameStateType.Idle)) return;
    this.gameState.transition(GameStateType.Entering);

    this.ui.setEditEnabled(false);
    this.ui.hideTitle();
    this.ui.showParticipantThemes(this.participants);

    playEntryAnimation(this.capsules, this.camera, () => {
      this.ui.hideParticipantThemes();
      this.ui.showHandleButton();
      this.gameState.transition(GameStateType.Ready);
    });
  }

  private spinGacha(): void {
    if (!this.gameState.is(GameStateType.Ready)) return;
    this.gameState.transition(GameStateType.Spinning);
    this.ui.disableHandleButton();
    this.ui.fadeOutParticipantThemes();

    const { timeout } = playSpinAnimation(
      this.machine.group,
      this.machine.handle,
      this.capsules,
      (winnerIndex) => {
        this.spinTimeout = null;
        this.winnerIndex = winnerIndex;
        this.gameState.transition(GameStateType.Revealing);
        this.revealWinner();
      },
    );
    this.spinTimeout = timeout;
  }

  private revealWinner(): void {
    playRevealAnimation(
      this.capsules,
      this.winnerIndex,
      this.camera,
      (position) => createSparkles(this.scene, position),
      () => {
        this.gameState.transition(GameStateType.Done);
        this.ui.showResetButton();
        this.ui.showResult(this.participants[this.winnerIndex]);
        createConfetti(this.scene);
      },
    );
  }

  private openEditor(): void {
    if (!this.gameState.is(GameStateType.Idle)) return;
    this.ui.openEditor(this.participants);
  }

  private applyParticipantEdits(nextParticipants: Participant[]): void {
    if (!this.gameState.is(GameStateType.Idle)) return;
    window.location.assign(encodeParticipantsToURL(nextParticipants));
  }

  private resetGame(): void {
    this.killAllAnimations();

    this.ui.hideResult();
    this.ui.resetAll();
    this.ui.setEditEnabled(true);

    gsap.to(this.camera.position, { x: 0, y: 3.5, z: 9, duration: 1, ease: "power2.out" });
    gsap.to(this.machine.group.position, { x: 0, y: 0, z: 0, duration: 0.5 });
    gsap.to(this.machine.group.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });
    this.machine.handle.rotation.x = 0;

    this.capsules.forEach((c, i) => {
      gsap.to(c.group.position, { x: -2 + i * 1.3, y: 6, z: 0, duration: 0.8, ease: "power2.out" });
      gsap.to(c.group.rotation, { x: 0, y: 0, z: 0, duration: 0.8 });
      gsap.to(c.group.scale, { x: 1, y: 1, z: 1, duration: 0.5 });
    });

    this.winnerIndex = -1;
    this.gameState.reset();
  }

  private killAllAnimations(): void {
    this.capsules.forEach((c) => {
      gsap.killTweensOf(c.group.position);
      gsap.killTweensOf(c.group.rotation);
      gsap.killTweensOf(c.group.scale);
    });
    gsap.killTweensOf(this.machine.group.position);
    gsap.killTweensOf(this.machine.group.rotation);
    gsap.killTweensOf(this.machine.handle.rotation);
    gsap.killTweensOf(this.camera.position);
    if (this.spinTimeout) {
      clearTimeout(this.spinTimeout);
      this.spinTimeout = null;
    }
  }

  destroy(): void {
    this.loop.dispose();
    this.sizes.dispose();
    this.renderer.dispose();
  }
}
