import gsap from "gsap";
import * as THREE from "three";
import type { CaptureBall } from "@/objects/CaptureBall";

export function playDispenseAnimation(
  ball: CaptureBall,
  nestTrayPosition: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
  domeLight: THREE.PointLight,
  cameraPosition: THREE.Vector3,
  onComplete: () => void,
): gsap.core.Timeline {
  const tl = gsap.timeline();
  const trayTarget = nestTrayPosition.clone().add(new THREE.Vector3(0, 0.5, 0));

  tl.to(
    ball.group.scale,
    {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.25,
      ease: "sine.out",
    },
    0,
  );

  tl.to(
    ball.group.position,
    {
      keyframes: [
        {
          x: 0,
          y: 3.28,
          z: 0.88,
          duration: 0.32,
          ease: "sine.inOut",
        },
        {
          x: trayTarget.x,
          y: trayTarget.y + 0.16,
          z: trayTarget.z + 0.12,
          duration: 0.62,
          ease: "power2.in",
        },
        {
          x: trayTarget.x,
          y: trayTarget.y,
          z: trayTarget.z,
          duration: 0.28,
          ease: "bounce.out",
        },
      ],
    },
    0.02,
  );

  tl.to(
    ball.group.rotation,
    {
      x: -0.04,
      y: Math.PI * 1.6,
      z: 0.06,
      duration: 1.22,
      ease: "sine.inOut",
    },
    0.02,
  );

  tl.to(
    camera.position,
    {
      x: cameraPosition.x,
      y: cameraPosition.y,
      z: cameraPosition.z,
      duration: 1.12,
      ease: "power2.inOut",
      onUpdate: () => camera.lookAt(trayTarget.x, trayTarget.y + 0.08, trayTarget.z + 0.06),
    },
    0,
  );

  tl.to(
    domeLight,
    {
      intensity: 0,
      duration: 0.72,
      ease: "sine.out",
    },
    0.38,
  );

  tl.call(onComplete, undefined, ">0.15");
  return tl;
}
