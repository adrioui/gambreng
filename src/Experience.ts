import * as THREE from "three";
import gsap from "gsap";
import { Sizes } from "@/core/Sizes";
import { Renderer } from "@/core/Renderer";
import { Loop } from "@/core/Loop";
import { Machine } from "@/objects/Machine";
import { CaptureBall } from "@/objects/CaptureBall";
import { OrbitSystem } from "@/objects/OrbitSystem";
import { Environment } from "@/objects/Environment";
import { FloatingStars } from "@/objects/FloatingStars";
import { GameState } from "@/state/GameState";
import { UIManager } from "@/ui/UIManager";
import { encodeParticipantsToURL } from "@/config";
import { GameStateType } from "@/types";
import type { Participant, LoopCallback } from "@/types";
import { playTriggerAnimation } from "@/animations/TriggerAnimation";
import { playBuildUpAnimation } from "@/animations/BuildUpAnimation";
import { playCaptureAnimation } from "@/animations/CaptureAnimation";
import { playDispenseAnimation } from "@/animations/DispenseAnimation";
import { playHatchAnimation } from "@/animations/HatchAnimation";
import { createConfetti } from "@/effects/ConfettiEffect";
import { createSparkles } from "@/effects/SparkleEffect";
import { INTERACTIVE_LAYER } from "@/objects/machine/Handle";

const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 2.5, 0);

export class Experience implements LoopCallback {
  canvas!: HTMLCanvasElement;
  sizes!: Sizes;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: Renderer;
  loop!: Loop;
  machine!: Machine;
  balls!: CaptureBall[];
  orbitSystem!: OrbitSystem;
  floatingStars!: FloatingStars;
  gameState!: GameState;
  ui!: UIManager;
  participants!: Participant[];
  winnerIndex = -1;
  private raycaster!: THREE.Raycaster;
  private mouse!: THREE.Vector2;
  private handleBall!: THREE.Object3D;
  private handleHovered = false;
  private cameraTarget = DEFAULT_CAMERA_TARGET.clone();

  constructor(canvas: HTMLCanvasElement, participants: Participant[]) {
    this.canvas = canvas;
    this.participants = participants;

    this.sizes = new Sizes();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, this.sizes.width / this.sizes.height, 0.1, 100);
    this.camera.position.set(0, 3.0, 12);
    this.camera.lookAt(DEFAULT_CAMERA_TARGET);
    this.renderer = new Renderer(canvas, this.sizes);
    this.loop = new Loop();

    this.sizes.on("resize", () => {
      this.camera.aspect = this.sizes.width / this.sizes.height;
      this.camera.updateProjectionMatrix();
    });

    new Environment(this.scene);
    this.machine = new Machine(this.scene);
    this.balls = participants.map((participant, index) => {
      const ball = new CaptureBall(participant, index);
      ball.addToScene(this.scene);
      return ball;
    });
    this.orbitSystem = new OrbitSystem(this.balls, this.scene);
    this.floatingStars = new FloatingStars(this.scene);
    this.handleBall = this.machine.handle.children[2] ?? this.machine.handle;

    this.gameState = new GameState();
    this.ui = new UIManager();
    this.ui.bindEvents({
      start: () => this.triggerGacha(),
      reset: () => this.resetGame(),
      edit: () => this.openEditor(),
      saveParticipants: (nextParticipants) => this.applyParticipantEdits(nextParticipants),
    });
    this.ui.setEditEnabled(true);

    this.loop.add(this);
    this.loop.add(this.floatingStars);
    this.loop.start();

    gsap.from(this.camera.position, { y: 6, z: 14, duration: 2.5, ease: "power3.out" });

    this.raycaster = new THREE.Raycaster();
    this.raycaster.layers.set(INTERACTIVE_LAYER);
    this.mouse = new THREE.Vector2();

