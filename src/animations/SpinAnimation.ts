import gsap from "gsap";
import * as THREE from "three";
import type { Capsule } from "@/objects/Capsule";

export function playSpinAnimation(
  machine: THREE.Group,
  handle: THREE.Group,
  capsules: Capsule[],
  onComplete: (winnerIndex: number) => void,
): { timeline: gsap.core.Timeline; timeout: ReturnType<typeof setTimeout> } {
  // Handle spin
  gsap.to(handle.rotation, { x: Math.PI * 10, duration: 2.5, ease: "power2.inOut" });

  // Machine shake
  const shakeTL = gsap.timeline();
  for (let i = 0; i < 25; i++) {
    shakeTL.to(machine.position, {
      x: (Math.random() - 0.5) * 0.15,
      z: (Math.random() - 0.5) * 0.08,
      duration: 0.06 + Math.random() * 0.05,
    });
    shakeTL.to(
      machine.rotation,
      {
        z: (Math.random() - 0.5) * 0.02,
        duration: 0.06 + Math.random() * 0.05,
      },
      "<",
    );
  }
  shakeTL.to(machine.position, { x: 0, z: 0, duration: 0.3, ease: "power2.out" });
  shakeTL.to(machine.rotation, { z: 0, duration: 0.3, ease: "power2.out" }, "<");

  // Capsule shuffle
  capsules.forEach((capsule) => {
    const sTL = gsap.timeline();
    for (let j = 0; j < 25; j++) {
      sTL.to(capsule.group.position, {
        x: (Math.random() - 0.5) * 1.8,
        y: 3.5 + Math.random() * 1.5,
        z: (Math.random() - 0.5) * 1.2,
        duration: 0.06 + Math.random() * 0.08,
      });
      sTL.to(
        capsule.group.rotation,
        {
          x: `+=${Math.random() * Math.PI * 2}`,
          y: `+=${Math.random() * Math.PI * 2}`,
          z: `+=${Math.random() * Math.PI}`,
          duration: 0.06 + Math.random() * 0.08,
        },
        "<",
      );
    }
  });

  const timeout = setTimeout(() => {
    killSpinAnimations(machine, handle, capsules);
    gsap.to(machine.position, { x: 0, y: 0, z: 0, duration: 0.4, ease: "power2.out" });
    gsap.to(machine.rotation, { x: 0, y: 0, z: 0, duration: 0.4, ease: "power2.out" });
    handle.rotation.x = 0;
    const winnerIndex = Math.floor(Math.random() * capsules.length);
    onComplete(winnerIndex);
  }, 2800);

  return { timeline: shakeTL, timeout };
}

function killSpinAnimations(machine: THREE.Group, handle: THREE.Group, capsules: Capsule[]): void {
  capsules.forEach((c) => {
    gsap.killTweensOf(c.group.position);
    gsap.killTweensOf(c.group.rotation);
    gsap.killTweensOf(c.group.scale);
  });
  gsap.killTweensOf(machine.position);
  gsap.killTweensOf(machine.rotation);
  gsap.killTweensOf(handle.rotation);
}
