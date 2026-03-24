import gsap from "gsap";
import * as THREE from "three";
import type { Capsule } from "@/objects/Capsule";

export function playEntryAnimation(
  capsules: Capsule[],
  camera: THREE.PerspectiveCamera,
  onComplete: () => void,
): gsap.core.Timeline {
  const tl = gsap.timeline();

  // Camera move closer
  tl.to(camera.position, { z: 8, y: 3.2, duration: 1, ease: "power2.inOut" }, 0);

  capsules.forEach((capsule, i) => {
    capsule.group.rotation.set(0, 0, 0);
    capsule.group.scale.set(1, 1, 1);

    // Fly to lineup
    tl.to(
      capsule.group.position,
      {
        x: -1.8 + i * 1.2,
        y: 2.5,
        z: 3.5,
        duration: 0.9,
        ease: "back.out(1.5)",
      },
      0.4 + i * 0.12,
    );

    tl.to(
      capsule.group.rotation,
      {
        y: Math.PI * 2,
        duration: 0.9,
        ease: "power2.out",
      },
      0.4 + i * 0.12,
    );

    // Fly into dome
    tl.to(
      capsule.group.position,
      {
        x: (Math.random() - 0.5) * 1.2,
        y: 4 + Math.random() * 0.8,
        z: (Math.random() - 0.5) * 0.8,
        duration: 0.7,
        ease: "power3.in",
      },
      `>${i * 0.06 + 0.3}`,
    );

    // Bounce settle inside
    tl.to(
      capsule.group.position,
      {
        y: 3.8 + Math.random() * 0.6,
        duration: 0.5,
        ease: "bounce.out",
      },
      ">0",
    );
  });

  tl.call(onComplete, undefined, ">0.2");
  return tl;
}
