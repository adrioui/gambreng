import * as THREE from "three";
import { PALETTE, STYLE_COLORS } from "@/config";
import { applyOutlineParameters } from "@/materials/toon";
import { colorToHex } from "@/utils/colorToHex";

function toRgba(color: number, alpha: number): string {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function createLabel(group: THREE.Group): void {
  const stickerMat = new THREE.MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  applyOutlineParameters(stickerMat, { visible: false, keepAlive: false });

  const stickerMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.68), stickerMat);
  stickerMesh.position.set(0, 2.92, 1.36);
  stickerMesh.rotation.z = -0.03;
  stickerMesh.renderOrder = 1;
  group.add(stickerMesh);

  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 768;
  labelCanvas.height = 256;
  const ctx = labelCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to create label canvas context");
  }

  ctx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);

  ctx.beginPath();
  ctx.moveTo(80, 58);
  ctx.quadraticCurveTo(120, 24, 202, 42);
  ctx.lineTo(560, 32);
  ctx.quadraticCurveTo(674, 28, 696, 86);
  ctx.quadraticCurveTo(728, 134, 680, 194);
  ctx.quadraticCurveTo(628, 228, 556, 216);
  ctx.lineTo(190, 222);
  ctx.quadraticCurveTo(90, 228, 58, 170);
  ctx.quadraticCurveTo(32, 116, 80, 58);
  ctx.closePath();
  ctx.fillStyle = colorToHex(PALETTE.paper.light);
  ctx.fill();
  ctx.lineWidth = 12;
  ctx.lineJoin = "round";
  ctx.strokeStyle = colorToHex(PALETTE.ink.brown);
  ctx.stroke();

  for (let i = 0; i < 420; i++) {
    const radius = 0.4 + Math.random() * 1.6;
    ctx.fillStyle = toRgba(PALETTE.paper.dark, 0.02 + Math.random() * 0.04);
    ctx.beginPath();
    ctx.arc(
      Math.random() * labelCanvas.width,
      Math.random() * labelCanvas.height,
      radius,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.strokeStyle = colorToHex(PALETTE.ink.brown);
  ctx.lineWidth = 18;
  ctx.font = 'bold 116px "Comic Sans MS", "Trebuchet MS", cursive';
  ctx.strokeText("GAMBRENG", 384, 108);
  ctx.fillStyle = colorToHex(PALETTE.maroon.mid);
  ctx.fillText("GAMBRENG", 384, 108);

  ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
  ctx.lineWidth = 8;
  ctx.strokeStyle = colorToHex(PALETTE.paper.light);
  ctx.strokeText("acak tema & pemenang", 384, 176);
  ctx.fillStyle = colorToHex(STYLE_COLORS.accent);
  ctx.fillText("acak tema & pemenang", 384, 176);

  const texture = new THREE.CanvasTexture(labelCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  stickerMat.map = texture;
  stickerMat.needsUpdate = true;
}
