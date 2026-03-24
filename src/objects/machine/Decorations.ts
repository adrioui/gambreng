import * as THREE from "three";
import { MACHINE_COLORS } from "@/config";

export function createDecorations(group: THREE.Group): void {
  // Star studs
  const starMat = new THREE.MeshStandardMaterial({
    color: MACHINE_COLORS.star,
    metalness: 0.6,
    roughness: 0.3,
  });
  const starPositions: [number, number, number][] = [
    [-1.1, 1.5, 1.3],
    [1.1, 1.5, 1.3],
    [-0.8, 2.7, 1.45],
    [0.8, 2.7, 1.45],
    [0, 3.2, 1.5],
  ];
  starPositions.forEach((p) => {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), starMat);
    star.position.set(...p);
    group.add(star);
  });

  // Side panels
  const sideMat = new THREE.MeshStandardMaterial({
    color: MACHINE_COLORS.sidePanel,
    metalness: 0.1,
    roughness: 0.8,
  });
  ([-1, 1] as const).forEach((side) => {
    const sidePanel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2, 1.5), sideMat);
    sidePanel.position.set(side * 1.55, 2.1, 0.3);
    group.add(sidePanel);
  });
}
