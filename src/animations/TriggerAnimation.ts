import gsap from "gsap";
import * as THREE from "three";

export function playTriggerAnimation(
  handle: THREE.Group,
  camera: THREE.PerspectiveCamera,
  onComplete: () => void,
): gsap.core.Timeline {
  const tl = gsap.timeline();

  // Handle crank — 3 full rotations
  tl.to(
    handle.rotation,
    {
      x: Math.PI * 6,
      duration: 1.5,
      ease: "power2.inOut",
    },
    0,
  );

  // Camera slight zoom
  tl.to(
    camera.position,
    {
      z: 11,
      y: 3.0,
      duration: 1.0,
      ease: "power2.inOut",
      onUpdate: () => camera.lookAt(0, 2.5, 0),
    },
    0,
  );

  tl.call(onComplete, undefined, ">0.1");
  return tl;
}
