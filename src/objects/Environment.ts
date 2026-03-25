import * as THREE from "three";
import { PALETTE, STYLE_COLORS } from "@/config";
import { applyOutlineParameters, createPaperTexture, createToonMaterial } from "@/materials/toon";
import { colorToHex } from "@/utils/colorToHex";

function toRgba(color: number, alpha: number): string {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export class Environment {
  constructor(scene: THREE.Scene) {
    this.createSky(scene);
    this.createGround(scene);
    this.createGroundRing(scene);
    this.setupLights(scene);
    scene.fog = new THREE.FogExp2(STYLE_COLORS.fog, 0.02);
  }

  private createSky(scene: THREE.Scene): void {
    const skyGeo = new THREE.SphereGeometry(40, 32, 32);
    const skyCanvas = document.createElement("canvas");
    skyCanvas.width = 1024;
    skyCanvas.height = 1024;

    const ctx = skyCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to create sky canvas context");
    }

    const grad = ctx.createLinearGradient(0, 0, 0, skyCanvas.height);
    grad.addColorStop(0, colorToHex(STYLE_COLORS.skyTop));
    grad.addColorStop(0.42, colorToHex(STYLE_COLORS.skyMid));
    grad.addColorStop(1, colorToHex(STYLE_COLORS.skyBottom));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);

    for (let i = 0; i < 2600; i++) {
      const radius = 0.8 + Math.random() * 3;
      ctx.fillStyle = toRgba(PALETTE.paper.dark, 0.01 + Math.random() * 0.03);
      ctx.beginPath();
      ctx.arc(
        Math.random() * skyCanvas.width,
        Math.random() * skyCanvas.height,
        radius,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    for (let i = 0; i < 180; i++) {
      const x = Math.random() * skyCanvas.width;
      const y = Math.random() * skyCanvas.height;
      const length = 20 + Math.random() * 60;
      const angle = Math.random() * Math.PI;
      ctx.strokeStyle = toRgba(PALETTE.ink.soft, 0.03 + Math.random() * 0.04);
      ctx.lineWidth = 0.5 + Math.random() * 1.1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length * 0.5);
      ctx.stroke();
    }

    const skyTex = new THREE.CanvasTexture(skyCanvas);
    skyTex.colorSpace = THREE.SRGBColorSpace;
    skyTex.needsUpdate = true;

    const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide });
    applyOutlineParameters(skyMat, { visible: false, keepAlive: false });
    scene.add(new THREE.Mesh(skyGeo, skyMat));
  }

  private createGround(scene: THREE.Scene): void {
    const groundGeo = new THREE.CircleGeometry(15, 64);
    const paperTexture = createPaperTexture({
      baseColor: PALETTE.paper.mid,
      fleckColor: PALETTE.paper.dark,
      fiberColor: PALETTE.earth.dark,
    });
    paperTexture.repeat.set(8, 8);

    const groundMat = createToonMaterial({
      color: STYLE_COLORS.ground,
      emissive: STYLE_COLORS.groundShadow,
      emissiveIntensity: 0.04,
      map: paperTexture,
      outline: { visible: false, keepAlive: false },
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);
  }

  private createGroundRing(scene: THREE.Scene): void {
    const ringGeo = new THREE.RingGeometry(2.8, 3.2, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: STYLE_COLORS.accentSoft,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });
    applyOutlineParameters(ringMat, { visible: false, keepAlive: false });

    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);
  }

  private setupLights(scene: THREE.Scene): void {
    scene.add(new THREE.AmbientLight(PALETTE.paper.mid, 0.9));

    const key = new THREE.DirectionalLight(0xfff3dd, 1.15);
    key.position.set(4.8, 8.2, 6.2);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 25;
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 8;
    key.shadow.camera.bottom = -2;
    key.shadow.bias = -0.001;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xd4a57e, 0.5);
    fill.position.set(-5.5, 4.2, -3.2);
    scene.add(fill);
  }
}
