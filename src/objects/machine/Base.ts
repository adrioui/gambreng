import * as THREE from "three";
import { MACHINE_COLORS, PALETTE } from "@/config";
import { createToonMaterial } from "@/materials/toon";
import { createTrimMaterial } from "@/objects/machine/materials";

export function createBase(group: THREE.Group): void {
  // Feet (4 stubby legs at box corners)
  const footMat = createToonMaterial({
    color: MACHINE_COLORS.foot,
    emissive: PALETTE.ink.soft,
    emissiveIntensity: 0.12,
    outline: { thickness: 0.003, alpha: 0.84 },
  });
  const footPositions: [number, number][] = [
    [-1.3, -1.0],
    [1.3, -1.0],
    [-1.3, 1.0],
    [1.3, 1.0],
  ];
  footPositions.forEach(([x, z]) => {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.3, 8), footMat);
    foot.position.set(x, 0.15, z);
    foot.castShadow = true;
    group.add(foot);
  });

  // Base platform — rectangular
  const baseMat = createToonMaterial({
    color: MACHINE_COLORS.base,
    emissive: PALETTE.earth.dark,
    emissiveIntensity: 0.08,
    outline: { thickness: 0.0032, alpha: 0.8 },
  });
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.5, 2.6), baseMat);
  base.position.y = 0.55;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Base trim — horizontal strip around the top edge of the base
  const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.08, 2.7), createTrimMaterial());
  baseTrim.position.y = 0.8;
  group.add(baseTrim);
}
