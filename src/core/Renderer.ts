import * as THREE from "three";
import type { Sizes } from "@/core/Sizes";

export class Renderer {
  instance: THREE.WebGLRenderer;

  constructor(canvas: HTMLCanvasElement, sizes: Sizes) {
    this.instance = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.instance.setSize(sizes.width, sizes.height);
    this.instance.setPixelRatio(sizes.pixelRatio);
    this.instance.shadowMap.enabled = true;
    this.instance.shadowMap.type = THREE.PCFSoftShadowMap;
    this.instance.toneMapping = THREE.ACESFilmicToneMapping;
    this.instance.toneMappingExposure = 1.1;
    this.instance.outputColorSpace = THREE.SRGBColorSpace;

    sizes.on("resize", () => {
      this.instance.setSize(sizes.width, sizes.height);
      this.instance.setPixelRatio(sizes.pixelRatio);
    });
  }

  render(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.instance.render(scene, camera);
  }

  dispose(): void {
    this.instance.dispose();
  }
}
