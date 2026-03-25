import gsap from "gsap";
import * as THREE from "three";
import type { CaptureBall } from "@/objects/CaptureBall";
import type { OrbitSystem } from "@/objects/OrbitSystem";

export function playCaptureAnimation(
  balls: CaptureBall[],
  orbitSystem: OrbitSystem,
  domeLight: THREE.PointLight,
  camera: THREE.PerspectiveCamera,
  onComplete: (winnerIndex: number) => void,
): gsap.core.Timeline {
  const tl = gsap.timeline();
  const winnerIndex = Math.floor(Math.random() * balls.length);
  const winner = balls[winnerIndex];

  tl.to(
    orbitSystem,
    {
      speed: 1.4,
      chaos: 0.22,
      duration: 0.8,
      ease: "power2.out",
    },
    0,
  );

  tl.to(
    camera.position,
    {
      x: 0.25,
      y: 3.85,
      z: 7.55,
      duration: 1.55,
      ease: "power2.inOut",
      onUpdate: () => camera.lookAt(0, 3.92, 0.05),
    },
    0.05,
  );

  tl.call(
    () => {
      orbitSystem.detachBall(winnerIndex);
    },
    undefined,
    0.42,
  );

  tl.to(
    winner.group.position,
    {
      x: 0,
      y: 3.95,
      z: 0.14,
      duration: 1.18,
      ease: "power2.out",
    },
    0.38,
  );

  tl.to(
    winner.group.scale,
    {
      x: 1.12,
      y: 1.12,
      z: 1.12,
      duration: 0.75,
      ease: "sine.out",
    },
    0.78,
  );

  tl.to(
    winner.innerGlowMaterial,
    {
      opacity: 0.18,
      duration: 0.45,
      ease: "sine.out",
      onStart: () => {
        winner.innerGlow.visible = true;
      },
    },
    0.8,
  );
  tl.to(
    winner.innerGlow.scale,
    {
      x: 1.35,
      y: 1.35,
      z: 1.35,
      duration: 0.55,
      ease: "sine.out",
    },
    0.8,
  );

  tl.call(
    () => {
      balls.forEach((ball, index) => {
        if (index === winnerIndex) return;

        orbitSystem.detachBall(index);
        gsap.to(ball.group.position, {
          x: (Math.random() - 0.5) * 2.6,
          y: 1.55 + Math.random() * 0.45,
          z: -1.2 - Math.random() * 1.9,
          duration: 1.18,
          ease: "power2.inOut",
        });
        gsap.to(ball.group.scale, {
          x: 0.2,
          y: 0.2,
          z: 0.2,
          duration: 1.05,
          ease: "power2.in",
        });
      });
    },
    undefined,
    0.95,
  );

  tl.to(
    domeLight,
    {
      intensity: 2.1,
      duration: 0.28,
      ease: "sine.in",
    },
    1.12,
  );
  tl.to(
    domeLight,
    {
      intensity: 0.82,
      duration: 0.5,
      ease: "sine.out",
    },
    1.4,
  );

  tl.call(
    () => {
      orbitSystem.hideTrails();
    },
    undefined,
    0.9,
  );

  tl.to(
    winner.innerGlowMaterial,
    {
      opacity: 0,
      duration: 0.45,
      ease: "sine.out",
    },
    1.45,
  );
  tl.to(
    winner.innerGlow.scale,
    {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.45,
      ease: "sine.out",
    },
    1.45,
  );

  tl.call(
    () => {
      winner.innerGlow.visible = false;
      onComplete(winnerIndex);
    },
    undefined,
    ">0.12",
  );

  return tl;
}
