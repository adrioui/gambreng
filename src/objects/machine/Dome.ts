import * as THREE from "three";
import { MACHINE_COLORS, PALETTE, STYLE_COLORS } from "@/config";
import { createToonMaterial } from "@/materials/toon";
import { createTrimMaterial } from "@/objects/machine/materials";

interface DomeResult {
  mesh: THREE.Mesh;
  light: THREE.PointLight;
}

export function createDome(group: THREE.Group): DomeResult {
  const domeGeo = new THREE.SphereGeometry(1.5, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const domeMat = createToonMaterial({
    color: MACHINE_COLORS.dome,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    emissive: PALETTE.paper.light,
    emissiveIntensity: 0.14,
    outline: {
      thickness: 0.0026,
      alpha: 0.45,
    },
  });
  domeMat.depthWrite = false;

  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.y = 3.6;
  dome.scale.y = 1.15;
  group.add(dome);

  const trimMat = createTrimMaterial();
  const domeBorder = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.07, 12, 48), trimMat);
  domeBorder.rotation.x = Math.PI / 2;
  domeBorder.position.y = 3.6;
  group.add(domeBorder);

  const domeLight = new THREE.PointLight(STYLE_COLORS.accentSoft, 0, 5);
  domeLight.position.set(0, 4.2, 0);
  group.add(domeLight);

  return { mesh: dome, light: domeLight };
}
