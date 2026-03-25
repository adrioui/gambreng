import gsap from "gsap";
import * as THREE from "three";
import type { OrbitSystem } from "@/objects/OrbitSystem";

export function playBuildUpAnimation(
  orbitSystem: OrbitSystem,
  domeLight: THREE.PointLight,
  camera: THREE.PerspectiveCamera,
  machine: THREE.Group,
  onComplete: () => void,
): gsap.core.Timeline {
  const tl = gsap.timeline();

  tl.to(
    orbitSystem,
    {
      speed: 1.6,
      duration: 0.75,
      ease: "sine.inOut",
    },
    0,
  );

  tl.to(
    orbitSystem,
    {
      insideBlend: 0.4,
      chaos: 0.18,
      duration: 1.1,
      ease: "sine.inOut",
    },
    0.35,
  );

  tl.to(
    orbitSystem,
    {
      speed: 4.9,
      insideBlend: 1,
      chaos: 0.72,
      duration: 1.7,
      ease: "power2.inOut",
    },
    1.0,
  );

  tl.to(
    domeLight,
    {
      intensity: 1.65,
      distance: 5.6,
      duration: 2.6,
      ease: "sine.inOut",
    },
    0,
  );

  tl.to(
    camera.position,
    {
      x: 0.12,
      y: 3.55,
      z: 9.4,
      duration: 2.7,
      ease: "power2.inOut",
      onUpdate: () => camera.lookAt(0, 3.95, 0),
    },
    0,
  );

  tl.to(
    machine.rotation,
    {
      z: 0.01,
      duration: 0.45,
      ease: "sine.inOut",
      yoyo: true,
      repeat: 5,
    },
    1.05,
  );

  tl.to(
    machine.position,
    {
      x: 0.022,
      z: -0.016,
      duration: 0.16,
      ease: "sine.inOut",
      yoyo: true,
      repeat: 11,
    },
    1.28,
  );

  tl.to(
    machine.position,
    {
      x: 0,
      z: 0,
      duration: 0.5,
      ease: "sine.out",
    },
    2.72,
  );
  tl.to(
    machine.rotation,
    {
      z: 0,
      duration: 0.5,
      ease: "sine.out",
    },
    2.72,
  );

  tl.call(onComplete, undefined, ">0.05");
  return tl;
}