    canvas.addEventListener("click", (event) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const hits = this.raycaster.intersectObjects(this.machine.handle.children, true);
      if (hits.length > 0 && this.gameState.is(GameStateType.Idle)) {
        this.setHandleHover(false);
        this.triggerGacha();
      }
    });

    canvas.addEventListener("mousemove", (event) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const hits = this.raycaster.intersectObjects(this.machine.handle.children, true);
      const hovered = hits.length > 0 && this.gameState.is(GameStateType.Idle);
      if (hovered !== this.handleHovered) {
        this.setHandleHover(hovered);
      }
    });

    canvas.addEventListener("mouseleave", () => {
      this.setHandleHover(false);
    });
  }

  update(delta: number, elapsed: number): void {
    if (this.gameState.is(GameStateType.Idle)) {
      this.machine.group.position.y = Math.sin(elapsed * 0.7) * 0.04;
      this.machine.group.rotation.y = Math.sin(elapsed * 0.3) * 0.03;
      this.orbitSystem.update(delta, elapsed);
    } else if (
      this.gameState.is(GameStateType.BuildingUp) ||
      this.gameState.is(GameStateType.Capturing)
    ) {
      this.machine.group.position.y = Math.sin(elapsed * 0.7) * 0.02;
      this.orbitSystem.update(delta, elapsed);
      this.orbitSystem.updateTrail();
    }

    if (this.gameState.is(GameStateType.Idle) || this.gameState.is(GameStateType.Done)) {
      this.cameraTarget.lerp(DEFAULT_CAMERA_TARGET, Math.min(1, delta * 5));
      this.camera.lookAt(this.cameraTarget);
    }

    this.renderer.render(this.scene, this.camera);
  }

  private triggerGacha(): void {
    if (!this.gameState.is(GameStateType.Idle)) return;

    this.setHandleHover(false);
    this.gameState.transition(GameStateType.Triggered);
    this.ui.setEditEnabled(false);
    this.ui.hideTitle();
    this.ui.showParticipantThemes(this.participants);

    playTriggerAnimation(this.machine.handle, this.camera, () => {
      this.machine.handle.rotation.x = 0;
      this.gameState.transition(GameStateType.BuildingUp);
      this.buildUp();
    });
  }

  private buildUp(): void {
    playBuildUpAnimation(
      this.orbitSystem,
      this.machine.domeLight,
      this.camera,
      this.machine.group,
      () => {
        this.gameState.transition(GameStateType.Capturing);
        this.capture();
      },
    );
  }

  private capture(): void {
    this.ui.fadeOutParticipantThemes();

    playCaptureAnimation(
      this.balls,
      this.orbitSystem,
      this.machine.domeLight,
      this.camera,
      (winnerIndex) => {
        this.winnerIndex = winnerIndex;
        this.gameState.transition(GameStateType.Dispensing);
        this.dispense();
      },
    );
  }

  private dispense(): void {
    const winner = this.balls[this.winnerIndex];
    const nestPosition = this.machine.nestTray.position.clone();

    playDispenseAnimation(winner, nestPosition, this.camera, this.machine.domeLight, () => {
      this.gameState.transition(GameStateType.Hatching);
      this.hatchBall();
    });
  }

  private hatchBall(): void {
    const winner = this.balls[this.winnerIndex];

    playHatchAnimation(
      winner,
      this.camera,
      this.scene,
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

    this.ui.hideResult(true);
    this.ui.resetAll();
    this.ui.setEditEnabled(true);
    this.setHandleHover(false);
    this.cameraTarget.copy(DEFAULT_CAMERA_TARGET);

    gsap.to(this.camera.position, { x: 0, y: 3.0, z: 12, duration: 1, ease: "power2.out" });
    gsap.to(this.machine.group.position, { x: 0, y: 0, z: 0, duration: 0.5 });
    gsap.to(this.machine.group.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });
    this.machine.handle.rotation.x = 0;
    this.machine.domeLight.intensity = 0;

    this.balls.forEach((ball) => {
      ball.reset();
    });
    this.orbitSystem.reattach();

    this.winnerIndex = -1;
    this.gameState.reset();
  }

  private killAllAnimations(): void {
    this.balls.forEach((ball) => {
      gsap.killTweensOf(ball.group.position);
      gsap.killTweensOf(ball.group.rotation);
      gsap.killTweensOf(ball.group.scale);
      gsap.killTweensOf(ball.topPivot.position);
      gsap.killTweensOf(ball.topPivot.rotation);
      gsap.killTweensOf(ball.topPivot.scale);
      gsap.killTweensOf(ball.bottomShell.position);
      gsap.killTweensOf(ball.bottomShell.rotation);
      gsap.killTweensOf(ball.bottomShell.scale);
      gsap.killTweensOf(ball.seamRing.scale);
      gsap.killTweensOf(ball.buttonFront.position);
      gsap.killTweensOf(ball.buttonFront.scale);
      gsap.killTweensOf(ball.buttonBack.position);
      gsap.killTweensOf(ball.buttonBack.scale);
      gsap.killTweensOf(ball.innerGlow.scale);
      gsap.killTweensOf(ball.innerGlowMaterial);
      gsap.killTweensOf(ball.seamMaterial);
      gsap.killTweensOf(ball.buttonCoreMaterial);
      gsap.killTweensOf(ball.topMaterial);
    });
    gsap.killTweensOf(this.machine.group.position);
    gsap.killTweensOf(this.machine.group.rotation);
    gsap.killTweensOf(this.machine.handle.rotation);
    gsap.killTweensOf(this.handleBall.scale);
    gsap.killTweensOf(this.machine.domeLight);
    gsap.killTweensOf(this.orbitSystem);
    gsap.killTweensOf(this.camera.position);
  }

  private setHandleHover(hovered: boolean): void {
    this.handleHovered = hovered;
    this.canvas.style.cursor = hovered ? "pointer" : "default";
    gsap.to(this.handleBall.scale, {
      x: hovered ? 1.2 : 1,
      y: hovered ? 1.2 : 1,
      z: hovered ? 1.2 : 1,
      duration: 0.2,
      overwrite: true,
    });
  }

  destroy(): void {
    this.setHandleHover(false);
    this.orbitSystem.dispose();
    this.loop.dispose();
    this.sizes.dispose();
    this.renderer.dispose();
  }
}
