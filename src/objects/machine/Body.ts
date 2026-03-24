import * as THREE from "three";
import { MACHINE_COLORS } from "@/config";
import { createTrimMaterial } from "@/objects/machine/materials";

export function createBody(group: THREE.Group): void {
  // Main column
  const bodyMat = new THREE.MeshStandardMaterial({
    color: MACHINE_COLORS.body,
    metalness: 0.1,
    roughness: 0.75,
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 2.8, 32), bodyMat);
  body.position.y = 2.2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Front face panel
  const panelMat = new THREE.MeshStandardMaterial({
    color: MACHINE_COLORS.panel,
    metalness: 0.2,
    roughness: 0.6,
  });
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 0.1), panelMat);
  panel.position.set(0, 2, 1.55);
  group.add(panel);

  // Gold trim rings on body
  const trimMat = createTrimMaterial();
  [1.2, 2.0, 2.8, 3.5].forEach((y) => {
    const trim = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.04, 8, 48), trimMat);
    trim.rotation.x = Math.PI / 2;
    trim.position.y = y;
    group.add(trim);
  });
}
