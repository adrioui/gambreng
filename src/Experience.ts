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

const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 2.65, 0);
const BUILD_UP_CAMERA_TARGET = new THREE.Vector3(0, 3.95, 0);
const CAPTURE_CAMERA_TARGET = new THREE.Vector3(0, 3.92, 0.05);
const CAMERA_BLEND_MIN_WIDTH = 640;
const CAMERA_BLEND_MAX_WIDTH = 960;

type CameraLayout = {
  idle: THREE.Vector3;
  intro: THREE.Vector3;
  trigger: THREE.Vector3;
  buildUp: THREE.Vector3;
  capture: THREE.Vector3;
  dispense: THREE.Vector3;
  hatch: THREE.Vector3;
  hatchEnd: THREE.Vector3;
};

const DESKTOP_CAMERA_LAYOUT: CameraLayout = {
  idle: new THREE.Vector3(0, 3.1, 12.15),
  intro: new THREE.Vector3(0, 5.9, 14.1),
  trigger: new THREE.Vector3(0.08, 3.15, 10.95),
  buildUp: new THREE.Vector3(0.12, 3.55, 9.4),
  capture: new THREE.Vector3(0.25, 3.85, 7.55),
  dispense: new THREE.Vector3(0.1, 2.22, 8.75),
  hatch: new THREE.Vector3(0, 2.5, 6.95),
  hatchEnd: new THREE.Vector3(0, 3.1, 10.15),
};

const MOBILE_CAMERA_LAYOUT: CameraLayout = {
  idle: new THREE.Vector3(0, 3.14, 14.6),
  intro: new THREE.Vector3(0, 6.2, 16.4),
  trigger: new THREE.Vector3(0.06, 3.18, 13.25),
  buildUp: new THREE.Vector3(0.1, 3.62, 11.55),
  capture: new THREE.Vector3(0.18, 3.9, 9.45),
  dispense: new THREE.Vector3(0.06, 2.34, 10.65),
  hatch: new THREE.Vector3(0, 2.56, 8.95),
  hatchEnd: new THREE.Vector3(0, 3.12, 11.95),
};

function getCameraBlend(width: number): number {
  if (width <= CAMERA_BLEND_MIN_WIDTH) return 1;
  if (width >= CAMERA_BLEND_MAX_WIDTH) return 0;
  return (CAMERA_BLEND_MAX_WIDTH - width) / (CAMERA_BLEND_MAX_WIDTH - CAMERA_BLEND_MIN_WIDTH);
}

