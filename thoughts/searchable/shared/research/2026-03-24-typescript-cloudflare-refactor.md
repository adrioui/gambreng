---
date: 2026-03-24T04:36:21Z
researcher: adrifadilah
git_commit: c944ac8f85ae798a04555e1d6a1c3d6f0016c18c
branch: main
repository: gambreng
topic: "TypeScript migration, engineering best practices, and Cloudflare deployment"
tags: [research, codebase, typescript, vite, three.js, gsap, cloudflare, eslint, vitest]
status: complete
last_updated: 2026-03-24
last_updated_by: adrifadilah
---

# Research: TypeScript Migration, Engineering Best Practices & Cloudflare Deployment

**Date**: 2026-03-24T04:36:21Z
**Researcher**: adrifadilah
**Git Commit**: c944ac8f85ae798a04555e1d6a1c3d6f0016c18c
**Branch**: main
**Repository**: gambreng

## Research Question

Refactor the Gambreng gachapon gacha app to TypeScript, apply engineering best practices, and deploy to Cloudflare.

## Summary

The Gambreng app is currently a **vanilla HTML/CSS/JS static site** with no build tooling, no package manager, and no type safety. It consists of 3 files (`index.html`, `app.js` at 805 lines, `style.css`) using Three.js r128 and GSAP 3.12.2 loaded via CDN. The refactor involves migrating to **Vite + TypeScript**, upgrading Three.js from r128 to latest (with several breaking changes), restructuring the monolithic `app.js` into modular components, adding linting/testing/git hooks, and deploying to **Cloudflare Pages**.

---

## 1. Current Codebase Analysis

### File Structure

```
gambreng/
├── index.html          # Entry point, loads CDN scripts
├── app.js              # 805 lines — ALL logic in one file
├── style.css           # 183 lines — all styles
├── assets/             # Logo image
│   └── gambreng-logo.png
└── .gitignore
```

### Current Architecture

- **No build tool** — raw files served directly
- **No package manager** — no `package.json`
- **CDN dependencies**: Three.js r128 (`three.min.js`), GSAP 3.12.2
- **Global variables**: `scene`, `camera`, `renderer`, `machine`, `handle`, `dome`, `capsuleMeshes`, `sparkles`, `floatingStars`, `gameState`, `winnerIndex`
- **Single-file structure**: All 3D scene setup, animation, game logic, and DOM manipulation in `app.js`
- **Game states**: `idle` → `entering` → `ready` → `spinning` → `revealing` → `done`
- **Key functions**: `init()`, `setupLights()`, `createEnvironment()`, `createMachine()`, `createCapsules()`, `createFloatingStars()`, `startEntry()`, `spinGacha()`, `revealWinner()`, `resetGame()`, `animate()`
- **Hardcoded data**: 4 participants with names, themes, and colors defined as a constant array

### Three.js r128 APIs That Will Break on Upgrade

| Current Code (r128)                            | Modern Replacement (r152+)                                 |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `renderer.outputEncoding = THREE.sRGBEncoding` | `renderer.outputColorSpace = THREE.SRGBColorSpace`         |
| `THREE.sRGBEncoding` constant                  | `THREE.SRGBColorSpace`                                     |
| CDN `build/three.min.js`                       | npm `import * as THREE from 'three'` (UMD removed in r160) |

### Color Management Warning

In r152+, `ColorManagement.enabled = true` is the default. Materials using hex colors (`0xFD5901`, `0x249EA0`, etc.) may appear visually different (washed out or oversaturated) and may need re-tuning.

---

## 2. Target Stack: Vite + TypeScript

### Build Tool: Vite

Vite is the de-facto standard for Three.js + TypeScript projects. Key benefits:

- Instant dev server with HMR
- Native ES module support — tree-shakes Three.js automatically
- `/public` directory for static assets (bypasses content hashing, critical for Three.js loaders)
- Zero-config for vanilla TypeScript apps

### Dependencies to Install

```bash
# Runtime
npm install three gsap

# Dev
npm install --save-dev typescript @types/three vite
```

**Important**: `@types/three` version must match `three` version. GSAP bundles its own types — no `@types/gsap` needed.

### tsconfig.json

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
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

Key settings:

- `moduleResolution: "bundler"` — required for Vite/Rollup 4 (not `"node"`)
- `noEmit: true` — Vite handles transpilation, TypeScript only type-checks
- `isolatedModules: true` — required for Vite's esbuild transform
- `skipLibCheck: true` — avoids phantom errors from `@types/three` drift

