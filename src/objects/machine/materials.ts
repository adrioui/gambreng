import * as THREE from "three";
import { MACHINE_COLORS } from "@/config";

export function createTrimMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: MACHINE_COLORS.trim,
    metalness: 0.7,
    roughness: 0.25,
  });
}
