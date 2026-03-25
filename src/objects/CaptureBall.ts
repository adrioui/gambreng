import * as THREE from "three";
import type { Participant } from "@/types";

const BALL_RADIUS = 0.43;
const SEAM_OFFSET_Z = BALL_RADIUS + 0.012;

function cloneMeshMaterials(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) => material.clone());
      return;
    }

    child.material = child.material.clone();
  });
}

export class CaptureBall {
  group: THREE.Group;
  intact: THREE.Group;
  topPivot: THREE.Group;
  topShell: THREE.Mesh;
  bottomShell: THREE.Mesh;
  seamRing: THREE.Mesh;
  buttonFront: THREE.Group;
  buttonBack: THREE.Group;
  innerGlow: THREE.Mesh;
  topMaterial: THREE.MeshStandardMaterial;
  bottomMaterial: THREE.MeshStandardMaterial;
  seamMaterial: THREE.MeshStandardMaterial;
  buttonRingMaterial: THREE.MeshStandardMaterial;
  buttonCoreMaterial: THREE.MeshStandardMaterial;
  innerGlowMaterial: THREE.MeshBasicMaterial;

  constructor(participant: Participant, index: number) {
    this.group = new THREE.Group();
    this.intact = new THREE.Group();
    this.topPivot = new THREE.Group();

    const topGeo = new THREE.SphereGeometry(BALL_RADIUS, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    const bottomGeo = new THREE.SphereGeometry(
      BALL_RADIUS,
      48,
      24,
      0,
      Math.PI * 2,
      Math.PI / 2,
      Math.PI / 2,
    );

    const participantColor = new THREE.Color(participant.color);

    this.topMaterial = new THREE.MeshStandardMaterial({
      color: participant.color,
      metalness: 0.24,
      roughness: 0.28,
      emissive: participantColor.clone().multiplyScalar(0.08),
      emissiveIntensity: 0.15,
    });
    this.bottomMaterial = new THREE.MeshStandardMaterial({
      color: 0xf7f4ef,
      metalness: 0.08,
      roughness: 0.34,
      emissive: 0x102030,
      emissiveIntensity: 0.03,
    });
    this.seamMaterial = new THREE.MeshStandardMaterial({
      color: 0x0b1118,
      metalness: 0.72,
      roughness: 0.22,
      emissive: 0x74e3ff,
      emissiveIntensity: 0,
    });
    this.buttonRingMaterial = new THREE.MeshStandardMaterial({
      color: 0xd3dde3,
      metalness: 0.82,
      roughness: 0.16,
    });
    this.buttonCoreMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.22,
      roughness: 0.18,
      emissive: 0x7fe8ff,
      emissiveIntensity: 0.12,
    });
    this.innerGlowMaterial = new THREE.MeshBasicMaterial({
      color: participant.color,
      transparent: true,
      opacity: 0,
    });

    this.topShell = new THREE.Mesh(topGeo, this.topMaterial);
    this.topShell.castShadow = true;
    this.topShell.receiveShadow = true;
    this.topPivot.add(this.topShell);

    this.bottomShell = new THREE.Mesh(bottomGeo, this.bottomMaterial);
    this.bottomShell.castShadow = true;
    this.bottomShell.receiveShadow = true;

    this.seamRing = new THREE.Mesh(
      new THREE.TorusGeometry(BALL_RADIUS * 0.985, 0.028, 12, 48),
      this.seamMaterial,
    );
    this.seamRing.rotation.x = Math.PI / 2;
    this.seamRing.castShadow = true;
    this.seamRing.receiveShadow = true;

    this.buttonFront = this.createButton();
    this.buttonFront.position.z = SEAM_OFFSET_Z;

    this.buttonBack = this.createButton();
    this.buttonBack.position.z = -SEAM_OFFSET_Z;
    this.buttonBack.rotation.y = Math.PI;
    this.buttonBack.scale.setScalar(0.92);

    this.innerGlow = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 24), this.innerGlowMaterial);
    this.innerGlow.visible = false;

    this.intact.add(this.bottomShell);
    this.intact.add(this.topPivot);
    this.intact.add(this.seamRing);
    this.intact.add(this.buttonFront);
    this.intact.add(this.buttonBack);

    this.group.add(this.innerGlow);
    this.group.add(this.intact);

    this.group.position.set(-2 + index * 1.3, 6, 0);
    this.group.userData = { index, color: participant.color };
  }

  private createButton(): THREE.Group {
    const button = new THREE.Group();

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.105, 0.018, 10, 32),
      this.buttonRingMaterial,
    );
    ring.castShadow = true;
    ring.receiveShadow = true;

    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.058, 0.03, 24),
      this.buttonCoreMaterial,
    );
    core.rotation.x = Math.PI / 2;
    core.position.z = 0.008;
    core.castShadow = true;
    core.receiveShadow = true;

    button.add(ring);
    button.add(core);
    return button;
  }

  createTrailClone(): THREE.Object3D {
    const clone = this.intact.clone(true);
    clone.scale.copy(this.intact.scale);
    clone.position.copy(this.intact.position);
    clone.quaternion.copy(this.intact.quaternion);
    cloneMeshMaterials(clone);
    return clone;
  }

  reset(): void {
    this.group.scale.set(1, 1, 1);
    this.group.rotation.set(0, 0, 0);
    this.intact.visible = true;

    this.topPivot.position.set(0, 0, 0);
    this.topPivot.rotation.set(0, 0, 0);
    this.topPivot.scale.set(1, 1, 1);

    this.bottomShell.position.set(0, 0, 0);
    this.bottomShell.rotation.set(0, 0, 0);
    this.bottomShell.scale.set(1, 1, 1);

    this.seamRing.visible = true;
    this.seamRing.scale.set(1, 1, 1);

    this.buttonFront.position.set(0, 0, SEAM_OFFSET_Z);
    this.buttonFront.rotation.set(0, 0, 0);
    this.buttonFront.scale.set(1, 1, 1);

    this.buttonBack.position.set(0, 0, -SEAM_OFFSET_Z);
    this.buttonBack.rotation.set(0, Math.PI, 0);
    this.buttonBack.scale.setScalar(0.92);

    this.innerGlow.visible = false;
    this.innerGlow.scale.set(1, 1, 1);
    this.innerGlowMaterial.opacity = 0;

    this.topMaterial.emissiveIntensity = 0.15;
    this.seamMaterial.emissiveIntensity = 0;
    this.buttonCoreMaterial.emissiveIntensity = 0.12;
  }

  addToScene(scene: THREE.Scene): void {
    scene.add(this.group);
  }
}
