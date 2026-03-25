import * as THREE from "three";
import { PALETTE, STYLE_COLORS } from "@/config";
import { colorToHex } from "@/utils/colorToHex";

type OutlineOptions = {
  thickness?: number;
  alpha?: number;
  color?: THREE.ColorRepresentation;
  visible?: boolean;
  keepAlive?: boolean;
};

type ToonMaterialOptions = THREE.MeshToonMaterialParameters & {
  outline?: OutlineOptions;
};

type PaperTextureOptions = {
  size?: number;
  baseColor?: number;
  fleckColor?: number;
  fiberColor?: number;
};

let sharedGradientMap: THREE.CanvasTexture | null = null;

function toRgba(color: number, alpha: number): string {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getGradientMap(): THREE.CanvasTexture {
  if (sharedGradientMap) return sharedGradientMap;

  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 1;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to create toon gradient map canvas context");
  }

  [36, 112, 196, 255].forEach((value, index) => {
    ctx.fillStyle = `rgb(${value}, ${value}, ${value})`;
    ctx.fillRect(index, 0, 1, 1);
  });

  sharedGradientMap = new THREE.CanvasTexture(canvas);
  sharedGradientMap.colorSpace = THREE.NoColorSpace;
  sharedGradientMap.minFilter = THREE.NearestFilter;
  sharedGradientMap.magFilter = THREE.NearestFilter;
  sharedGradientMap.generateMipmaps = false;
  sharedGradientMap.needsUpdate = true;

  return sharedGradientMap;
}

export function applyOutlineParameters(
  material: THREE.Material,
  options: OutlineOptions = {},
): void {
  const color = new THREE.Color(options.color ?? STYLE_COLORS.outline);
  material.userData.outlineParameters = {
    thickness: options.thickness ?? 0.004,
    color: color.toArray(),
    alpha: options.alpha ?? 1,
    visible: options.visible ?? true,
    keepAlive: options.keepAlive ?? true,
  };
}

export function createToonMaterial(options: ToonMaterialOptions): THREE.MeshToonMaterial {
  const { outline, gradientMap, ...materialOptions } = options;
  const material = new THREE.MeshToonMaterial({
    gradientMap: gradientMap ?? getGradientMap(),
    ...materialOptions,
  });

  applyOutlineParameters(material, outline);
  return material;
}

export function createPaperTexture(options: PaperTextureOptions = {}): THREE.CanvasTexture {
  const size = options.size ?? 256;
  const baseColor = options.baseColor ?? PALETTE.paper.light;
  const fleckColor = options.fleckColor ?? PALETTE.paper.dark;
  const fiberColor = options.fiberColor ?? PALETTE.ink.soft;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to create paper texture canvas context");
  }

  ctx.fillStyle = colorToHex(baseColor);
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < size * 7; i++) {
    const radius = 0.4 + Math.random() * 1.8;
    ctx.fillStyle = toRgba(fleckColor, 0.015 + Math.random() * 0.045);
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 160; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const angle = Math.random() * Math.PI;
    const length = size * (0.04 + Math.random() * 0.09);

    ctx.strokeStyle = toRgba(fiberColor, 0.03 + Math.random() * 0.06);
    ctx.lineWidth = 0.35 + Math.random() * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length * 0.35);
    ctx.stroke();
  }

  ctx.fillStyle = toRgba(0xffffff, 0.06);
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
