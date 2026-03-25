import gsap from "gsap";
import * as THREE from "three";
import { FX_COLORS } from "@/config";
import { applyOutlineParameters } from "@/materials/toon";

export function createSparkles(scene: THREE.Scene, origin: THREE.Vector3): void {
  const colors = FX_COLORS.sparkles;
  for (let i = 0; i < 35; i++) {
    const geo = new THREE.OctahedronGeometry(0.04 + Math.random() * 0.06, 0);
    const mat = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
    });
    applyOutlineParameters(mat, { visible: false, keepAlive: false });

    const sparkle = new THREE.Mesh(geo, mat);
    sparkle.position.copy(origin);
    scene.add(sparkle);

    const angle = ((Math.PI * 2) / 35) * i;
    const radius = 1.5 + Math.random() * 2.5;
    gsap.to(sparkle.position, {
      x: origin.x + Math.cos(angle) * radius,
      y: origin.y + Math.sin(angle * 0.7) * radius,
      z: origin.z + Math.sin(angle) * radius,
      duration: 0.7 + Math.random() * 0.6,
      ease: "power2.out",
    });
    gsap.to(sparkle.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 1.2,
      ease: "power2.in",
      delay: 0.2,
    });
    gsap.to(sparkle.rotation, {
      x: Math.random() * Math.PI * 4,
      y: Math.random() * Math.PI * 4,
      duration: 1.5,
    });
    setTimeout(() => {
      scene.remove(sparkle);
      geo.dispose();
      mat.dispose();
    }, 2200);
  }
}
