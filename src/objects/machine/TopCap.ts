import * as THREE from "three";
import { MACHINE_COLORS } from "@/config";
import { createTrimMaterial } from "@/objects/machine/materials";

export function createTopCap(group: THREE.Group): void {
  // Cap
  const capMat = new THREE.MeshStandardMaterial({
    color: MACHINE_COLORS.cap,
    metalness: 0.15,
    roughness: 0.6,
  });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.82, 0.56, 32), capMat);
  cap.position.y = 5.18;
  cap.castShadow = true;
  group.add(cap);

  // Golden knob
  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 16),
    new THREE.MeshStandardMaterial({
      color: MACHINE_COLORS.handleBall,
      metalness: 0.7,
      roughness: 0.2,
    }),
  );
  knob.position.y = 5.6;
  group.add(knob);

  // Cap trim
  const trimMat = createTrimMaterial();
  const capTrim = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.05, 8, 32), trimMat);
  capTrim.rotation.x = Math.PI / 2;
  capTrim.position.y = 4.9;
  group.add(capTrim);
}
