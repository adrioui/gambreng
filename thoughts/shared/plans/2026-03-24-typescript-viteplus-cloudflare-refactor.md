# Gambreng TypeScript + Vite+ + Cloudflare Refactor — Implementation Plan

## Overview

Refactor the Gambreng gachapon gacha app from a vanilla HTML/CSS/JS static site (single 805-line `app.js`, CDN dependencies) into a modern **TypeScript** codebase using **Vite+** (VoidZero's unified toolchain), with **oxlint**, **oxfmt**, **vitest**, **husky**, and **knip** — deployed to **Cloudflare Pages**.

The existing **four participant slots** will become configurable (URL query params + edit form). The monolithic `app.js` will be decomposed into typed, modular components. Three.js will be **pinned** to a specific version. The `Machine.ts` geometry builder (~300 lines) will be decomposed into sub-components.

## Current State Analysis

### File Structure

```
gambreng/
├── index.html          # 32 lines — CDN script tags, DOM skeleton
├── app.js              # 805 lines — ALL logic in one file
├── style.css           # 183 lines — all styles (no changes needed)
├── assets/             # Empty (gambreng-logo.png missing)
└── .gitignore
```

### Key Issues

- No build tool, no package manager, no type safety
- Three.js r128 via CDN (2+ years old, breaking changes in r152+)
- 15+ global mutable variables (`app.js:14-21`)
- `renderer.outputEncoding = THREE.sRGBEncoding` (`app.js:51`) — removed in modern Three.js
- No tests, no linting, no CI/CD
- Hardcoded participant data (`app.js:7-12`)

### Key Discoveries

- Game state machine: `idle` → `entering` → `ready` → `spinning` → `revealing` → `done` (`app.js:19`, throughout)
- Machine geometry is ~220 lines (`app.js:154-374`) — decomposable into: Base, Body, Dome, Handle, CoinSlot, ExitChute, Decorations
- GSAP timelines used extensively for sequenced animations (`app.js:489-719`)
- DOM overlay UI is simple: 3 buttons + themes panel + result modal (`index.html:12-26`)
- Logo uses `TextureLoader` with canvas text fallback (`app.js:324-350`)
- 5-light setup with shadows (`app.js:70-109`)

## Desired End State

A fully typed TypeScript application with:

- `vp dev` starts instant HMR dev server
- `vp build` produces optimized static output in `dist/`
- `vp test` runs vitest unit tests
- `vp lint` runs oxlint
- `vp fmt` formats with oxfmt
- `vp check` runs all three in one command
- `knip` detects unused files/exports/dependencies
- Husky pre-commit runs `vp staged` + `knip`
- Cloudflare Pages deploys on push to `main` with GitHub Actions
- All four participant slots are configurable via URL params or edit form

### Verification

- `vp build` succeeds with zero errors
- `vp check` passes (lint + format + typecheck)
- `knip` reports zero issues
- `vp test` passes all tests
- App renders identically to current version (visual comparison)
- Participant data can be customized for all four slots via URL params or the edit form
- Deploys to Cloudflare Pages successfully

## What We're NOT Doing

- Migrating to React/Vue/Svelte — stays vanilla TypeScript + Three.js
- Adding routing (single-page app, no navigation)
- Loading 3D models (keeping procedural geometry)
- Adding multiplayer/server-side logic
- Changing the visual design, color scheme, or animations
- Adding i18n (keeping Indonesian UI text)
- Adding sound effects or music
- Supporting variable participant counts beyond the existing four slots

## Implementation Approach

Incremental migration: scaffold the new structure first, then extract and convert module by module from the existing `app.js`. Each phase produces a working (or at least type-checkable) state. The participant editor will only be available while the app is in `idle`, and saving edits will update the URL params and reload the page to rebuild the scene cleanly. Three.js breaking changes are fixed in a dedicated phase after all code is extracted. Tooling and tests are added last to avoid fighting the linter during active refactoring.

## Target Project Structure

```
gambreng/
├── public/
│   ├── assets/
│   │   └── gambreng-logo.png
│   └── _headers                    # Cloudflare caching headers
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions CI + Cloudflare Pages deploy
├── src/
│   ├── main.ts                     # Entry: parse config, mount canvas, create Experience
│   ├── Experience.ts               # Root singleton: scene, camera, renderer, loop
│   ├── config.ts                   # Four participant slots, color constants, URL param parsing
│   ├── core/
│   │   ├── Renderer.ts             # WebGL renderer setup
│   │   ├── Sizes.ts                # Window resize handler
│   │   └── Loop.ts                 # requestAnimationFrame loop with delta
│   ├── objects/
│   │   ├── Machine.ts              # Machine group — orchestrates sub-components
│   │   ├── machine/
│   │   │   ├── Base.ts             # Feet + base platform + trim
│   │   │   ├── Body.ts             # Main column + panels + trim rings
│   │   │   ├── Dome.ts             # Glass dome + border ring
│   │   │   ├── TopCap.ts           # Cap + knob + trim
│   │   │   ├── CoinSlot.ts         # Coin slot plate + opening
│   │   │   ├── ExitChute.ts        # Chute + opening + trim
│   │   │   ├── Handle.ts           # Handle stem + arm + ball
│   │   │   ├── Label.ts            # Logo sticker with fallback
│   │   │   └── Decorations.ts      # Star studs + side panels
│   │   ├── Capsule.ts              # Individual capsule (halves, band, label, glow)
│   │   ├── Environment.ts          # Sky sphere, ground disc, ground ring
│   │   └── FloatingStars.ts        # Decorative background stars
│   ├── animations/
│   │   ├── EntryAnimation.ts       # Capsule fly-in + dome insertion timeline
│   │   ├── SpinAnimation.ts        # Handle spin + machine shake + capsule shuffle
│   │   ├── RevealAnimation.ts      # Winner reveal + loser drop + sparkles
│   │   └── ConfettiEffect.ts       # Post-reveal confetti
│   ├── effects/
│   │   └── SparkleEffect.ts        # Sparkle burst particle effect
│   ├── ui/
│   │   └── UIManager.ts            # DOM button/overlay + participant editor management
│   ├── state/
│   │   └── GameState.ts            # State machine with typed transitions
│   ├── utils/
│   │   └── EventEmitter.ts         # Simple typed event bus
│   └── types/
│       └── index.ts                # Shared interfaces & types
├── tests/
│   ├── setup.ts                    # vitest-webgl-canvas-mock
│   ├── state/
│   │   └── GameState.test.ts
│   ├── config.test.ts
│   └── utils/
│       └── EventEmitter.test.ts
├── .husky/
│   └── pre-commit
├── index.html                      # Updated DOM shell + participant editor modal
├── style.css                       # Existing styles + participant editor styles
├── vite.config.ts                  # Unified: build + test + oxlint + oxfmt + staged
├── tsconfig.json
├── knip.json
├── wrangler.toml
├── package.json
└── .gitignore
```

---

## Phase 1: Scaffold Vite+ & TypeScript

### Overview

Initialize the project with Vite+, TypeScript, and all dependencies. Move assets to `public/`. Update `index.html` to use ES module entry point.

### Changes Required

#### 1. Install Vite+ CLI

```bash
curl -fsSL https://vite.plus | bash
```

#### 2. Initialize package.json & install dependencies

```bash
npm init -y
```

**package.json** — set `"type": "module"` and add Vite+ overrides before installing dependencies:

```json
{
  "type": "module",
  "overrides": {
    "vite": "npm:@voidzero-dev/vite-plus-core@latest",
    "vitest": "npm:@voidzero-dev/vite-plus-test@latest"
  }
}
```

Then install:

```bash
# Runtime
npm install three@0.172.0 gsap

# Dev — Vite+ ecosystem
npm install -D vite-plus @voidzero-dev/vite-plus-core@latest

# TypeScript
npm install -D typescript @types/three@0.172.0

# Dead code detection
npm install -D knip

# Git hooks
npm install -D husky

# Test mocking
npm install -D jsdom vitest-webgl-canvas-mock

# Deployment
npm install -D wrangler
```

> **Note**: `three` is pinned to `0.172.0` as the migration target to limit API churn from r128. `@types/three` must match the `three` version. GSAP bundles its own types.

#### 3. Create `tsconfig.json`

**File**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "tests", "vite.config.ts"],
  "exclude": ["node_modules"]
}
```

#### 4. Create `vite.config.ts`

**File**: `vite.config.ts`

```ts
import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    target: "esnext",
    sourcemap: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: ["node_modules/", "dist/", "tests/"],
    },
  },
});
```

#### 5. Move assets

```bash
mkdir -p public/assets
mv assets/gambreng-logo.png public/assets/ 2>/dev/null || true
```

#### 6. Update `index.html`

Remove CDN `<script>` tags, add module entry point:

```html
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gambreng - Gacha Theme Selector</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <div id="canvas-container"></div>

    <div id="ui-overlay">
      <div id="title">
        <img
          src="/assets/gambreng-logo.png"
          alt="GAMBRENG"
          id="title-logo"
          onerror="this.style.display='none';this.parentElement.textContent='GAMBRENG';"
        />
      </div>
      <div id="participant-themes" class="hidden"></div>
      <button id="start-btn">MASUKKAN KAPSUL</button>
      <button id="handle-btn" class="hidden">PUTAR!</button>
      <button id="reset-btn" class="hidden">ULANGI</button>
    </div>

    <div id="result-overlay" class="hidden">
      <div id="result-content">
        <h2>TEMA TERPILIH:</h2>
        <h1 id="winner-theme"></h1>
        <p id="winner-participant"></p>
      </div>
    </div>

    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

