import gsap from "gsap";
import * as THREE from "three";
import type { CaptureBall } from "@/objects/CaptureBall";

export function playHatchAnimation(
  ball: CaptureBall,
  camera: THREE.PerspectiveCamera,
  _scene: THREE.Scene,
  onSparkle: (position: THREE.Vector3) => void,
  onComplete: () => void,
): gsap.core.Timeline {
  const tl = gsap.timeline();
  const basePosition = ball.group.position.clone();

  tl.to(
    ball.seamMaterial,
    {
      emissiveIntensity: 1.15,
      duration: 1.35,
      ease: "sine.inOut",
    },
    0,
  );
  tl.to(
    ball.buttonCoreMaterial,
    {
      emissiveIntensity: 0.85,
      duration: 1.35,
      ease: "sine.inOut",
    },
    0,
  );
  tl.to(
    ball.topMaterial,
    {
      emissiveIntensity: 0.3,
      duration: 1.35,
      ease: "sine.inOut",
    },
    0,
  );

  const shakeSteps = 18;
  for (let index = 0; index < shakeSteps; index++) {
    const progress = (index + 1) / shakeSteps;
    const intensity = 0.012 + progress * 0.16;
    const duration = 0.08 - progress * 0.025;
    const side = index % 2 === 0 ? 1 : -1;

    tl.to(ball.group.rotation, {
      z: side * intensity,
      x: (Math.random() - 0.5) * intensity * 0.45,
      y: side * intensity * 0.2,
      duration,
      ease: "sine.inOut",
    });

    tl.to(
      ball.group.position,
      {
        x: basePosition.x + side * intensity * 0.15,
        y: basePosition.y + Math.sin(progress * Math.PI) * 0.05,
        duration,
        ease: "sine.inOut",
      },
      "<",
    );

    tl.to(
      ball.buttonFront.scale,
      {
        x: 1 + progress * 0.2,
        y: 1 + progress * 0.2,
        z: 1 + progress * 0.2,
        duration,
        ease: "sine.inOut",
      },
      "<",
    );
  }

  tl.to(ball.group.position, {
    x: basePosition.x,
    y: basePosition.y + 0.08,
    duration: 0.08,
    ease: "power2.in",
  });
  tl.to(ball.group.position, {
    x: basePosition.x,
    y: basePosition.y,
    duration: 0.14,
    ease: "power2.out",
  });
  tl.to(
    ball.group.rotation,
    {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.14,
      ease: "power2.out",
    },
    "<",
  );

  tl.to(
    camera.position,
    {
      x: 0,
      y: 2.5,
      z: 6.95,
      duration: 1.55,
      ease: "power2.inOut",
      onUpdate: () => camera.lookAt(ball.group.position),
    },
    0,
  );

  tl.call(() => {
    ball.innerGlow.visible = true;
  });
  tl.to(ball.innerGlowMaterial, {
    opacity: 0.55,
    duration: 0.18,
    ease: "sine.out",
  });
  tl.to(
    ball.innerGlow.scale,
    {
      x: 1.9,
      y: 1.9,
      z: 1.9,
      duration: 0.32,
      ease: "sine.out",
    },
    "<",
  );
  tl.to(
    ball.seamRing.scale,
    {
      x: 1.06,
      y: 1.06,
      z: 1.06,
      duration: 0.18,
      ease: "sine.out",
    },
    "<",
  );
  tl.to(
    ball.buttonFront.position,
    {
      z: "+=0.024",
      duration: 0.18,
      ease: "sine.out",
    },
    "<",
  );

  tl.to(
    ball.topPivot.rotation,
    {
      x: -2.05,
      y: 0.14,
      z: 0.32,
      duration: 0.62,
      ease: "back.out(1.25)",
    },
    "<+0.04",
  );
  tl.to(
    ball.topPivot.position,
    {
      x: 0.05,
      y: 0.13,
      z: -0.03,
      duration: 0.62,
      ease: "back.out(1.25)",
    },
    "<",
  );
  tl.to(
    ball.bottomShell.rotation,
    {
      x: 0.1,
      z: -0.03,
      duration: 0.42,
      ease: "sine.out",
    },
    "<",
  );
  tl.to(
    ball.bottomShell.position,
    {
      y: -0.015,
      duration: 0.42,
      ease: "sine.out",
    },
    "<",
  );
  tl.to(
    ball.buttonFront.scale,
    {
      x: 1.24,
      y: 1.24,
      z: 1.24,
      duration: 0.3,
      ease: "back.out(1.6)",
    },
    "<",
  );
  tl.to(
    ball.seamMaterial,
    {
      emissiveIntensity: 0.22,
      duration: 0.45,
      ease: "sine.out",
    },
    "<+0.05",
  );
  tl.to(
    ball.buttonCoreMaterial,
    {
      emissiveIntensity: 0.25,
      duration: 0.45,
      ease: "sine.out",
    },
    "<",
  );
  tl.to(
    ball.innerGlowMaterial,
    {
      opacity: 0,
      duration: 0.45,
      ease: "sine.out",
    },
    "<+0.05",
  );

  tl.call(() => onSparkle(ball.group.position.clone()), undefined, "<+0.04");

  tl.to(
    ball.topPivot.rotation,
    {
      x: -1.92,
      y: 0.1,
      z: 0.24,
      duration: 0.38,
      ease: "sine.inOut",
    },
    ">0.1",
  );
  tl.to(
    ball.topPivot.position,
    {
      x: 0.035,
      y: 0.1,
      z: -0.015,
      duration: 0.38,
      ease: "sine.inOut",
    },
    "<",
  );
  tl.to(
    ball.seamRing.scale,
    {
      x: 1.02,
      y: 1.02,
      z: 1.02,
      duration: 0.32,
      ease: "sine.out",
    },
    "<",
  );

  tl.to(
    camera.position,
    {
      x: 0,
      y: 3.0,
      z: 10,
      duration: 1.0,
      ease: "sine.out",
      onUpdate: () => camera.lookAt(0, 2.5, 0),
    },
    ">0.2",
  );

  tl.call(
    () => {
      ball.innerGlow.visible = false;
      onComplete();
    },
    undefined,
    ">0.25",
  );

  return tl;
}