### vite.config.ts

```ts
import { defineConfig } from "vite";

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
});
```

---

## 3. Recommended Project Structure

```
gambreng/
├── public/
│   └── assets/
│       └── gambreng-logo.png
├── src/
│   ├── main.ts                 # Entry: mount canvas, create Experience
│   ├── Experience.ts           # Root singleton: scene, camera, renderer, loop
│   ├── config.ts               # Participant data, color constants
│   ├── core/
│   │   ├── Renderer.ts         # WebGL renderer setup
│   │   ├── Sizes.ts            # Window resize handler with EventEmitter
│   │   └── Loop.ts             # requestAnimationFrame loop with delta
│   ├── objects/
│   │   ├── Machine.ts          # Gachapon machine geometry (feet, body, dome, handle, etc.)
│   │   ├── Capsule.ts          # Individual capsule (top half, bottom half, band, label)
│   │   ├── Environment.ts      # Sky sphere, ground disc, ground ring
│   │   └── FloatingStars.ts    # Decorative background stars
│   ├── animations/
│   │   ├── EntryAnimation.ts   # Capsule fly-in + dome insertion timeline
│   │   ├── SpinAnimation.ts    # Handle spin + machine shake + capsule shuffle
│   │   ├── RevealAnimation.ts  # Winner reveal + loser drop + sparkles
│   │   └── ConfettiEffect.ts   # Post-reveal confetti
│   ├── ui/
│   │   └── UIManager.ts        # DOM button/overlay management
│   ├── state/
│   │   └── GameState.ts        # State machine: idle → entering → ready → spinning → revealing → done
│   ├── utils/
│   │   └── EventEmitter.ts     # Simple typed event bus
│   └── types/
│       ├── index.d.ts          # Shared interfaces (Participant, GameState enum, etc.)
│       └── vite-env.d.ts       # Vite ImportMeta augmentation
├── tests/
│   ├── setup.ts                # vitest-webgl-canvas-mock import
│   ├── state/
│   │   └── GameState.test.ts
│   └── utils/
│       └── EventEmitter.test.ts
├── .husky/
│   └── pre-commit
├── index.html
├── style.css
├── eslint.config.js
├── .prettierrc
├── lint-staged.config.js
├── vitest.config.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .gitignore
```

### Key Architectural Pattern: Experience Singleton

```typescript
// src/Experience.ts
import * as THREE from "three";
import { Sizes } from "./core/Sizes";
import { Loop } from "./core/Loop";
import { Renderer } from "./core/Renderer";
import { Machine } from "./objects/Machine";
import { GameState } from "./state/GameState";

let instance: Experience | null = null;

export class Experience {
  canvas: HTMLCanvasElement;
  sizes: Sizes;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: Renderer;
  loop: Loop;
  machine: Machine;
  gameState: GameState;

  constructor(canvas: HTMLCanvasElement) {
    if (instance) return instance;
    instance = this;
    // ... init subsystems
  }

  destroy() {
    // cleanup
    instance = null;
  }
}
```

This pattern:

- Eliminates all global variables
- Makes the root object accessible via singleton without prop-drilling
- Encapsulates renderer, scene, camera, and RAF loop
- Each component class (Machine, Capsule, etc.) receives `Experience` and can access shared state

---

## 4. Engineering Best Practices

### 4a. ESLint + Prettier (Flat Config)

```bash
npm install --save-dev eslint @eslint/js typescript-eslint prettier eslint-config-prettier eslint-plugin-prettier
```

**eslint.config.js:**

```js
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier/recommended";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: { project: "./tsconfig.json" },
    },
  },
  {
    rules: {
      "no-console": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  prettier, // MUST be last
  { ignores: ["dist/", "node_modules/", "**/*.d.ts"] },
);
```

**.prettierrc:**

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### 4b. Testing with Vitest

```bash
npm install --save-dev vitest @vitest/coverage-v8 jsdom vitest-webgl-canvas-mock
```

