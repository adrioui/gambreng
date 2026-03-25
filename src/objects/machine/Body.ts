import * as THREE from "three";
import { MACHINE_COLORS } from "@/config";
import { createTrimMaterial } from "@/objects/machine/materials";
import { createRoundedBox } from "@/utils/roundedBox";

export function createBody(group: THREE.Group): void {
  // Main body — rounded box
  const bodyMat = new THREE.MeshStandardMaterial({
    color: MACHINE_COLORS.body,
    metalness: 0.1,
    roughness: 0.75,
  });
  const body = createRoundedBox(3.0, 2.8, 2.4, 0.2);
  body.material = bodyMat;
  body.position.y = 2.2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Front face panel — slightly inset rectangle on front
  const panelMat = new THREE.MeshStandardMaterial({
    color: MACHINE_COLORS.panel,
    metalness: 0.2,
    roughness: 0.6,
  });
  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 0.1), panelMat);
  panel.position.set(0, 2, 1.25);
  group.add(panel);

  // Trim rings — horizontal box-shaped trim strips instead of torus
  const trimMat = createTrimMaterial();
  [1.2, 2.0, 2.8, 3.5].forEach((y) => {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.08, 2.5), trimMat);
    trim.position.y = y;
    group.add(trim);
  });
}