#### 7. Create directory structure and a stub entry file

```bash
mkdir -p src/{core,objects/machine,animations,effects,ui,state,utils,types}
mkdir -p tests/{state,utils}
cat > src/main.ts <<'EOF'
const container = document.getElementById('canvas-container');

if (!container) {
  throw new Error('Missing #canvas-container');
}
EOF
```

#### 8. Update `.gitignore`

```
.DS_Store
node_modules/
dist/
thoughts/
handoff.md
*.local
.wrangler/
```

#### 9. Add `package.json` scripts

```json
{
  "name": "gambreng",
  "version": "1.0.0",
  "type": "module",
  "overrides": {
    "vite": "npm:@voidzero-dev/vite-plus-core@latest",
    "vitest": "npm:@voidzero-dev/vite-plus-test@latest"
  },
  "scripts": {
    "dev": "vp dev",
    "build": "tsc --noEmit && vp build",
    "preview": "vp preview",
    "typecheck": "tsc --noEmit",
    "lint": "vp lint",
    "lint:fix": "vp lint --fix",
    "fmt": "vp fmt",
    "fmt:check": "vp fmt --check",
    "check": "vp check",
    "staged": "vp staged",
    "test": "vp test",
    "test:run": "vp test run",
    "test:coverage": "vp test run --coverage",
    "knip": "knip",
    "knip:ci": "knip --cache --no-progress",
    "prepare": "husky"
  }
}
```

### Success Criteria

#### Automated Verification:

- [x] `npm install` completes without errors
- [x] `npx tsc --noEmit` succeeds with the scaffold entry file in place
- [x] `vp dev` starts dev server without errors
- [x] Directory structure matches target layout

#### Manual Verification:

- [x] Dev server loads the existing HTML shell with no console errors about missing config or missing entry files

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding.

---

## Phase 2: Define Types & Configurable Participant Data

### Overview

Create the type system and make the existing four participant slots configurable via URL query parameters. The edit form added later will read and write this same fixed-slot URL schema.

### Changes Required

#### 1. Shared types

**File**: `src/types/index.ts`

```ts
export interface Participant {
  name: string;
  theme: string;
  color: number;
}

export enum GameStateType {
  Idle = "idle",
  Entering = "entering",
  Ready = "ready",
  Spinning = "spinning",
  Revealing = "revealing",
  Done = "done",
}

export interface ExperienceConfig {
  canvas: HTMLCanvasElement;
  participants: Participant[];
}

export interface LoopCallback {
  update(delta: number, elapsed: number): void;
}
```

#### 2. Configurable participant data

**File**: `src/config.ts`

