import * as THREE from "three";
import { MACHINE_COLORS, PALETTE } from "@/config";

export function createCoinSlot(group: THREE.Group): void {
  // Slot plate
  const slotPlate = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.6, 0.12),
    new THREE.MeshStandardMaterial({
      color: MACHINE_COLORS.coinSlot,
      metalness: 0.5,
      roughness: 0.4,
    }),
  );
  slotPlate.position.set(0, 2.2, 1.3);
  group.add(slotPlate);

  // Coin slot opening
  const slot = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.08, 0.15),
    new THREE.MeshStandardMaterial({ color: PALETTE.black }),
  );
  slot.position.set(0, 2.2, 1.36);
  group.add(slot);
}
