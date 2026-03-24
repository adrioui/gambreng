import * as THREE from "three";
import { MACHINE_COLORS, PALETTE } from "@/config";

export function createExitChute(group: THREE.Group): void {
  // Chute
  const chuteMat = new THREE.MeshStandardMaterial({
    color: MACHINE_COLORS.chute,
    metalness: 0.3,
    roughness: 0.5,
  });
  const chute = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.9, 1.0), chuteMat);
  chute.position.set(0, 0.75, 2.0);
  chute.castShadow = true;
  group.add(chute);

  // Chute opening
  const opening = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.6, 0.12),
    new THREE.MeshStandardMaterial({ color: PALETTE.black }),
  );
  opening.position.set(0, 0.8, 2.52);
  group.add(opening);

  // Chute trim
  const trimMat = new THREE.MeshStandardMaterial({
    color: MACHINE_COLORS.trim,
    metalness: 0.7,
    roughness: 0.25,
  });
  const chuteTrim = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.75, 0.08), trimMat);
  chuteTrim.position.set(0, 0.8, 2.54);
  group.add(chuteTrim);
}