```ts
import type { Participant } from "@/types";

export const DEFAULT_PARTICIPANTS: Participant[] = [
  { name: "Peserta 1", theme: "Cyberpunk City", color: 0xfd5901 },
  { name: "Peserta 2", theme: "Hutan Ajaib", color: 0xf78104 },
  { name: "Peserta 3", theme: "Underwater World", color: 0x249ea0 },
  { name: "Peserta 4", theme: "Steampunk", color: 0x005f60 },
];

export const PALETTE = {
  orange: { dark: 0xfd5901, mid: 0xf78104, gold: 0xfaab36 },
  teal: { bright: 0x249ea0, mid: 0x008083, dark: 0x005f60, veryDark: 0x003d3d },
  metal: { dark: 0x374151 },
  white: 0xffffff,
  black: 0x000000,
} as const;

export const MACHINE_COLORS = {
  foot: PALETTE.teal.veryDark,
  base: PALETTE.orange.dark,
  body: PALETTE.teal.mid,
  panel: PALETTE.teal.dark,
  trim: PALETTE.orange.gold,
  dome: 0xaaddff,
  cap: PALETTE.orange.dark,
  coinSlot: PALETTE.teal.veryDark,
  chute: PALETTE.teal.veryDark,
  handleStem: PALETTE.metal.dark,
  handleBall: PALETTE.orange.gold,
  star: PALETTE.orange.gold,
  sidePanel: 0x006566,
} as const;

const PARTICIPANT_SLOT_COUNT = 4;

function parseColorParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  return /^[0-9a-fA-F]{6}$/.test(value) ? parseInt(value, 16) : fallback;
}

/**
 * Parse four fixed participant slots from URL query params.
 *
 * Format:
 * ?p1Name=Alice&p1Theme=Space%20Noir&p1Color=ff0000
 * &p2Name=Bob&p2Theme=Ocean&p2Color=00ff00
 * ...through p4
 *
 * Missing or invalid values fall back to DEFAULT_PARTICIPANTS per slot.
 */
export function parseParticipantsFromURL(): Participant[] {
  const params = new URLSearchParams(window.location.search);

  return DEFAULT_PARTICIPANTS.map((participant, index) => {
    const slot = index + 1;
    const name = params.get(`p${slot}Name`)?.trim() || participant.name;
    const theme = params.get(`p${slot}Theme`)?.trim() || participant.theme;
    const color = parseColorParam(params.get(`p${slot}Color`), participant.color);

    return { name, theme, color };
  });
}

/**
 * Encode exactly four participant slots into URL query params.
 */
export function encodeParticipantsToURL(participants: Participant[]): string {
  if (participants.length !== PARTICIPANT_SLOT_COUNT) {
    throw new Error(`Expected exactly ${PARTICIPANT_SLOT_COUNT} participants`);
  }

  const params = new URLSearchParams();

  participants.forEach((participant, index) => {
    const slot = index + 1;
    params.set(`p${slot}Name`, participant.name.trim());
    params.set(`p${slot}Theme`, participant.theme.trim());
    params.set(`p${slot}Color`, participant.color.toString(16).padStart(6, "0"));
  });

  return `?${params.toString()}`;
}
```

### Success Criteria

#### Automated Verification:

- [x] `npx tsc --noEmit` passes
- [x] Types are importable from `@/types`

#### Manual Verification:

- [x] N/A (no visual output yet)

---

## Phase 3: Extract Core Modules

### Overview

Create the foundational classes: `EventEmitter`, `Sizes`, `Renderer`, and `Loop`.

### Changes Required

#### 1. Typed EventEmitter

**File**: `src/utils/EventEmitter.ts`

```ts
type Listener = (...args: unknown[]) => void;

export class EventEmitter {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, callback: Listener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Listener): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((cb) => cb(...args));
  }

  dispose(): void {
    this.listeners.clear();
  }
}
```

#### 2. Sizes (resize handler)

**File**: `src/core/Sizes.ts`

```ts
import { EventEmitter } from "@/utils/EventEmitter";

export class Sizes extends EventEmitter {
  width: number;
  height: number;
  pixelRatio: number;

  constructor() {
    super();
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);
    window.addEventListener("resize", this.onResize);
  }

  private onResize = (): void => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.emit("resize");
  };

  dispose(): void {
    window.removeEventListener("resize", this.onResize);
    super.dispose();
  }
}
```

#### 3. Renderer

**File**: `src/core/Renderer.ts`

Extracts `app.js:44-52`. Updates `outputEncoding` → `outputColorSpace`.

```ts
import * as THREE from "three";
import type { Sizes } from "@/core/Sizes";

export class Renderer {
  instance: THREE.WebGLRenderer;

  constructor(
    canvas: HTMLCanvasElement,
    sizes: Sizes,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
  ) {
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
```

#### 4. Loop (RAF manager)

**File**: `src/core/Loop.ts`

Extracts the `animate()` function pattern from `app.js:763-804`.

```ts
import type { LoopCallback } from "@/types";

export class Loop {
  private callbacks: Set<LoopCallback> = new Set();
  private animationId: number | null = null;
  private clock = { start: Date.now() };

  start(): void {
    const tick = (): void => {
      const elapsed = (Date.now() - this.clock.start) * 0.001;
      const delta = 1 / 60; // Fixed delta for consistency
      this.callbacks.forEach((cb) => cb.update(delta, elapsed));
      this.animationId = requestAnimationFrame(tick);
    };
    this.animationId = requestAnimationFrame(tick);
  }

  add(callback: LoopCallback): void {
    this.callbacks.add(callback);
  }

  remove(callback: LoopCallback): void {
    this.callbacks.delete(callback);
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  dispose(): void {
    this.stop();
    this.callbacks.clear();
  }
}
```

### Success Criteria

#### Automated Verification:

- [x] `npx tsc --noEmit` passes

#### Manual Verification:

- [x] N/A

---

## Phase 4: Extract 3D Objects

### Overview

Convert the procedural geometry functions into typed classes. Decompose `createMachine()` (~220 lines in `app.js:154-374`) into 9 sub-component files.

### Changes Required

#### 1. Machine sub-components

Each sub-component follows this pattern — it receives the parent `THREE.Group` and adds its geometry:

**File**: `src/objects/machine/Base.ts`

- Extracts `app.js:157-185` — feet (4 cylinders), base platform, base trim ring
- Uses `MACHINE_COLORS.foot`, `MACHINE_COLORS.base`, `MACHINE_COLORS.trim`

**File**: `src/objects/machine/Body.ts`

- Extracts `app.js:187-208` — main column, front face panel, gold trim rings at y=[1.2, 2.0, 2.8, 3.5]
- Uses `MACHINE_COLORS.body`, `MACHINE_COLORS.panel`, `MACHINE_COLORS.trim`

**File**: `src/objects/machine/Dome.ts`

- Extracts `app.js:210-234` — glass sphere (`MeshPhysicalMaterial` with clearcoat), border ring
- Returns dome mesh reference (needed by Experience for collision bounds)

**File**: `src/objects/machine/TopCap.ts`