function lerpVector(start: THREE.Vector3, end: THREE.Vector3, alpha: number): THREE.Vector3 {
  return start.clone().lerp(end, alpha);
}

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
  private cameraLayout: CameraLayout = DESKTOP_CAMERA_LAYOUT;

  constructor(canvas: HTMLCanvasElement, participants: Participant[]) {
    this.canvas = canvas;
    this.participants = participants;

    this.sizes = new Sizes();
    this.updateCameraLayout();

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, this.sizes.width / this.sizes.height, 0.1, 100);
    this.camera.position.copy(this.cameraLayout.idle);
    this.camera.lookAt(DEFAULT_CAMERA_TARGET);
    this.renderer = new Renderer(canvas, this.sizes, this.scene, this.camera);
    this.loop = new Loop();

    this.sizes.on("resize", () => {
      this.camera.aspect = this.sizes.width / this.sizes.height;
      this.camera.updateProjectionMatrix();
      this.updateCameraLayout();
      this.applyResponsiveCameraLayout();
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

    gsap.from(this.camera.position, {
      x: this.cameraLayout.intro.x,
      y: this.cameraLayout.intro.y,
      z: this.cameraLayout.intro.z,
      duration: 2.5,
      ease: "power3.out",
      onUpdate: () => this.camera.lookAt(DEFAULT_CAMERA_TARGET),
    });

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

    this.renderer.render(elapsed);
  }

  private updateCameraLayout(): void {
    const blend = getCameraBlend(this.sizes.width);
    this.cameraLayout = {
      idle: lerpVector(DESKTOP_CAMERA_LAYOUT.idle, MOBILE_CAMERA_LAYOUT.idle, blend),
      intro: lerpVector(DESKTOP_CAMERA_LAYOUT.intro, MOBILE_CAMERA_LAYOUT.intro, blend),
      trigger: lerpVector(DESKTOP_CAMERA_LAYOUT.trigger, MOBILE_CAMERA_LAYOUT.trigger, blend),
      buildUp: lerpVector(DESKTOP_CAMERA_LAYOUT.buildUp, MOBILE_CAMERA_LAYOUT.buildUp, blend),
      capture: lerpVector(DESKTOP_CAMERA_LAYOUT.capture, MOBILE_CAMERA_LAYOUT.capture, blend),
      dispense: lerpVector(DESKTOP_CAMERA_LAYOUT.dispense, MOBILE_CAMERA_LAYOUT.dispense, blend),
      hatch: lerpVector(DESKTOP_CAMERA_LAYOUT.hatch, MOBILE_CAMERA_LAYOUT.hatch, blend),
      hatchEnd: lerpVector(DESKTOP_CAMERA_LAYOUT.hatchEnd, MOBILE_CAMERA_LAYOUT.hatchEnd, blend),
    };
  }

  private applyResponsiveCameraLayout(): void {
    if (!this.gameState || this.gameState.is(GameStateType.Idle)) {
      this.camera.position.copy(this.cameraLayout.idle);
      this.cameraTarget.copy(DEFAULT_CAMERA_TARGET);
      this.camera.lookAt(this.cameraTarget);
      return;
    }

    if (this.gameState.is(GameStateType.Done)) {
      this.camera.position.copy(this.cameraLayout.hatchEnd);
      this.cameraTarget.copy(DEFAULT_CAMERA_TARGET);
      this.camera.lookAt(this.cameraTarget);
    }
  }

  private triggerGacha(): void {
    if (!this.gameState.is(GameStateType.Idle)) return;

    this.setHandleHover(false);
    this.gameState.transition(GameStateType.Triggered);
    this.ui.setEditEnabled(false);
    this.ui.hideTitle();
    this.ui.showParticipantThemes(this.participants);

    playTriggerAnimation(
      this.machine.handle,
      this.camera,
      {
        position: this.cameraLayout.trigger,
        lookAt: DEFAULT_CAMERA_TARGET,
      },
      () => {
        this.machine.handle.rotation.x = 0;
        this.gameState.transition(GameStateType.BuildingUp);
        this.buildUp();
      },
    );
  }

  private buildUp(): void {
    playBuildUpAnimation(
      this.orbitSystem,
      this.machine.domeLight,
      this.camera,
      this.machine.group,
      {
        position: this.cameraLayout.buildUp,
        lookAt: BUILD_UP_CAMERA_TARGET,
      },
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
      {
        position: this.cameraLayout.capture,
        lookAt: CAPTURE_CAMERA_TARGET,
      },
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

    playDispenseAnimation(
      winner,
      nestPosition,
      this.camera,
      this.machine.domeLight,
      this.cameraLayout.dispense,
      () => {
        this.gameState.transition(GameStateType.Hatching);
        this.hatchBall();
      },
    );
  }

  private hatchBall(): void {
    const winner = this.balls[this.winnerIndex];

    playHatchAnimation(
      winner,
      this.camera,
      this.scene,
      {
        closePosition: this.cameraLayout.hatch,
        settlePosition: this.cameraLayout.hatchEnd,
        settleLookAt: DEFAULT_CAMERA_TARGET,
      },
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

    gsap.to(this.camera.position, {
      x: this.cameraLayout.idle.x,
      y: this.cameraLayout.idle.y,
      z: this.cameraLayout.idle.z,
      duration: 1,
      ease: "power2.out",
    });
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
