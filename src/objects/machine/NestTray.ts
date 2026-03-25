import * as THREE from "three";
import { MACHINE_COLORS } from "@/config";
import { createTrimMaterial } from "@/objects/machine/materials";

export function createNestTray(group: THREE.Group): THREE.Mesh {
  // Bowl profile — half-circle with flat bottom
  const points: THREE.Vector2[] = [];
  const bowlRadius = 0.6;
  const bowlDepth = 0.3;
  const segments = 20;
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 0.5; // 0 to 90°
    points.push(new THREE.Vector2(bowlRadius * Math.sin(t), -bowlDepth * Math.cos(t)));
  }
  // Add outer rim lip
  points.push(new THREE.Vector2(bowlRadius + 0.05, 0));
  points.push(new THREE.Vector2(bowlRadius + 0.05, 0.05));

  const bowlGeo = new THREE.LatheGeometry(points, 32);
  const bowlMat = new THREE.MeshStandardMaterial({
    color: MACHINE_COLORS.chute,
    metalness: 0.3,
    roughness: 0.5,
  });
  const bowl = new THREE.Mesh(bowlGeo, bowlMat);
  bowl.position.set(0, 0.85, 1.7);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  group.add(bowl);

  // Trim ring around bowl
  const trimMat = createTrimMaterial();
  const trimRing = new THREE.Mesh(new THREE.TorusGeometry(bowlRadius + 0.05, 0.04, 8, 32), trimMat);
  trimRing.rotation.x = Math.PI / 2;
  trimRing.position.set(0, 0.9, 1.7);
  group.add(trimRing);

  return bowl;
}