- Extracts `app.js:236-255` — cap cylinder, golden knob sphere, cap trim torus

**File**: `src/objects/machine/CoinSlot.ts`

- Extracts `app.js:257-271` — slot plate, slot opening

**File**: `src/objects/machine/ExitChute.ts`

- Extracts `app.js:273-294` — chute box, opening, golden trim

**File**: `src/objects/machine/Handle.ts`

- Extracts `app.js:296-321` — handle group (stem, arm, ball)
- Returns handle group reference (needed by SpinAnimation for rotation)

**File**: `src/objects/machine/Label.ts`

- Extracts `app.js:323-350` — TextureLoader for logo with canvas text fallback
- Uses `THREE.TextureLoader` with error callback

**File**: `src/objects/machine/Decorations.ts`

- Extracts `app.js:352-371` — star studs (5 octahedra), side panels (2 boxes)

Each sub-component file exports a function:

```ts
// Example pattern for each sub-component
import * as THREE from "three";
import { MACHINE_COLORS } from "@/config";

export function createBase(group: THREE.Group): void {
  // ... geometry creation, adds meshes to group
}
```

#### 2. Machine orchestrator

**File**: `src/objects/Machine.ts`

```ts
import * as THREE from "three";
import { createBase } from "@/objects/machine/Base";
import { createBody } from "@/objects/machine/Body";
import { createDome } from "@/objects/machine/Dome";
import { createTopCap } from "@/objects/machine/TopCap";
import { createCoinSlot } from "@/objects/machine/CoinSlot";
import { createExitChute } from "@/objects/machine/ExitChute";
import { createHandle } from "@/objects/machine/Handle";
import { createLabel } from "@/objects/machine/Label";
import { createDecorations } from "@/objects/machine/Decorations";

export class Machine {
  group: THREE.Group;
  handle: THREE.Group;
  dome: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    createBase(this.group);
    createBody(this.group);
    this.dome = createDome(this.group);
    createTopCap(this.group);
    createCoinSlot(this.group);
    createExitChute(this.group);
    this.handle = createHandle(this.group);
    createLabel(this.group);
    createDecorations(this.group);
    scene.add(this.group);
  }
}
```

#### 3. Capsule

**File**: `src/objects/Capsule.ts`

Extracts `app.js:378-452`. One class per capsule instance:

```ts
import * as THREE from "three";
import type { Participant } from "@/types";

export class Capsule {
  group: THREE.Group;

  constructor(participant: Participant, index: number) {
    this.group = new THREE.Group();
    // ... top half, bottom half, band, label, glow ring
    // Uses participant.color, creates canvas label with `P${index + 1}`
    this.group.position.set(-2 + index * 1.3, 6, 0);
    this.group.userData = { index, color: participant.color };
    this.group.castShadow = true;
  }

  addToScene(scene: THREE.Scene): void {
    scene.add(this.group);
  }
}
```

#### 4. Environment

**File**: `src/objects/Environment.ts`

Extracts `app.js:113-150` — sky sphere, ground disc, ground glow ring. Also calls `setupLights()` logic from `app.js:70-109`.

```ts
import * as THREE from "three";

export class Environment {
  constructor(scene: THREE.Scene) {
    this.createSky(scene);
    this.createGround(scene);
    this.createGroundRing(scene);
    this.setupLights(scene);
    scene.fog = new THREE.FogExp2(0x003333, 0.03);
  }
  // ... private methods for each
}
```

#### 5. FloatingStars

**File**: `src/objects/FloatingStars.ts`

Extracts `app.js:456-470` + idle animation from `app.js:768-772`:

```ts
import * as THREE from "three";
import type { LoopCallback } from "@/types";

export class FloatingStars implements LoopCallback {
  private stars: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene) {
    // ... create 20 octahedra with random positions
  }

  update(_delta: number, elapsed: number): void {
    this.stars.forEach((s) => {
      s.position.y += Math.sin(elapsed * 0.5 + s.userData.offset) * 0.003;
      s.rotation.x += s.userData.speed;
      s.rotation.y += s.userData.speed * 0.7;
    });
  }
}
```

### Success Criteria

#### Automated Verification:

- [x] `npx tsc --noEmit` passes
- [x] All files import correctly with `@/` path aliases

#### Manual Verification:

- [x] N/A (not yet wired up)

---

## Phase 5: Extract Animations, Effects & UI

### Overview

Convert GSAP animation sequences and DOM management into typed modules. Add the participant editor UI in this phase so the four configurable slots have an actual user-facing editing flow.

### Changes Required

#### 1. EntryAnimation

**File**: `src/animations/EntryAnimation.ts`

Extracts `app.js:489-545`. Takes machine, capsules, camera, UI references. Returns a GSAP timeline.

```ts
import gsap from "gsap";
import * as THREE from "three";
import type { Capsule } from "@/objects/Capsule";

export function playEntryAnimation(
  capsules: Capsule[],
  camera: THREE.PerspectiveCamera,
  onComplete: () => void,
): gsap.core.Timeline {
  const tl = gsap.timeline();
  // Camera move closer
  tl.to(camera.position, { z: 8, y: 3.2, duration: 1, ease: "power2.inOut" }, 0);
  // Capsule fly-in sequence from app.js:510-537
  capsules.forEach((capsule, i) => {
    // ... lineup → dome insertion → bounce settle
  });
  tl.call(onComplete, null, ">0.2");
  return tl;
}
```

#### 2. SpinAnimation

**File**: `src/animations/SpinAnimation.ts`

Extracts `app.js:547-605`. Handle spin, machine shake, capsule shuffle, winner selection.

#### 3. RevealAnimation

**File**: `src/animations/RevealAnimation.ts`

Extracts `app.js:607-648`. Loser drop, winner to chute, pop forward, dramatic spin.

#### 4. SparkleEffect

**File**: `src/effects/SparkleEffect.ts`

Extracts `app.js:650-677`. Creates 35 octahedra burst with auto-cleanup.

#### 5. ConfettiEffect

**File**: `src/animations/ConfettiEffect.ts`

Extracts `app.js:691-719`. Creates 100 confetti pieces with 6s auto-cleanup.

#### 6. Update `index.html` and `style.css` for the participant editor

- Extend the existing overlay from `index.html:12-26` with an `EDIT PESERTA` button that is visible only while the game is idle.
- Add a hidden participant editor modal with exactly four rows of `name`, `theme`, and `color` inputs plus `SIMPAN`, `BATAL`, and `SALIN LINK` actions.
- Add editor styles to `style.css` for desktop/mobile layout, scroll handling, and focus states without changing the current visual language.

