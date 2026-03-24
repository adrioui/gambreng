import * as THREE from "three";
import type { Participant } from "@/types";
import { colorToHex } from "@/utils/colorToHex";

export class Capsule {
  group: THREE.Group;

  constructor(participant: Participant, index: number) {
    this.group = new THREE.Group();

    // Top half (colored)
    const topGeo = new THREE.SphereGeometry(0.38, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const topMat = new THREE.MeshStandardMaterial({
      color: participant.color,
      metalness: 0.35,
      roughness: 0.3,
    });
    this.group.add(new THREE.Mesh(topGeo, topMat));

    // Bottom half (white)
    const bottomGeo = new THREE.SphereGeometry(
      0.38,
      32,
      16,
      0,
      Math.PI * 2,
      Math.PI / 2,
      Math.PI / 2,
    );
    const bottomMat = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      metalness: 0.2,
      roughness: 0.25,
    });
    this.group.add(new THREE.Mesh(bottomGeo, bottomMat));

    // Band
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.37, 0.035, 8, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.2 }),
    );
    band.rotation.x = Math.PI / 2;
    this.group.add(band);

    // Label
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = colorToHex(participant.color);
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`P${index + 1}`, 64, 66);

    const labelTex = new THREE.CanvasTexture(canvas);
    const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true });

    const labelFront = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), labelMat);
    labelFront.position.set(0, 0.1, 0.33);
    this.group.add(labelFront);

    const labelBack = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), labelMat.clone());
    labelBack.position.set(0, 0.1, -0.33);
    labelBack.rotation.y = Math.PI;
    this.group.add(labelBack);

    // Glow ring
    const glow = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.4, 24),
      new THREE.MeshBasicMaterial({
        color: participant.color,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -0.35;
    this.group.add(glow);

    this.group.position.set(-2 + index * 1.3, 6, 0);
    this.group.userData = { index, color: participant.color };
    this.group.castShadow = true;
  }

  addToScene(scene: THREE.Scene): void {
    scene.add(this.group);
  }
}
