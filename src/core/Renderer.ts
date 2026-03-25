import * as THREE from "three";
import { OutlineEffect } from "three/examples/jsm/effects/OutlineEffect.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import type { Sizes } from "@/core/Sizes";
import { STYLE_COLORS } from "@/config";
import { SketchPass } from "@/postprocessing/SketchPass";

export class Renderer {
  instance: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private composer: EffectComposer;
  private renderPass: RenderPass;
  private sketchPass: SketchPass;
  private outputPass: OutputPass;
  private outlineEffect: OutlineEffect;
  private renderingOutline = false;

  constructor(
    canvas: HTMLCanvasElement,
    sizes: Sizes,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
  ) {
    this.scene = scene;
    this.instance = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.instance.setSize(sizes.width, sizes.height);
    this.instance.setPixelRatio(sizes.pixelRatio);
    this.instance.setClearColor(STYLE_COLORS.fog, 1);
    this.instance.shadowMap.enabled = true;
    this.instance.shadowMap.type = THREE.PCFShadowMap;
    this.instance.toneMapping = THREE.NoToneMapping;
    this.instance.toneMappingExposure = 1;
    this.instance.outputColorSpace = THREE.SRGBColorSpace;

    this.outlineEffect = new OutlineEffect(this.instance, {
      defaultThickness: 0.004,
      defaultColor: new THREE.Color(STYLE_COLORS.outline).toArray(),
      defaultAlpha: 1,
      defaultKeepAlive: true,
    });
    this.outlineEffect.setPixelRatio(sizes.pixelRatio);
    this.outlineEffect.setSize(sizes.width, sizes.height);

    this.renderPass = new RenderPass(scene, camera);
    this.sketchPass = new SketchPass();
    this.outputPass = new OutputPass();

    this.composer = new EffectComposer(this.instance);
    this.composer.setPixelRatio(sizes.pixelRatio);
    this.composer.setSize(sizes.width, sizes.height);
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.sketchPass);
    this.composer.addPass(this.outputPass);

    this.scene.onAfterRender = (_renderer, renderedScene, renderedCamera) => {
      if (this.renderingOutline) return;
      this.renderingOutline = true;
      this.outlineEffect.renderOutline(renderedScene, renderedCamera);
      this.renderingOutline = false;
    };

    sizes.on("resize", () => {
      this.instance.setSize(sizes.width, sizes.height);
      this.instance.setPixelRatio(sizes.pixelRatio);
      this.outlineEffect.setPixelRatio(sizes.pixelRatio);
      this.outlineEffect.setSize(sizes.width, sizes.height);
      this.composer.setPixelRatio(sizes.pixelRatio);
      this.composer.setSize(sizes.width, sizes.height);
    });
  }

  render(elapsed: number): void {
    this.sketchPass.setTime(elapsed);
    this.composer.render();
  }

  dispose(): void {
    this.scene.onAfterRender = () => undefined;
    this.sketchPass.dispose();
    this.outputPass.dispose();
    this.composer.dispose();
    this.instance.dispose();
  }
}