#### 7. UIManager

**File**: `src/ui/UIManager.ts`

Extracts `app.js:23-31` (DOM refs) and all DOM manipulation scattered throughout:

```ts
import gsap from "gsap";
import { encodeParticipantsToURL } from "@/config";
import type { Participant } from "@/types";

export class UIManager {
  private editBtn: HTMLButtonElement;
  private startBtn: HTMLButtonElement;
  private handleBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private editorOverlay: HTMLElement;
  private editorForm: HTMLFormElement;
  private saveEditorBtn: HTMLButtonElement;
  private cancelEditorBtn: HTMLButtonElement;
  private copyLinkBtn: HTMLButtonElement;
  private resultOverlay: HTMLElement;
  private resultContent: HTMLElement;
  private winnerThemeEl: HTMLElement;
  private winnerParticipantEl: HTMLElement;
  private participantThemesEl: HTMLElement;
  private titleEl: HTMLElement;

  constructor() {
    this.editBtn = document.getElementById("edit-btn") as HTMLButtonElement;
    this.startBtn = document.getElementById("start-btn") as HTMLButtonElement;
    // ... etc
  }

  bindEvents(handlers: {
    start: () => void;
    spin: () => void;
    reset: () => void;
    edit: () => void;
    saveParticipants: (participants: Participant[]) => void;
  }): void {
    this.startBtn.addEventListener("click", handlers.start);
    this.handleBtn.addEventListener("click", handlers.spin);
    this.resetBtn.addEventListener("click", handlers.reset);
    this.editBtn.addEventListener("click", handlers.edit);
    this.cancelEditorBtn.addEventListener("click", () => this.closeEditor());
    this.saveEditorBtn.addEventListener("click", () => {
      handlers.saveParticipants(this.readEditorParticipants());
    });
    this.copyLinkBtn.addEventListener("click", () => this.copyShareLink());
  }

  openEditor(participants: Participant[]): void {
    /* populate four fixed rows + show modal */
  }
  closeEditor(): void {
    /* hide modal + clear validation state */
  }
  readEditorParticipants(): Participant[] {
    /* read exactly four rows, validate non-empty fields */
  }
  setEditEnabled(enabled: boolean): void {
    /* show in idle, hide otherwise */
  }
  async copyShareLink(): Promise<void> {
    const shareURL = new URL(
      encodeParticipantsToURL(this.readEditorParticipants()),
      window.location.origin,
    );
    await navigator.clipboard.writeText(shareURL.toString());
    // ... transient copied state on copyLinkBtn
  }
  hideTitle(): void {
    /* app.js:493-496 */
  }
  showParticipantThemes(participants: Participant[]): void {
    /* app.js:499-503 */
  }
  hideParticipantThemes(): void {
    /* app.js:540, 553-556 */
  }
  showHandleButton(): void {
    /* app.js:541-542 */
  }
  disableHandleButton(): void {
    /* app.js:550-551 */
  }
  showResetButton(): void {
    /* app.js:644-645 */
  }
  showResult(winner: Participant): void {
    /* app.js:679-689 */
  }
  hideResult(): void {
    /* app.js:724-727 */
  }
  resetAll(): void {
    /* app.js:729-734 */
  }
}
```

### Success Criteria

#### Automated Verification:

- [x] `npx tsc --noEmit` passes

#### Manual Verification:

- [x] N/A (not yet wired up)

---

## Phase 6: Wire Up Experience & State Machine

### Overview

Create the `GameState` state machine and the `Experience` root singleton that wires everything together. Create `main.ts` entry point. This is where the app becomes functional.

### Changes Required

#### 1. GameState

**File**: `src/state/GameState.ts`

```ts
import { EventEmitter } from "@/utils/EventEmitter";
import { GameStateType } from "@/types";

const VALID_TRANSITIONS: Record<GameStateType, GameStateType[]> = {
  [GameStateType.Idle]: [GameStateType.Entering],
  [GameStateType.Entering]: [GameStateType.Ready],
  [GameStateType.Ready]: [GameStateType.Spinning],
  [GameStateType.Spinning]: [GameStateType.Revealing],
  [GameStateType.Revealing]: [GameStateType.Done],
  [GameStateType.Done]: [GameStateType.Idle],
};

export class GameState extends EventEmitter {
  current: GameStateType = GameStateType.Idle;

  transition(to: GameStateType): boolean {
    if (!VALID_TRANSITIONS[this.current].includes(to)) {
      console.warn(`Invalid transition: ${this.current} → ${to}`);
      return false;
    }
    const from = this.current;
    this.current = to;
    this.emit("change", { from, to });
    return true;
  }

  reset(): void {
    const from = this.current;
    this.current = GameStateType.Idle;
    this.emit("change", { from, to: GameStateType.Idle });
  }

  is(state: GameStateType): boolean {
    return this.current === state;
  }
}
```

#### 2. Experience (root singleton)

**File**: `src/Experience.ts`

Wires all components together. Replaces global variables + `init()` from `app.js:36-66`:

```ts
import * as THREE from "three";
import gsap from "gsap";
import { Sizes } from "@/core/Sizes";
import { Renderer } from "@/core/Renderer";
import { Loop } from "@/core/Loop";
import { Machine } from "@/objects/Machine";
import { Capsule } from "@/objects/Capsule";
import { Environment } from "@/objects/Environment";
import { FloatingStars } from "@/objects/FloatingStars";
import { GameState } from "@/state/GameState";
import { UIManager } from "@/ui/UIManager";
import { encodeParticipantsToURL } from "@/config";
import { GameStateType } from "@/types";
import type { Participant, LoopCallback } from "@/types";
import { playEntryAnimation } from "@/animations/EntryAnimation";
import { playSpinAnimation } from "@/animations/SpinAnimation";
import { playRevealAnimation } from "@/animations/RevealAnimation";

let instance: Experience | null = null;

export class Experience implements LoopCallback {
  canvas: HTMLCanvasElement;
  sizes: Sizes;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: Renderer;
  loop: Loop;
  machine: Machine;
  capsules: Capsule[];
  floatingStars: FloatingStars;
  gameState: GameState;
  ui: UIManager;
  participants: Participant[];
  winnerIndex: number = -1;

  constructor(canvas: HTMLCanvasElement, participants: Participant[]) {
    if (instance) return instance;
    instance = this;

    this.canvas = canvas;
    this.participants = participants;

    // Core
    this.sizes = new Sizes();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, this.sizes.width / this.sizes.height, 0.1, 100);
    this.camera.position.set(0, 3.5, 9);
    this.camera.lookAt(0, 2, 0);
    this.renderer = new Renderer(canvas, this.sizes, this.scene, this.camera);
    this.loop = new Loop();

    // Resize handler
    this.sizes.on("resize", () => {
      this.camera.aspect = this.sizes.width / this.sizes.height;
      this.camera.updateProjectionMatrix();
    });

    // Objects
    new Environment(this.scene);
    this.machine = new Machine(this.scene);
    this.capsules = participants.map((p, i) => {
      const c = new Capsule(p, i);
      c.addToScene(this.scene);
      return c;
    });
    this.floatingStars = new FloatingStars(this.scene);

    // State & UI
    this.gameState = new GameState();
    this.ui = new UIManager();
    this.ui.bindEvents({
      start: () => this.startEntry(),
      spin: () => this.spinGacha(),
      reset: () => this.resetGame(),
      edit: () => this.openEditor(),
      saveParticipants: (nextParticipants) => this.applyParticipantEdits(nextParticipants),
    });
    this.ui.setEditEnabled(true);

    // Loop
    this.loop.add(this);
    this.loop.add(this.floatingStars);
    this.loop.start();

    // Intro camera animation
    gsap.from(this.camera.position, { y: 6, z: 14, duration: 2.5, ease: "power3.out" });
  }

  update(_delta: number, elapsed: number): void {
    // Per-state idle animations from app.js:774-801
    if (this.gameState.is(GameStateType.Idle)) {
      this.machine.group.position.y = Math.sin(elapsed * 0.7) * 0.04;
      this.machine.group.rotation.y = Math.sin(elapsed * 0.3) * 0.03;
      this.capsules.forEach((c, i) => {
        const a = elapsed * 0.4 + i * Math.PI * 0.5;
        c.group.position.x = Math.cos(a) * 2.2;
        c.group.position.z = Math.sin(a) * 2.2;
        c.group.position.y = 6 + Math.sin(elapsed * 1.2 + i) * 0.3;
        c.group.rotation.y += 0.015;
        c.group.rotation.x = Math.sin(elapsed * 0.8 + i) * 0.2;
      });
    } else if (this.gameState.is(GameStateType.Ready)) {
      this.machine.group.position.y = Math.sin(elapsed * 0.7) * 0.02;
      this.capsules.forEach((c, i) => {
        c.group.position.y = 3.8 + Math.sin(elapsed * 1.8 + i * 1.3) * 0.1;
        c.group.rotation.x += 0.003;
        c.group.rotation.y += 0.005;
      });
    } else if (this.gameState.is(GameStateType.Done) && this.winnerIndex >= 0) {
      const w = this.capsules[this.winnerIndex];
      w.group.position.y = 2.5 + Math.sin(elapsed * 1.2) * 0.08;
      w.group.rotation.y += 0.008;
    }

    this.renderer.render(this.scene, this.camera);
  }

  private startEntry(): void {
    // Delegates to EntryAnimation, updates state via gameState.transition(), hides edit controls
  }

  private spinGacha(): void {
    // Delegates to SpinAnimation
  }

  private openEditor(): void {
    if (!this.gameState.is(GameStateType.Idle)) return;
    this.ui.openEditor(this.participants);
  }

  private applyParticipantEdits(nextParticipants: Participant[]): void {
    if (!this.gameState.is(GameStateType.Idle)) return;
    window.location.assign(encodeParticipantsToURL(nextParticipants));
  }

  private resetGame(): void {
    // Delegates to reset logic, transitions to Idle, re-enables edit controls
  }

  destroy(): void {
    this.loop.dispose();
    this.sizes.dispose();
    this.renderer.dispose();
    instance = null;
  }
}
```

#### 3. Entry point

**File**: `src/main.ts`

```ts
import { parseParticipantsFromURL } from "@/config";
import { Experience } from "@/Experience";

const container = document.getElementById("canvas-container")!;
const canvas = document.createElement("canvas");
container.appendChild(canvas);

const participants = parseParticipantsFromURL();
new Experience(canvas, participants);
```

#### 4. Delete old `app.js`

Remove `app.js` from the project root after verifying the new code works.

### Success Criteria

#### Automated Verification:

- [x] `npx tsc --noEmit` passes
- [x] `vp build` succeeds
- [x] `vp dev` starts without errors

#### Manual Verification:

- [x] App renders the 3D gachapon machine correctly
- [x] All 6 game states work: idle → entering → ready → spinning → revealing → done
- [x] Capsule fly-in, spin, and reveal animations play correctly
- [ ] Sparkles and confetti effects display
- [x] Result overlay shows winner correctly
- [x] Reset returns to idle state cleanly
- [x] `EDIT PESERTA` opens a four-slot editor only while the game is idle
- [x] Saving the editor updates the URL and reloads the page with the new names, themes, and colors
- [ ] `SALIN LINK` copies a shareable URL that round-trips the current four-slot configuration
- [x] URL params like `?p1Name=Alice&p1Theme=Space%20Noir&p1Color=ff0000` load correctly without delimiter issues
- [ ] Colors appear correct (compare with current CDN version)
- [x] Window resize works properly

**Implementation Note**: This is the critical phase. After completing this phase, the app must be fully functional before proceeding. Pause for thorough manual testing.

---

## Phase 7: Fix Three.js Breaking Changes

### Overview

Address Three.js r128 → 0.172.0 breaking changes. The main change (`outputEncoding` → `outputColorSpace`) is already handled in `Renderer.ts` (Phase 3). This phase focuses on visual verification and color tuning.

### Changes Required

#### 1. Verify ColorManagement

In modern Three.js, `THREE.ColorManagement.enabled = true` is the default. This may cause colors to appear slightly different (more saturated or washed out) compared to r128.

If colors look wrong:

```ts
// In Renderer.ts constructor, BEFORE creating materials:
THREE.ColorManagement.enabled = true; // already default, but explicit
```

Materials using hex colors (`0xFD5901`, `0x249EA0`, etc.) may need slight adjustments. Compare side-by-side with the r128 CDN version.

#### 2. Verify no other deprecated APIs

Search all `.ts` files for:

- `sRGBEncoding` → should not exist (replaced in Phase 3)
- `outputEncoding` → should not exist
- `.encoding` on textures → use `.colorSpace = THREE.SRGBColorSpace` instead