**vitest.config.ts:**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: ["node_modules/", "dist/", "tests/"],
    },
  },
});
```

**What to test:**

- Pure utility functions (math, color helpers)
- Game state machine transitions
- Event emitter behavior
- Component initialization defaults

**What NOT to test:**

- WebGL rendering output (trust Three.js)
- GPU shader compilation
- Visual appearance

### 4c. Git Hooks (Husky + lint-staged)

```bash
npm install --save-dev husky lint-staged
npx husky init
```

**.husky/pre-commit:**

```shell
npx lint-staged
```

**lint-staged.config.js:**

```js
export default {
  "*.{ts,tsx}": ["eslint --max-warnings=0 --fix", "prettier --write"],
  "*.{json,md,yaml,css,html}": ["prettier --write"],
};
```

### 4d. package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "lint:fix": "eslint . --max-warnings=0 --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "prepare": "husky"
  }
}
```

### 4e. Environment Variables

**src/vite-env.d.ts:**

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

Vite loads `.env` files automatically. Only `VITE_`-prefixed vars are exposed to client code.

---

## 5. Cloudflare Deployment

### Recommended: Cloudflare Pages

For a pure static Vite app, **Cloudflare Pages** is the simplest path. Note: Cloudflare is converging Pages and Workers into one platform — Pages is in maintenance mode but fully supported. For a static site with no server-side logic, Pages is ideal.

### Method A: Git Integration (Simplest)

1. Push repo to GitHub
2. Cloudflare Dashboard → Workers & Pages → Create → Connect to Git
3. Build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: Set `NODE_VERSION=20` in environment variables
4. Every push to `main` auto-deploys. PRs get preview URLs.

### Method B: Wrangler CLI

```bash
npm install --save-dev wrangler

# Build and deploy
npm run build
npx wrangler pages deploy dist --project-name=gambreng
```

### wrangler.toml (Optional but Recommended)

```toml
name = "gambreng"
compatibility_date = "2025-01-01"
pages_build_output_dir = "./dist"
```

### SPA Routing

Cloudflare Pages auto-detects SPA mode if no `404.html` exists — all unmatched routes serve `/index.html`. For this app (single page, no routing), this works out of the box.

### Custom Headers (public/\_headers)

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

Vite hashes asset filenames by default, so `immutable` cache on `/assets/*` is safe.

### GitHub Actions CI/CD (.github/workflows/deploy.yml)

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test:run
      - run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=gambreng
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

**Secrets needed:**

- `CLOUDFLARE_API_TOKEN` — Create with "Cloudflare Pages: Edit" permission
- `CLOUDFLARE_ACCOUNT_ID` — Found in Cloudflare dashboard sidebar

### Custom Domain

1. Dashboard → your project → Custom domains → Set up a domain
2. For apex domain (`gambreng.com`): domain must use Cloudflare DNS
3. For subdomain (`app.gambreng.com`): create CNAME → `gambreng.pages.dev`

---

## 6. Migration Steps (Recommended Order)

### Phase 1: Scaffold Vite + TypeScript

1. `npm create vite@latest . -- --template vanilla-ts` (or init manually)
2. Install dependencies: `npm install three gsap`
3. Install dev deps: `npm install --save-dev @types/three`
4. Move `assets/` → `public/assets/`
5. Replace CDN `<script>` tags with `<script type="module" src="/src/main.ts">`

### Phase 2: Convert app.js → TypeScript Modules

1. Create `src/types/index.d.ts` — define `Participant` interface, `GameStateType` enum
2. Extract `src/config.ts` — participant data, color constants
3. Create `src/core/` — `Renderer.ts`, `Sizes.ts`, `Loop.ts`
4. Create `src/objects/` — `Machine.ts`, `Capsule.ts`, `Environment.ts`, `FloatingStars.ts`
5. Create `src/animations/` — `EntryAnimation.ts`, `SpinAnimation.ts`, `RevealAnimation.ts`, `ConfettiEffect.ts`
6. Create `src/ui/UIManager.ts` — DOM interaction
7. Create `src/state/GameState.ts` — state machine
8. Create `src/Experience.ts` — root singleton wiring everything together
9. Create `src/main.ts` — entry point

### Phase 3: Fix Three.js Breaking Changes

1. `renderer.outputEncoding = THREE.sRGBEncoding` → `renderer.outputColorSpace = THREE.SRGBColorSpace`
2. Verify material colors look correct with `ColorManagement.enabled = true` (default in modern Three.js)
3. Test visual output against current version

### Phase 4: Add Engineering Tooling

1. ESLint flat config + Prettier
2. Husky + lint-staged
3. Vitest + test setup
4. Write initial tests for state machine and utilities

### Phase 5: Deploy to Cloudflare

