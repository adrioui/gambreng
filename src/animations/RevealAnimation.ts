import gsap from "gsap";
import * as THREE from "three";
import type { Capsule } from "@/objects/Capsule";

export function playRevealAnimation(
  capsules: Capsule[],
  winnerIndex: number,
  camera: THREE.PerspectiveCamera,
  onSparkle: (position: THREE.Vector3) => void,
  onComplete: () => void,
): gsap.core.Timeline {
  const tl = gsap.timeline();

  // Losers drop
  capsules.forEach((c, i) => {
    if (i !== winnerIndex) {
      tl.to(
        c.group.position,
        { y: -4, x: (Math.random() - 0.5) * 5, duration: 0.6, ease: "power2.in" },
        0.06 * i,
      );
      tl.to(
        c.group.scale,
        { x: 0.15, y: 0.15, z: 0.15, duration: 0.6, ease: "power2.in" },
        0.06 * i,
      );
    }
  });

  const w = capsules[winnerIndex];

  // Winner to chute
  tl.to(w.group.position, { x: 0, y: 1.5, z: 2.2, duration: 0.8, ease: "power2.out" }, 0.4);
  tl.to(w.group.rotation, { x: 0, y: Math.PI * 2, z: 0, duration: 0.8, ease: "power2.out" }, 0.4);

  // Pop forward
  tl.to(w.group.position, { x: 0, y: 2.5, z: 4, duration: 0.5, ease: "back.out(1.5)" }, ">0.1");

  // Camera zoom
  tl.to(camera.position, { z: 7.5, y: 3, duration: 0.8, ease: "power2.out" }, "<");

  // Scale up
  tl.to(
    w.group.scale,
    { x: 1.6, y: 1.6, z: 1.6, duration: 0.5, ease: "elastic.out(1, 0.5)" },
    ">0",
  );

  // Sparkles
  tl.call(() => onSparkle(w.group.position), undefined, ">0.1");

  // Dramatic spin
  tl.to(w.group.rotation, { y: `+=${Math.PI * 4}`, duration: 1.2, ease: "power2.out" }, "<");

  tl.call(onComplete, undefined, ">0.3");
  return tl;
}