### Success Criteria

#### Automated Verification:

- [x] `npx tsc --noEmit` passes (no deprecated type errors)
- [x] `vp build` succeeds

#### Manual Verification:

- [x] Open current CDN version side-by-side with new version
- [ ] Colors of machine body, capsules, environment match closely
- [ ] Lighting looks correct (no blown-out highlights or dark shadows)
- [x] Glass dome transparency/clearcoat renders properly
- [x] Canvas textures (labels, logo fallback) display correctly

**Implementation Note**: Pause here for visual comparison before proceeding.

---

## Phase 8: Add Engineering Tooling

### Overview

Configure oxlint, oxfmt, husky, and knip. All lint/format config lives in `vite.config.ts` (Vite+ unified config).

### Changes Required

#### 1. Update `vite.config.ts` with lint/fmt/staged config

```ts
import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    target: "esnext",
    sourcemap: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: ["node_modules/", "dist/", "tests/"],
    },
  },
  lint: {
    deny: ["correctness"],
    warn: ["suspicious", "no-console"],
    allow: [],
  },
  fmt: {},
  staged: {
    "*": "vp check --fix",
  },
});
```

#### 2. Initialize Husky

```bash
npx husky init
```

**`.husky/pre-commit`:**

```bash
npx vp staged
npx knip --no-exit-code
```

> Note: `--no-exit-code` on knip during initial setup to avoid blocking commits while onboarding. Remove once all issues are resolved.

#### 3. Configure knip

**File**: `knip.json`

```json
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "entry": ["src/main.ts"],
  "project": ["src/**/*.ts", "tests/**/*.ts", "vite.config.ts"],
  "ignore": ["src/types/index.ts"]
}
```

#### 4. Run initial lint pass

```bash
vp lint --fix
vp fmt
knip
```

Fix any issues found. Common expected issues:

- Unused imports from incremental development
- Missing semicolons or formatting inconsistencies
- knip may flag `@types/three` as unused (add to `ignoreDependencies` if so)

### Success Criteria

#### Automated Verification:

- [x] `vp lint` reports zero errors
- [x] `vp fmt --check` reports zero formatting issues
- [x] `vp check` passes (lint + fmt + typecheck combined)
- [x] `knip` reports zero issues (or only intentional ignores)
- [ ] `git commit` triggers pre-commit hook successfully

#### Manual Verification:

- [x] N/A

---

## Phase 9: Write Tests

### Overview

Add unit tests for testable logic: GameState transitions, EventEmitter, config parsing.

### Changes Required

#### 1. Test setup

**File**: `tests/setup.ts`

```ts
import "vitest-webgl-canvas-mock";
```

#### 2. GameState tests

**File**: `tests/state/GameState.test.ts`

```ts
import { describe, it, expect, vi } from "vitest";
import { GameState } from "@/state/GameState";
import { GameStateType } from "@/types";

describe("GameState", () => {
  it("starts in Idle state", () => {
    const gs = new GameState();
    expect(gs.current).toBe(GameStateType.Idle);
  });

  it("allows valid transitions", () => {
    const gs = new GameState();
    expect(gs.transition(GameStateType.Entering)).toBe(true);
    expect(gs.current).toBe(GameStateType.Entering);

    expect(gs.transition(GameStateType.Ready)).toBe(true);
    expect(gs.transition(GameStateType.Spinning)).toBe(true);
    expect(gs.transition(GameStateType.Revealing)).toBe(true);
    expect(gs.transition(GameStateType.Done)).toBe(true);
    expect(gs.transition(GameStateType.Idle)).toBe(true);
  });

  it("rejects invalid transitions", () => {
    const gs = new GameState();
    expect(gs.transition(GameStateType.Spinning)).toBe(false);
    expect(gs.current).toBe(GameStateType.Idle);
  });

  it("emits change event on valid transition", () => {
    const gs = new GameState();
    const handler = vi.fn();
    gs.on("change", handler);

    gs.transition(GameStateType.Entering);
    expect(handler).toHaveBeenCalledWith({
      from: GameStateType.Idle,
      to: GameStateType.Entering,
    });
  });

  it("does not emit change event on invalid transition", () => {
    const gs = new GameState();
    const handler = vi.fn();
    gs.on("change", handler);

    gs.transition(GameStateType.Done);
    expect(handler).not.toHaveBeenCalled();
  });

  it("emits the previous state when reset() is called", () => {
    const gs = new GameState();
    const handler = vi.fn();
    gs.on("change", handler);

    gs.transition(GameStateType.Entering);
    handler.mockClear();

    gs.reset();
    expect(handler).toHaveBeenCalledWith({
      from: GameStateType.Entering,
      to: GameStateType.Idle,
    });
  });
});
```

#### 3. EventEmitter tests

**File**: `tests/utils/EventEmitter.test.ts`

```ts
import { describe, it, expect, vi } from "vitest";
import { EventEmitter } from "@/utils/EventEmitter";

describe("EventEmitter", () => {
  it("registers and fires listeners", () => {
    const ee = new EventEmitter();
    const handler = vi.fn();
    ee.on("test", handler);
    ee.emit("test", "arg1", "arg2");
    expect(handler).toHaveBeenCalledWith("arg1", "arg2");
  });

  it("removes listeners with off()", () => {
    const ee = new EventEmitter();
    const handler = vi.fn();
    ee.on("test", handler);
    ee.off("test", handler);
    ee.emit("test");
    expect(handler).not.toHaveBeenCalled();
  });

  it("supports multiple listeners", () => {
    const ee = new EventEmitter();
    const h1 = vi.fn();
    const h2 = vi.fn();
    ee.on("test", h1);
    ee.on("test", h2);
    ee.emit("test");
    expect(h1).toHaveBeenCalled();
    expect(h2).toHaveBeenCalled();
  });

  it("clears all listeners on dispose()", () => {
    const ee = new EventEmitter();
    const handler = vi.fn();
    ee.on("test", handler);
    ee.dispose();
    ee.emit("test");
    expect(handler).not.toHaveBeenCalled();
  });
});
```

#### 4. Config tests

**File**: `tests/config.test.ts`

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { parseParticipantsFromURL, encodeParticipantsToURL, DEFAULT_PARTICIPANTS } from "@/config";

