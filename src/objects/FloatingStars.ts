import * as THREE from "three";
import { FX_COLORS } from "@/config";
import { applyOutlineParameters } from "@/materials/toon";
import type { LoopCallback } from "@/types";

export class FloatingStars implements LoopCallback {
  private stars: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene) {
    for (let i = 0; i < 20; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: FX_COLORS.floatingStars[Math.floor(Math.random() * FX_COLORS.floatingStars.length)],
        transparent: true,
        opacity: 0.22 + Math.random() * 0.12,
      });
      applyOutlineParameters(material, { visible: false, keepAlive: false });

      const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.04 + Math.random() * 0.06, 0),
        material,
      );
      star.position.set(
        (Math.random() - 0.5) * 16,
        Math.random() * 8 + 1,
        (Math.random() - 0.5) * 12,
      );
      star.userData.speed = 0.002 + Math.random() * 0.005;
      star.userData.offset = Math.random() * Math.PI * 2;
      scene.add(star);
      this.stars.push(star);
    }
  }

  update(_delta: number, elapsed: number): void {
    this.stars.forEach((star) => {
      star.position.y += Math.sin(elapsed * 0.5 + star.userData.offset) * 0.003;
      star.rotation.x += star.userData.speed;
      star.rotation.y += star.userData.speed * 0.7;
    });
  }
}
