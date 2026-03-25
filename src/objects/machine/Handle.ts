import * as THREE from "three";
import { MACHINE_COLORS, PALETTE, STYLE_COLORS } from "@/config";
import { createToonMaterial } from "@/materials/toon";

/** Raycasting layer for interactive objects */
export const INTERACTIVE_LAYER = 1;

export function createHandle(group: THREE.Group): THREE.Group {
  const handle = new THREE.Group();

  const stemMat = createToonMaterial({
    color: MACHINE_COLORS.handleStem,
    emissive: PALETTE.ink.soft,
    emissiveIntensity: 0.08,
    outline: { thickness: 0.0036 },
  });

  const handleStem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 12), stemMat);
  handleStem.rotation.x = Math.PI / 2;
  handleStem.position.set(0, 1.7, 1.55);
  handleStem.layers.enable(INTERACTIVE_LAYER);
  handle.add(handleStem);

  const handleArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.06), stemMat);
  handleArm.position.set(0, 1.25, 1.8);
  handleArm.layers.enable(INTERACTIVE_LAYER);
  handle.add(handleArm);

  const handleBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 16, 16),
    createToonMaterial({
      color: MACHINE_COLORS.handleBall,
      emissive: STYLE_COLORS.accentSoft,
      emissiveIntensity: 0.14,
      outline: { thickness: 0.0032 },
    }),
  );
  handleBall.position.set(0, 0.78, 1.8);
  handleBall.layers.enable(INTERACTIVE_LAYER);
  handle.add(handleBall);

  group.add(handle);
  return handle;
}
