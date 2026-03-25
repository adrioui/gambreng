import * as THREE from "three";
import { MACHINE_COLORS } from "@/config";
import { createTrimMaterial } from "@/objects/machine/materials";

interface DomeResult {
  mesh: THREE.Mesh;
  light: THREE.PointLight;
}

export function createDome(group: THREE.Group): DomeResult {
  // Glass sphere
  const domeGeo = new THREE.SphereGeometry(1.5, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const domeMat = new THREE.MeshPhysicalMaterial({
    color: MACHINE_COLORS.dome,
    transparent: true,
    opacity: 0.22,
    metalness: 0,
    roughness: 0.04,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMapIntensity: 0.7,
    transmission: 0.08,
    thickness: 0.2,
    ior: 1.12,
  });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.y = 3.6;
  dome.scale.y = 1.15;
  group.add(dome);

  // Dome border ring
  const trimMat = createTrimMaterial();
  const domeBorder = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.07, 12, 48), trimMat);
  domeBorder.rotation.x = Math.PI / 2;
  domeBorder.position.y = 3.6;
  group.add(domeBorder);

  // Interior light (starts off)
  const domeLight = new THREE.PointLight(0xfaab36, 0, 5);
  domeLight.position.set(0, 4.2, 0);
  group.add(domeLight);

  return { mesh: dome, light: domeLight };
}
