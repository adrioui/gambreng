import * as THREE from "three";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { STYLE_COLORS } from "@/config";

const sketchShader = {
  name: "SketchPass",
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(1, 1) },
    time: { value: 0 },
    edgeColor: { value: new THREE.Color(STYLE_COLORS.outline) },
    paperTint: { value: new THREE.Color(STYLE_COLORS.paper) },
    edgeStrength: { value: 0.72 },
    paperStrength: { value: 0.18 },
    wobbleStrength: { value: 0.85 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float time;
    uniform vec3 edgeColor;
    uniform vec3 paperTint;
    uniform float edgeStrength;
    uniform float paperStrength;
    uniform float wobbleStrength;

    varying vec2 vUv;

    float sketchLuma(vec3 color) {
      return dot(color, vec3(0.299, 0.587, 0.114));
    }

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);

      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));

      vec2 u = f * f * (3.0 - 2.0 * f);

      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
      vec2 texel = 1.0 / resolution;
      vec2 wobble = vec2(
        sin(vUv.y * 92.0 + time * 0.85) * 0.45 + sin(vUv.y * 214.0 - time * 1.2) * 0.1,
        sin(vUv.x * 71.0 - time * 0.65) * 0.35
      ) * texel * wobbleStrength;
      vec2 uv = vUv + wobble;

      float tl = sketchLuma(texture2D(tDiffuse, uv + texel * vec2(-1.0, -1.0)).rgb);
      float tc = sketchLuma(texture2D(tDiffuse, uv + texel * vec2(0.0, -1.0)).rgb);
      float tr = sketchLuma(texture2D(tDiffuse, uv + texel * vec2(1.0, -1.0)).rgb);
      float ml = sketchLuma(texture2D(tDiffuse, uv + texel * vec2(-1.0, 0.0)).rgb);
      float mr = sketchLuma(texture2D(tDiffuse, uv + texel * vec2(1.0, 0.0)).rgb);
      float bl = sketchLuma(texture2D(tDiffuse, uv + texel * vec2(-1.0, 1.0)).rgb);
      float bc = sketchLuma(texture2D(tDiffuse, uv + texel * vec2(0.0, 1.0)).rgb);
      float br = sketchLuma(texture2D(tDiffuse, uv + texel * vec2(1.0, 1.0)).rgb);

      float gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;
      float gy = -tl - 2.0 * tc - tr + bl + 2.0 * bc + br;
      float edge = smoothstep(0.12, 0.4, length(vec2(gx, gy)));

      vec3 base = texture2D(tDiffuse, uv).rgb;
      float coarseGrain = noise(vUv * resolution * 0.55 + time * 0.03);
      float fineGrain = noise(vUv * resolution * 1.6 - time * 0.02);
      float fiber = sin((vUv.y + noise(vUv * 14.0) * 0.012) * resolution.y * 0.1);
      float paper = (coarseGrain - 0.5) * 0.18 + (fineGrain - 0.5) * 0.06 + fiber * 0.025;

      vec3 warmed = base * mix(vec3(1.0), paperTint, 0.14);
      warmed += paperTint * paper * paperStrength;

      vec3 finalColor = mix(warmed, edgeColor, clamp(edge * edgeStrength, 0.0, 0.88));
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};

export class SketchPass extends ShaderPass {
  constructor() {
    super(sketchShader);
  }

  setTime(time: number): void {
    this.uniforms.time.value = time;
  }

  override setSize(width: number, height: number): void {
    this.uniforms.resolution.value.set(width, height);
  }
}
