import * as THREE from "three";
import { MACHINE_COLORS } from "@/config";

export function createHandle(group: THREE.Group): THREE.Group {
  const handle = new THREE.Group();

  const stemMat = new THREE.MeshStandardMaterial({
    color: MACHINE_COLORS.handleStem,
    metalness: 0.6,
    roughness: 0.3,
  });

  const handleStem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 12), stemMat);
  handleStem.rotation.x = Math.PI / 2;
  handleStem.position.set(0, 1.7, 1.85);
  handle.add(handleStem);

  const handleArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.06), stemMat);
  handleArm.position.set(0, 1.25, 2.1);
  handle.add(handleArm);

  const handleBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 16, 16),
    new THREE.MeshStandardMaterial({
      color: MACHINE_COLORS.handleBall,
      metalness: 0.7,
      roughness: 0.2,
    }),
  );
  handleBall.position.set(0, 0.78, 2.1);
  handle.add(handleBall);

  group.add(handle);
  return handle;
}