describe("parseParticipantsFromURL", () => {
  beforeEach(() => {
    // Reset URL
    window.history.replaceState({}, "", "/");
  });

  it("returns defaults when no query param", () => {
    expect(parseParticipantsFromURL()).toEqual(DEFAULT_PARTICIPANTS);
  });

  it("parses valid fixed-slot participants from URL", () => {
    window.history.replaceState(
      {},
      "",
      "/?p1Name=Alice&p1Theme=Space%20Noir&p1Color=ff0000&p2Name=Bob&p2Theme=Ocean&p2Color=00ff00",
    );
    const result = parseParticipantsFromURL();
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({ name: "Alice", theme: "Space Noir", color: 0xff0000 });
    expect(result[1]).toEqual({ name: "Bob", theme: "Ocean", color: 0x00ff00 });
    expect(result[2]).toEqual(DEFAULT_PARTICIPANTS[2]);
  });

  it("falls back per slot when color is invalid", () => {
    window.history.replaceState({}, "", "/?p1Name=Alice&p1Theme=Space&p1Color=invalid");
    const result = parseParticipantsFromURL();
    expect(result[0]).toEqual({
      name: "Alice",
      theme: "Space",
      color: DEFAULT_PARTICIPANTS[0].color,
    });
  });
});

describe("encodeParticipantsToURL", () => {
  it("encodes all four participant slots to query params", () => {
    const result = encodeParticipantsToURL([
      { name: "A", theme: "T1", color: 0xff0000 },
      { name: "B", theme: "T2", color: 0x00ff00 },
      { name: "C", theme: "T3", color: 0x0000ff },
      { name: "D", theme: "T4", color: 0xffffff },
    ]);
    expect(result).toContain("p1Name=A");
    expect(result).toContain("p2Theme=T2");
    expect(result).toContain("p4Color=ffffff");
  });

  it("round-trips names and themes that include punctuation safely", () => {
    const participants = [
      { name: "Alice, One", theme: "Space: Noir", color: 0xff0000 },
      { name: "Bob Two", theme: "Deep Ocean", color: 0x00ff00 },
      { name: "Cici", theme: "Forest Light", color: 0x0000ff },
      { name: "Danu", theme: "Retro City", color: 0xffffff },
    ];

    window.history.replaceState({}, "", encodeParticipantsToURL(participants));
    expect(parseParticipantsFromURL()).toEqual(participants);
  });
});
```

### Success Criteria

#### Automated Verification:

- [x] `vp test run` — all tests pass
- [x] `vp test run --coverage` — coverage report generated
- [x] `vp check` still passes after adding tests

#### Manual Verification:

- [x] N/A

---

## Phase 10: Deploy to Cloudflare Pages

### Overview

Configure Cloudflare Pages deployment with wrangler, custom headers, and GitHub Actions CI/CD.

### Changes Required

#### 1. Wrangler config

**File**: `wrangler.toml`

```toml
name = "gambreng"
compatibility_date = "2025-01-01"
pages_build_output_dir = "./dist"
```

#### 2. Custom headers

**File**: `public/_headers`

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

#### 3. GitHub Actions CI/CD

**File**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write

    steps:
      - uses: actions/checkout@v4

      - uses: voidzero-dev/setup-vp@v1
        with:
          node-version: "22"
          cache: true

      - run: npm ci

      - name: Check
        run: vp check

      - name: Dead code check
        run: npx knip --cache --no-progress

      - name: Test
        run: vp test run

      - name: Build
        run: vp build

      - name: Deploy to Cloudflare Pages
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=gambreng
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

#### 4. Local deployment test

```bash
vp build
npx wrangler pages deploy dist --project-name=gambreng
```

### Success Criteria

#### Automated Verification:

- [x] `vp build` produces `dist/` with `index.html`, hashed JS/CSS assets
- [x] `vp preview` serves the built app locally
- [ ] GitHub Actions workflow syntax is valid

#### Manual Verification:

- [x] Local `vp preview` renders the app correctly
- [ ] `wrangler pages deploy` succeeds (requires Cloudflare account setup)
- [ ] Deployed URL loads and app functions correctly
- [ ] `_headers` caching rules apply (check response headers)
- [ ] GitHub Actions workflow runs successfully on push

**Implementation Note**: Cloudflare deployment requires setting up `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets in the GitHub repo settings.

---

## Testing Strategy

### Unit Tests (vitest):

- `GameState` — all valid/invalid transitions, event emission, reset payload
- `EventEmitter` — on/off/emit/dispose
- `parseParticipantsFromURL` — four-slot overrides, invalid color fallback, edge cases
- `encodeParticipantsToURL` — four-slot encoding, round-trip safety

### What NOT to test:

- WebGL rendering output (trust Three.js)
- GSAP animation timing (trust GSAP)
- Visual appearance (manual comparison)
- GPU/shader compilation

### Manual Testing Checklist:

1. Full game flow: idle → enter capsules → spin → reveal → reset
2. Custom four-slot participants via URL params, edit form, and copied share link
3. Window resize during each game state
4. Logo image present vs. missing (fallback text)
5. Side-by-side color comparison with r128 CDN version

## Performance Considerations

- Three.js tree-shaking: Vite+ with Rolldown will eliminate unused Three.js modules
- Asset hashing: Vite hashes filenames → immutable cache on Cloudflare
- `Math.min(window.devicePixelRatio, 2)` caps pixel ratio to avoid GPU overload on high-DPI
- Shadow map size 2048x2048 is reasonable for desktop; consider reducing for mobile in the future

## Rollback Paths

If Vite+ causes issues (pre-1.0 instability):

1. Replace `vite-plus` with `vite` + `vitest` + `oxlint` as separate packages
2. Change `import { defineConfig } from 'vite-plus'` → `'vite'`
3. Move `test` config to separate `vitest.config.ts`
4. Replace `vp` commands with individual tool commands
5. Add separate `.oxlintrc.json` and `.oxfmtrc` config files

## References

- Research document: `thoughts/shared/research/2026-03-24-typescript-cloudflare-refactor.md`
- Handoff with known bugs: `thoughts/shared/handoffs/general/2026-03-23_22-23-08_gambreng-gacha-app.md`
- [Vite+ GitHub](https://github.com/voidzero-dev/vite-plus)
- [setup-vp GitHub Action](https://github.com/voidzero-dev/setup-vp)
- [Three.js Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)
- [knip v6 docs](https://knip.dev/)
- [oxlint docs](https://oxc.rs/docs/guide/usage/linter.html)
- [Cloudflare Wrangler Action](https://github.com/cloudflare/wrangler-action)
