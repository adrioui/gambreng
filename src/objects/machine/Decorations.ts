import * as THREE from "three";
import { MACHINE_COLORS, PALETTE, STYLE_COLORS } from "@/config";
import { createToonMaterial } from "@/materials/toon";

export function createDecorations(group: THREE.Group): void {
  // Star studs
  const starMat = createToonMaterial({
    color: MACHINE_COLORS.star,
    emissive: STYLE_COLORS.accentSoft,
    emissiveIntensity: 0.16,
    outline: { thickness: 0.0022, alpha: 0.7 },
  });
  const starPositions: [number, number, number][] = [
    [-1.0, 1.5, 1.0],
    [1.0, 1.5, 1.0],
    [-0.7, 2.7, 1.15],
    [0.7, 2.7, 1.15],
    [0, 3.2, 1.2],
  ];
  starPositions.forEach((position) => {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), starMat);
    star.position.set(...position);
    group.add(star);
  });

  // Side panels
  const sideMat = createToonMaterial({
    color: MACHINE_COLORS.sidePanel,
    emissive: PALETTE.ink.soft,
    emissiveIntensity: 0.09,
    outline: { thickness: 0.0028, alpha: 0.8 },
  });
  ([-1, 1] as const).forEach((side) => {
    const sidePanel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2, 1.5), sideMat);
    sidePanel.position.set(side * 1.55, 2.1, 0);
    group.add(sidePanel);
  });
}
