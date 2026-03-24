import * as THREE from "three";
import type { LoopCallback } from "@/types";

export class FloatingStars implements LoopCallback {
  private stars: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xfaab36, transparent: true, opacity: 0.3 });
    for (let i = 0; i < 20; i++) {
      const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.04 + Math.random() * 0.06, 0),
        mat.clone(),
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
    this.stars.forEach((s) => {
      s.position.y += Math.sin(elapsed * 0.5 + s.userData.offset) * 0.003;
      s.rotation.x += s.userData.speed;
      s.rotation.y += s.userData.speed * 0.7;
    });
  }
}
