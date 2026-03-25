import * as THREE from "three";
import { MACHINE_COLORS, PALETTE } from "@/config";
import { createToonMaterial } from "@/materials/toon";
import { createTrimMaterial } from "@/objects/machine/materials";
import { createRoundedBox } from "@/utils/roundedBox";

export function createBody(group: THREE.Group): void {
  // Main body — rounded box
  const bodyMat = createToonMaterial({
    color: MACHINE_COLORS.body,
    emissive: PALETTE.earth.dark,
    emissiveIntensity: 0.08,
    outline: { thickness: 0.0046 },
  });
  const body = createRoundedBox(3.0, 2.8, 2.4, 0.2);
  body.material = bodyMat;
  body.position.y = 2.2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Front face panel — slightly inset rectangle on front
  const panelMat = createToonMaterial({
    color: MACHINE_COLORS.panel,
    emissive: PALETTE.paper.dark,
    emissiveIntensity: 0.04,
    outline: { thickness: 0.0036 },
  });
  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 0.1), panelMat);
  panel.position.set(0, 2, 1.3);
  group.add(panel);

  // Trim rings — horizontal box-shaped trim strips instead of torus
  const trimMat = createTrimMaterial();
  [1.2, 2.0, 2.8, 3.5].forEach((y) => {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.08, 2.5), trimMat);
    trim.position.y = y;
    group.add(trim);
  });
}