1. Set up Cloudflare Pages via Git integration or wrangler CLI
2. Add `wrangler.toml`
3. Add `public/_headers` for caching
4. Set up GitHub Actions for CI/CD
5. Configure custom domain (if needed)

---

## Code References

- `app.js:1-12` — Participant data (hardcoded array of 4 items)
- `app.js:14-21` — Global state variables (scene, camera, renderer, gameState, etc.)
- `app.js:23-31` — DOM element references
- `app.js:36-66` — `init()` — scene, camera, renderer setup + event listeners
- `app.js:70-109` — `setupLights()` — 5 lights (ambient, key, fill, rim, under, spot)
- `app.js:113-150` — `createEnvironment()` — sky sphere + ground disc + glow ring
- `app.js:154-374` — `createMachine()` — 300+ lines building the gachapon machine from primitives
- `app.js:378-452` — `createCapsules()` — 4 capsules with colored halves, bands, labels
- `app.js:456-470` — `createFloatingStars()` — 20 decorative stars
- `app.js:489-545` — `startEntry()` — capsule fly-in animation
- `app.js:547-605` — `spinGacha()` — handle spin + machine shake + capsule shuffle
- `app.js:607-648` — `revealWinner()` — winner pop-out + losers drop
- `app.js:650-677` — `createSparkles()` — particle burst effect
- `app.js:691-719` — `createConfetti()` — confetti rain effect
- `app.js:721-753` — `resetGame()` — full state reset
- `app.js:763-804` — `animate()` — render loop with per-state idle animations
- `app.js:51` — `renderer.outputEncoding = THREE.sRGBEncoding` — **must change for modern Three.js**
- `index.html:28-29` — CDN script tags to remove
- `style.css:1-183` — Full stylesheet (no changes needed for migration)

## Architecture Documentation

### Current Patterns

- **Monolithic single-file**: All logic in one procedural JS file
- **Global mutable state**: Game state tracked via module-level `let` variables
- **Direct DOM manipulation**: `getElementById` calls at module scope
- **CDN dependencies**: No bundling, no tree-shaking
- **GSAP timelines**: Heavy use of `gsap.timeline()` for sequenced animations
- **Three.js procedural geometry**: Machine built entirely from primitives (no loaded models)

### Target Patterns

- **Vite + TypeScript**: Modern build tooling with type safety
- **Experience singleton**: Root class owning scene, camera, renderer
- **Component-per-file**: Each 3D object in its own class
- **State machine**: Typed enum-based game state management
- **Event bus**: Decoupled communication between modules
- **ESLint + Prettier + Husky**: Automated code quality enforcement
- **Vitest**: Unit tests for logic and state
- **Cloudflare Pages**: Global CDN deployment with CI/CD

## Related Research

- None (first research document for this project)

## Open Questions

1. Should the app use Workers instead of Pages for future server-side capabilities (e.g., saving results, multiplayer)?
2. Should participant data be configurable via URL params or a form, or remain hardcoded?
3. Target Three.js version — latest stable, or pin to a specific version?
4. Should the `Machine.ts` 300-line geometry builder be further decomposed into sub-components (dome, body, base, handle)?

## Sources

- [Vite Getting Started](https://vite.dev/guide/)
- [Three.js Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)
- [GSAP Installation Docs](https://gsap.com/docs/v3/Installation/)
- [Three.js Journey: Code Structuring](https://threejs-journey.com/lessons/code-structuring-for-bigger-projects)
- [Discover Three.js: App Structure](https://discoverthreejs.com/book/first-steps/app-structure/)
- [ESLint Flat Config Docs](https://eslint.org/docs/latest/use/configure/configuration-files)
- [Vitest Getting Started](https://vitest.dev/guide/)
- [Husky Docs](https://typicode.github.io/husky/get-started.html)
- [Cloudflare Pages: Deploy Vite](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/)
- [Cloudflare Pages Configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)
- [Cloudflare wrangler-action](https://github.com/cloudflare/wrangler-action)
- [Pages and Workers Convergence](https://blog.cloudflare.com/pages-and-workers-are-converging-into-one-experience/)
- [vitest-webgl-canvas-mock](https://github.com/RSamaium/vitest-webgl-canvas-mock)
- [@types/three on npm](https://www.npmjs.com/package/@types/three)
- [Vite Env Variables and Modes](https://vite.dev/guide/env-and-mode)
