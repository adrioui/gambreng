import * as THREE from "three";
import { MACHINE_COLORS, PALETTE, STYLE_COLORS } from "@/config";
import { createToonMaterial } from "@/materials/toon";
import { createTrimMaterial } from "@/objects/machine/materials";

export function createTopCap(group: THREE.Group): void {
  // Cap
  const capMat = createToonMaterial({
    color: MACHINE_COLORS.cap,
    emissive: PALETTE.earth.dark,
    emissiveIntensity: 0.07,
    outline: { thickness: 0.0044 },
  });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.82, 0.56, 32), capMat);
  cap.position.y = 5.18;
  cap.castShadow = true;
  group.add(cap);

  // Knob
  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 16),
    createToonMaterial({
      color: MACHINE_COLORS.handleBall,
      emissive: STYLE_COLORS.accentSoft,
      emissiveIntensity: 0.12,
      outline: { thickness: 0.0038 },
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
