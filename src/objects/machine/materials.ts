import * as THREE from "three";
import { MACHINE_COLORS, PALETTE } from "@/config";
import { createToonMaterial } from "@/materials/toon";

export function createTrimMaterial(): THREE.MeshToonMaterial {
  return createToonMaterial({
    color: MACHINE_COLORS.trim,
    emissive: PALETTE.ink.soft,
    emissiveIntensity: 0.08,
    outline: { thickness: 0.0042 },
  });
}
