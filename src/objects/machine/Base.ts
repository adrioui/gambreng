import * as THREE from "three";
import { MACHINE_COLORS } from "@/config";
import { createTrimMaterial } from "@/objects/machine/materials";

export function createBase(group: THREE.Group): void {
  // Feet (4 stubby legs)
  const footMat = new THREE.MeshStandardMaterial({
    color: MACHINE_COLORS.foot,
    metalness: 0.4,
    roughness: 0.6,
  });
  for (let i = 0; i < 4; i++) {
    const angle = ((Math.PI * 2) / 4) * i + Math.PI / 4;
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.3, 8), footMat);
    foot.position.set(Math.cos(angle) * 1.5, 0.15, Math.sin(angle) * 1.5);
    foot.castShadow = true;
    group.add(foot);
  }

  // Base platform
  const baseMat = new THREE.MeshStandardMaterial({
    color: MACHINE_COLORS.base,
    metalness: 0.15,
    roughness: 0.7,
  });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2, 0.5, 32), baseMat);
  base.position.y = 0.55;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Base trim ring
  const baseTrim = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.06, 8, 48), createTrimMaterial());
  baseTrim.rotation.x = Math.PI / 2;
  baseTrim.position.y = 0.8;
  group.add(baseTrim);
}
