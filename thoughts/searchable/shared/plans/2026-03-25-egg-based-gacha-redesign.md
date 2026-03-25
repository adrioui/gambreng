# Egg-Based Gacha Redesign Implementation Plan

## Overview

Transform the gashapon machine from capsule-based gacha to egg-based gacha. Replace SphereGeometry capsules with LatheGeometry eggs, add Voronoi fracture hatching via `three-pinata`, replace the DOM handle button with 3D raycasting on the handle mesh, implement tilted elliptical orbit with ghost trail, add interior dome lighting, and restructure the animation flow to a 7-beat sequence: `Idle → Triggered → BuildingUp → Capturing → Dispensing → Hatching → Done`.

## Current State Analysis

The machine has already been redesigned from cylindrical to boxy gashapon shape (previous plan complete). The codebase uses:

- `Capsule.ts`: SphereGeometry hemispheres with torus band, canvas labels, glow ring
- `ExitChute.ts`: Box-based chute with opening and trim
- `CoinSlot.ts`: Plate + slot opening (to be deleted)
- `Handle.ts`: Stem + arm + ball group, animated via `handle.rotation.x`
- `GameState.ts`: 6-state FSM: `Idle → Entering → Ready → Spinning → Revealing → Done`
- 3 animation files: `EntryAnimation.ts`, `SpinAnimation.ts`, `RevealAnimation.ts`
- `UIManager.ts`: DOM-based with `#handle-btn` for spin trigger
- Fixed-delta loop (1/60) in `Loop.ts`, GSAP for all animations

### Key Discoveries:

- `Machine.ts:22-25` — Only `dome` and `handle` are returned from machine assembly; `ExitChute` will now also need to return its mesh (nest tray for egg landing target)
- `Experience.ts:91-98` — Idle orbit uses manual `Math.cos/sin` with flat circular path; will be replaced by nested Object3D pivot
- `SpinAnimation.ts:57-64` — Winner selection via `setTimeout(2800)` with manual kill; needs complete rewrite for animation-driven state machine
- `UIManager.ts:156-164` — `showHandleButton()`/`disableHandleButton()` manage DOM handle button; these methods will be removed
- `index.html:27` — `<button id="handle-btn">` DOM element to be removed
- `Capsule.ts:12-35` — SphereGeometry hemispheres (radius 0.38); to be replaced with LatheGeometry egg profile
- `config.ts:26` — `coinSlot` color entry exists in `MACHINE_COLORS`; to be removed

## Desired End State

A gashapon machine where:

1. **Eggs** orbit in a tilted elliptical path around the machine with ghost trails
2. Clicking the **3D handle mesh** triggers the gacha sequence (no DOM button)
3. Eggs accelerate into the dome during **BuildingUp**, one is captured during **Capturing**
4. The captured egg **dispenses** down to a nest tray (LatheGeometry bowl)
5. The egg **hatches** via Voronoi fracturing with progressive shake, crack, and burst
6. The winner's identity is revealed with sparkles, confetti, and camera choreography
7. An interior **dome PointLight** glows during active phases

### Verification:

- All 8 game states cycle correctly: `Idle → Triggered → BuildingUp → Capturing → Dispensing → Hatching → Done → Idle`
- 3D handle click works via raycasting (no DOM handle button exists)
- Eggs use LatheGeometry with proper egg profile
- Voronoi fracture produces 6-8 shell fragments on hatch
- Tilted elliptical orbit with 8-clone ghost trail renders correctly
- Nest tray catches dispensed egg visually
- Dome interior light activates during BuildingUp/Capturing
- `npm run build` succeeds, `npm test` passes
- No DOM handle button in HTML or CSS

## What We're NOT Doing

- Changing the participant editor or URL encoding
- Changing the environment (sky, ground, lights) beyond dome interior light
- Changing the machine body/base/dome/cap geometry (already redesigned)
- Adding physics engine (cannon-es, ammo.js) — simple Euler integration for fragment trajectories
- Ping-pong framebuffer afterimage — using clone array instead
- Mobile-specific fallback for handle interaction

## Implementation Approach

Six phases, each producing a working build. Order is chosen to minimize breakage:

1. First lay the foundation (types, state machine, new Egg class, install dependency)
2. Then update machine parts (nest tray, handle raycasting, dome light)
3. Then implement the orbit system (this replaces the idle state update loop)
4. Then rewrite animations in two parts (entry/buildup, then dispense/hatch)
5. Finally polish camera choreography and wire everything together

---

## Phase 1: Foundation — Types, State Machine, Egg Class, Dependencies

### Overview

Add new game states, create the Egg class with LatheGeometry + Voronoi pre-fracturing, delete CoinSlot, install `three-pinata`.

### Changes Required:

#### 1. Install three-pinata

```bash
npm install @dgreenheck/three-pinata
```

#### 2. Types — Add New States

**File**: `src/types/index.ts`
**Changes**: Replace the 6-state enum with 8 states.

```typescript
export interface Participant {
  name: string;
  theme: string;
  color: number;
}

export enum GameStateType {
  Idle = "idle",
  Triggered = "triggered",
  BuildingUp = "buildingUp",
  Capturing = "capturing",
  Dispensing = "dispensing",
  Hatching = "hatching",
  Done = "done",
}

export interface LoopCallback {
  update(delta: number, elapsed: number): void;
}
```

Note: `Entering`, `Ready`, `Spinning`, `Revealing` are removed. `Triggered`, `BuildingUp`, `Capturing`, `Dispensing`, `Hatching` are added.

#### 3. State Machine — Update Transitions

**File**: `src/state/GameState.ts`
**Changes**: Update `VALID_TRANSITIONS` to match new flow.

```typescript
const VALID_TRANSITIONS: Record<GameStateType, GameStateType[]> = {
  [GameStateType.Idle]: [GameStateType.Triggered],
  [GameStateType.Triggered]: [GameStateType.BuildingUp],
  [GameStateType.BuildingUp]: [GameStateType.Capturing],
  [GameStateType.Capturing]: [GameStateType.Dispensing],
  [GameStateType.Dispensing]: [GameStateType.Hatching],
  [GameStateType.Hatching]: [GameStateType.Done],
  [GameStateType.Done]: [GameStateType.Idle],
};
```

#### 4. New File — Egg Class

**File**: `src/objects/Egg.ts` (new file)
**Changes**: Create Egg class using LatheGeometry with pre-fractured Voronoi halves.

```typescript
import * as THREE from "three";
import { DestructibleMesh } from "@dgreenheck/three-pinata";
import type { Participant } from "@/types";
import { colorToHex } from "@/utils/colorToHex";

export class Egg {
  group: THREE.Group;
  /** The intact egg mesh — visible until hatch */
  intact: THREE.Mesh;
  /** Pre-fractured fragments — hidden until hatch */
  fragments: THREE.Object3D[];
  /** Inner material color for fracture cross-sections */
  private innerMat: THREE.MeshStandardMaterial;

  constructor(participant: Participant, index: number) {
    this.group = new THREE.Group();

    // --- Egg profile via LatheGeometry ---
    const girth = 0.719;
    const apex = girth * 0.111111111;
    const points: THREE.Vector2[] = [];
    for (let rad = 0; rad <= Math.PI; rad += Math.PI / 30) {
      points.push(
        new THREE.Vector2((apex * Math.cos(rad) + girth) * Math.sin(rad), -Math.cos(rad)),
      );
    }
    const eggGeo = new THREE.LatheGeometry(points, 32);
    // Scale to roughly match capsule size (original radius was 0.38)
    // LatheGeometry egg has ~radius 0.72 and height ~2.0, scale down to ~0.45 radius
    const eggScale = 0.55;
    eggGeo.scale(eggScale, eggScale, eggScale);

    // --- Outer material (participant color) ---
    const outerMat = new THREE.MeshStandardMaterial({
      color: participant.color,
      metalness: 0.15,
      roughness: 0.4,
    });

    // --- Inner material (lighter shade for cross-section) ---
    this.innerMat = new THREE.MeshStandardMaterial({
      color: 0xf5f0e8, // cream/eggshell
      metalness: 0.05,
      roughness: 0.8,
    });

    // --- Intact egg mesh ---
    this.intact = new THREE.Mesh(eggGeo, outerMat);
    this.intact.castShadow = true;
    this.group.add(this.intact);

    // --- Pre-fracture with three-pinata ---
    const destructible = new DestructibleMesh(
      eggGeo.clone(),
      outerMat.clone(),
      this.innerMat.clone(),
    );
    const fragmentGroup = destructible.fracture({
      fractureMethod: "voronoi",
      fragmentCount: 8,
    });
    this.fragments = [];
    fragmentGroup.children.forEach((child) => {
      child.visible = false;
      this.fragments.push(child);
    });
    this.group.add(fragmentGroup);

    // --- Label (P1-P4 sticker on egg surface) ---
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
    labelFront.position.set(0, 0.1, 0.35);
    this.group.add(labelFront);

    const labelBack = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), labelMat.clone());
    labelBack.position.set(0, 0.1, -0.35);
    labelBack.rotation.y = Math.PI;
    this.group.add(labelBack);

    // --- Initial position (same spread as capsules) ---
    this.group.position.set(-2 + index * 1.3, 6, 0);
    this.group.userData = { index, color: participant.color };
    this.group.castShadow = true;
  }

  /** Trigger the hatch: hide intact egg, show fragments */
  hatch(): void {
    this.intact.visible = false;
    this.fragments.forEach((f) => {
      f.visible = true;
    });
  }

  addToScene(scene: THREE.Scene): void {
    scene.add(this.group);
  }
}
```

**Note on three-pinata API**: The `DestructibleMesh` constructor and `fracture()` API may differ slightly from the documented examples. During implementation, check the actual exports from `@dgreenheck/three-pinata` and adjust accordingly. The key contract is: pass a geometry + outer/inner materials, get back a group of fragment meshes that can be hidden/shown. If the API differs (e.g., different constructor signature, different fracture options), adapt the code to match. The `fractureMethod: "voronoi"` and `fragmentCount: 8` are the desired settings.

#### 5. Delete CoinSlot

**File**: `src/objects/machine/CoinSlot.ts` — **Delete this file**
**File**: `src/objects/Machine.ts` — Remove the `createCoinSlot` import and call

```typescript
// Remove these lines from Machine.ts:
import { createCoinSlot } from "@/objects/machine/CoinSlot";
// ...
createCoinSlot(this.group);
```

**File**: `src/config.ts` — Remove `coinSlot` from `MACHINE_COLORS`

```typescript
// Remove this line:
coinSlot: PALETTE.teal.dark,
```

#### 6. Update Experience.ts — Replace Capsule with Egg (type only)

**File**: `src/Experience.ts`
**Changes**: Change import and type from `Capsule` to `Egg`. Change the `capsules` property name to `eggs`. Update all references.

```typescript
// Change import
import { Egg } from "@/objects/Egg";
// ...
eggs!: Egg[];
// ...
this.eggs = participants.map((p, i) => {
  const e = new Egg(p, i);
  e.addToScene(this.scene);
  return e;
});
```

All references to `this.capsules` become `this.eggs`, and all references to `c.group` in loops remain `e.group`. Animation function signatures also change from `Capsule[]` to `Egg[]` but the animation rewrites happen in later phases.

**Important**: At this point, the animation files still reference `Capsule` type. To keep the build passing, temporarily update the animation file imports to use `Egg` instead of `Capsule`, keeping the same function bodies. The full animation rewrites come in Phases 4 and 5.

#### 7. Update UIManager.ts — Remove Handle Button References

**File**: `src/ui/UIManager.ts`
**Changes**: Remove `handleBtn` property, remove `showHandleButton()`, `disableHandleButton()` methods, remove `spin` from `bindEvents`. Remove the handle button line from `resetAll()`.

Remove from constructor:

```typescript
// Remove:
this.handleBtn = document.getElementById("handle-btn") as HTMLButtonElement;
```

Remove from `bindEvents`:

```typescript
// Remove:
this.handleBtn.addEventListener("click", handlers.spin);
```

Remove `spin` from the `handlers` parameter type.

Remove methods:

```typescript
// Delete entirely:
showHandleButton();
disableHandleButton();
```

Update `showResetButton()`:

```typescript
showResetButton(): void {
  // Remove: this.handleBtn.classList.add("hidden");
  this.resetBtn.classList.remove("hidden");
}
```

Update `resetAll()`:

```typescript
resetAll(): void {
  this.resetBtn.classList.add("hidden");
  this.startBtn.classList.remove("hidden");
  // Remove: this.handleBtn.classList.add("hidden");
  // Remove: this.handleBtn.disabled = false;
  // Remove: this.handleBtn.classList.remove("spinning");
  this.titleEl.classList.remove("hidden");
  this.participantThemesEl.classList.add("hidden");
  this.participantThemesEl.style.opacity = "";
}
```

#### 8. Update index.html — Remove Handle Button

**File**: `index.html`
**Changes**: Remove the handle button element and update start button text.

```html
<!-- Remove this line: -->
<button id="handle-btn" class="hidden">PUTAR!</button>

<!-- Update start button text: -->
<button id="start-btn">MASUKKAN TELUR</button>
```

#### 9. Update style.css — Remove Handle Button Styles

**File**: `style.css`
**Changes**: Remove all `#handle-btn` rules and the `.spinning` keyframe animation.

Remove these blocks:

```css
#handle-btn { ... }
#handle-btn:hover { ... }
#handle-btn:active { ... }
#handle-btn:disabled { ... }
#handle-btn.spinning { ... }
@keyframes pulse { ... }
```

### Success Criteria:

#### Automated Verification:

- [x] `npm install` succeeds (three-pinata installed)
- [x] TypeScript compiles: `npx tsc --noEmit`
- [x] Build succeeds: `npm run build`
- [x] Tests pass: `npm test` (update GameState tests for new states)
- [x] Lint passes: `npm run lint`

#### Manual Verification:

- [x] App loads without errors (eggs render with LatheGeometry shape instead of capsule spheres)
- [x] No `#handle-btn` element in DOM
- [x] CoinSlot geometry is gone from the machine
- [x] Egg meshes are visible and colored per participant

**Implementation Note**: After completing this phase, the game flow will be partially broken (animations reference old states, raycasting not yet wired). The app should load and render eggs in idle orbit, but clicking "MASUKKAN TELUR" won't work correctly yet. That's expected — Phases 2-5 fix the flow. Pause here for manual confirmation that eggs render correctly.

---

## Phase 2: Machine Parts — Nest Tray, Handle Raycasting, Dome Light

### Overview

Replace ExitChute with a LatheGeometry nest/bowl tray, add raycasting layer to handle meshes, add a PointLight inside the dome, and wire up 3D handle clicking in Experience.ts.

### Changes Required:

#### 1. Rewrite ExitChute → NestTray

**File**: `src/objects/machine/ExitChute.ts` — Rename to `src/objects/machine/NestTray.ts`
**Changes**: Replace box geometry with a LatheGeometry bowl shape. Return the mesh so Experience can use it as a landing target.

```typescript
import * as THREE from "three";
import { MACHINE_COLORS } from "@/config";
import { createTrimMaterial } from "@/objects/machine/materials";

export function createNestTray(group: THREE.Group): THREE.Mesh {
  // Bowl profile — half-circle with flat bottom
  const points: THREE.Vector2[] = [];
  const bowlRadius = 0.6;
  const bowlDepth = 0.3;
  const segments = 20;
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 0.5; // 0 to 90°
    points.push(new THREE.Vector2(bowlRadius * Math.sin(t), -bowlDepth * Math.cos(t)));
  }
  // Add outer rim lip
  points.push(new THREE.Vector2(bowlRadius + 0.05, 0));
  points.push(new THREE.Vector2(bowlRadius + 0.05, 0.05));

  const bowlGeo = new THREE.LatheGeometry(points, 32);
  const bowlMat = new THREE.MeshStandardMaterial({
    color: MACHINE_COLORS.chute,
    metalness: 0.3,
    roughness: 0.5,
  });
  const bowl = new THREE.Mesh(bowlGeo, bowlMat);
  bowl.position.set(0, 0.85, 1.7);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  group.add(bowl);

  // Trim ring around bowl
  const trimMat = createTrimMaterial();
  const trimRing = new THREE.Mesh(new THREE.TorusGeometry(bowlRadius + 0.05, 0.04, 8, 32), trimMat);
  trimRing.rotation.x = Math.PI / 2;
  trimRing.position.set(0, 0.9, 1.7);
  group.add(trimRing);

  return bowl;
}
```

#### 2. Update Machine.ts — Add NestTray Return, Remove CoinSlot

**File**: `src/objects/Machine.ts`
**Changes**: Import `createNestTray` instead of `createExitChute`. Store `nestTray` as a property. Remove `createCoinSlot` import/call.

```typescript
import * as THREE from "three";
import { createBase } from "@/objects/machine/Base";
import { createBody } from "@/objects/machine/Body";
import { createDome } from "@/objects/machine/Dome";
import { createTopCap } from "@/objects/machine/TopCap";
import { createNestTray } from "@/objects/machine/NestTray";
import { createHandle } from "@/objects/machine/Handle";
import { createLabel } from "@/objects/machine/Label";
import { createDecorations } from "@/objects/machine/Decorations";

export class Machine {
  group: THREE.Group;
  handle: THREE.Group;
  dome: THREE.Mesh;
  nestTray: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    createBase(this.group);
    createBody(this.group);
    this.dome = createDome(this.group);
    createTopCap(this.group);
    this.nestTray = createNestTray(this.group);
    this.handle = createHandle(this.group);
    createLabel(this.group);
    createDecorations(this.group);
    scene.add(this.group);
  }
}
```

#### 3. Handle — Add Raycasting Layer

**File**: `src/objects/machine/Handle.ts`
**Changes**: Enable layer 1 on all handle child meshes so the raycaster can target them.

```typescript
import * as THREE from "three";
import { MACHINE_COLORS } from "@/config";

/** Raycasting layer for interactive objects */
export const INTERACTIVE_LAYER = 1;

export function createHandle(group: THREE.Group): THREE.Group {
  const handle = new THREE.Group();

  const stemMat = new THREE.MeshStandardMaterial({
    color: MACHINE_COLORS.handleStem,
    metalness: 0.6,
    roughness: 0.3,
  });

  const handleStem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 12), stemMat);
  handleStem.rotation.x = Math.PI / 2;
  handleStem.position.set(0, 1.7, 1.55);
  handleStem.layers.enable(INTERACTIVE_LAYER);
  handle.add(handleStem);

  const handleArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.06), stemMat);
  handleArm.position.set(0, 1.25, 1.8);
  handleArm.layers.enable(INTERACTIVE_LAYER);
  handle.add(handleArm);

  const handleBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 16, 16),
    new THREE.MeshStandardMaterial({
      color: MACHINE_COLORS.handleBall,
      metalness: 0.7,
      roughness: 0.2,
    }),
  );
  handleBall.position.set(0, 0.78, 1.8);
  handleBall.layers.enable(INTERACTIVE_LAYER);
  handle.add(handleBall);

  group.add(handle);
  return handle;
}
```

#### 4. Dome — Add Interior PointLight

**File**: `src/objects/machine/Dome.ts`
**Changes**: Add a PointLight inside the dome, initially off (intensity 0). Return it alongside the dome mesh so Experience can control it.

Change the return type to return both dome and light:

```typescript
import * as THREE from "three";
import { MACHINE_COLORS } from "@/config";
import { createTrimMaterial } from "@/objects/machine/materials";

export interface DomeResult {
  mesh: THREE.Mesh;
  light: THREE.PointLight;
}

export function createDome(group: THREE.Group): DomeResult {
  // Glass sphere
  const domeGeo = new THREE.SphereGeometry(1.5, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const domeMat = new THREE.MeshPhysicalMaterial({
    color: MACHINE_COLORS.dome,
    transparent: true,
    opacity: 0.18,
    metalness: 0,
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 0.5,
  });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.y = 3.6;
  dome.scale.y = 1.15;
  group.add(dome);

  // Dome border ring
  const trimMat = createTrimMaterial();
  const domeBorder = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.07, 12, 48), trimMat);
  domeBorder.rotation.x = Math.PI / 2;
  domeBorder.position.y = 3.6;
  group.add(domeBorder);

  // Interior light (starts off)
  const domeLight = new THREE.PointLight(0xfaab36, 0, 5);
  domeLight.position.set(0, 4.2, 0);
  group.add(domeLight);

  return { mesh: dome, light: domeLight };
}
```

Update `Machine.ts` to handle the new return type:

```typescript
dome: THREE.Mesh;
domeLight: THREE.PointLight;
// ...
const domeResult = createDome(this.group);
this.dome = domeResult.mesh;
this.domeLight = domeResult.light;
```

#### 5. Experience.ts — Add Raycasting

**File**: `src/Experience.ts`
**Changes**: Add raycaster, mouse vector, and canvas click listener. On click, check if handle was hit and game is in `Idle` state (to trigger the gacha).

Add to constructor after machine creation:

```typescript
// Raycasting for 3D handle click
this.raycaster = new THREE.Raycaster();
this.raycaster.layers.set(1); // Only test interactive layer
this.mouse = new THREE.Vector2();

canvas.addEventListener("click", (e) => {
  this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  this.raycaster.setFromCamera(this.mouse, this.camera);
  const hits = this.raycaster.intersectObjects(this.machine.handle.children, true);
  if (hits.length > 0 && this.gameState.is(GameStateType.Idle)) {
    this.triggerGacha();
  }
});

// Add cursor change on hover
canvas.addEventListener("mousemove", (e) => {
  this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  this.raycaster.setFromCamera(this.mouse, this.camera);
  const hits = this.raycaster.intersectObjects(this.machine.handle.children, true);
  canvas.style.cursor =
    hits.length > 0 && this.gameState.is(GameStateType.Idle) ? "pointer" : "default";
});
```

Add properties:

```typescript
private raycaster!: THREE.Raycaster;
private mouse!: THREE.Vector2;
```

#### 6. Update Experience.ts — Remove spin from UI bindings

Since the handle button is removed, remove the `spin` handler from `ui.bindEvents`:

```typescript
this.ui.bindEvents({
  start: () => this.startEntry(),
  // spin removed — handled by raycasting
  reset: () => this.resetGame(),
  edit: () => this.openEditor(),
  saveParticipants: (nextParticipants) => this.applyParticipantEdits(nextParticipants),
});
```

### Success Criteria:

#### Automated Verification:

- [x] TypeScript compiles: `npx tsc --noEmit`
- [x] Build succeeds: `npm run build`
- [x] Tests pass: `npm test`

#### Manual Verification:

- [x] Nest tray (bowl shape) visible at bottom front of machine where box chute used to be
- [x] Hovering over handle shows pointer cursor
- [x] Clicking handle in Idle state logs/triggers the gacha sequence start
- [x] CoinSlot geometry is gone
- [x] No visual regressions on machine shape

**Implementation Note**: At this point, `triggerGacha()` doesn't exist yet — it will be wired in Phase 4. For now, wire it to `startEntry()` temporarily so clicking the handle has an effect. Pause here for manual confirmation.

---

## Phase 3: Orbit System — Tilted Elliptical Orbit with Ghost Trail

### Overview

Replace the flat circular orbit in `Experience.ts` with a tilted elliptical orbit using nested Object3D pivots. Add 8-clone ghost trail per egg.

### Changes Required:

#### 1. New File — OrbitSystem

**File**: `src/objects/OrbitSystem.ts` (new file)
**Changes**: Create a system that manages orbit pivots and ghost trail clones for all eggs.

```typescript
import * as THREE from "three";
import type { Egg } from "@/objects/Egg";

const TRAIL_COUNT = 8;
const ORBIT_RADIUS_MAJOR = 2.0;
const ORBIT_RADIUS_MINOR = 0.8;
const ORBIT_TILT = Math.PI * 0.3; // ~54° tilt on Z
const ORBIT_Y = 5.2; // Orbit center height

export class OrbitSystem {
  private pivots: THREE.Object3D[] = [];
  private trails: THREE.Mesh[][] = [];
  private positionHistory: THREE.Vector3[][] = [];
  /** Current orbit speed — can be accelerated during BuildingUp */
  speed: number = 0.4;

  constructor(eggs: Egg[], scene: THREE.Scene) {
    eggs.forEach((egg, i) => {
      // Create tilted pivot
      const pivot = new THREE.Object3D();
      pivot.position.y = ORBIT_Y;
      pivot.rotation.z = ORBIT_TILT;
      // Stagger initial angle
      pivot.rotation.y = (i / eggs.length) * Math.PI * 2;
      scene.add(pivot);

      // Reparent egg under pivot
      egg.group.position.set(ORBIT_RADIUS_MAJOR, 0, ORBIT_RADIUS_MINOR);
      pivot.add(egg.group);
      this.pivots.push(pivot);

      // Create ghost trail clones
      const eggTrail: THREE.Mesh[] = [];
      const history: THREE.Vector3[] = [];
      for (let t = 0; t < TRAIL_COUNT; t++) {
        const clone = egg.intact.clone();
        const mat = (clone.material as THREE.MeshStandardMaterial).clone();
        mat.transparent = true;
        mat.opacity = 0.5 * (1 - t / TRAIL_COUNT);
        clone.material = mat;
        clone.visible = false;
        scene.add(clone);
        eggTrail.push(clone);
        history.push(new THREE.Vector3());
      }
      this.trails.push(eggTrail);
      this.positionHistory.push(history);
    });
  }

  /** Call each frame during orbit states */
  update(delta: number, elapsed: number): void {
    this.pivots.forEach((pivot, i) => {
      // Orbital rotation
      pivot.rotation.y += this.speed * delta;
      // Self-spin on egg
      const egg = pivot.children[0];
      if (egg) {
        egg.rotation.y += this.speed * delta * 2;
        egg.rotation.x = Math.sin(elapsed * 0.8 + i) * 0.2;
      }
    });
  }

  /** Update ghost trail positions — call each frame when trail is visible */
  updateTrail(): void {
    this.pivots.forEach((pivot, i) => {
      const egg = pivot.children[0];
      if (!egg) return;

      // Get egg world position
      const worldPos = new THREE.Vector3();
      egg.getWorldPosition(worldPos);

      const worldQuat = new THREE.Quaternion();
      egg.getWorldQuaternion(worldQuat);

      // Shift history: move each entry one step back
      const history = this.positionHistory[i];
      for (let t = history.length - 1; t > 0; t--) {
        history[t].copy(history[t - 1]);
      }
      history[0].copy(worldPos);

      // Apply to trail clones
      const trail = this.trails[i];
      trail.forEach((clone, t) => {
        clone.position.copy(history[t]);
        clone.quaternion.copy(worldQuat);
        clone.visible = true;
      });
    });
  }

  /** Hide all trail clones */
  hideTrails(): void {
    this.trails.forEach((trail) => {
      trail.forEach((clone) => {
        clone.visible = false;
      });
    });
  }

  /** Show all trail clones */
  showTrails(): void {
    // Trails become visible on next updateTrail() call
  }

  /** Detach an egg from its orbit pivot back to scene root */
  detachEgg(index: number, scene: THREE.Scene): void {
    const pivot = this.pivots[index];
    const egg = pivot.children[0];
    if (!egg) return;

    // Get world position/rotation before detaching
    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    egg.getWorldPosition(worldPos);
    egg.getWorldQuaternion(worldQuat);

    // Reparent to scene
    scene.add(egg);
    egg.position.copy(worldPos);
    egg.quaternion.copy(worldQuat);

    // Hide this egg's trail
    this.trails[index].forEach((clone) => {
      clone.visible = false;
    });
  }

  /** Detach all eggs from orbit back to scene */
  detachAll(scene: THREE.Scene): void {
    this.pivots.forEach((_, i) => this.detachEgg(i, scene));
    this.hideTrails();
  }

  /** Reattach eggs to orbit pivots (for reset) */
  reattach(eggs: Egg[]): void {
    eggs.forEach((egg, i) => {
      const pivot = this.pivots[i];
      egg.group.position.set(ORBIT_RADIUS_MAJOR, 0, ORBIT_RADIUS_MINOR);
      pivot.add(egg.group);
      pivot.rotation.y = (i / eggs.length) * Math.PI * 2;
    });
    this.speed = 0.4;
  }

  /** Clean up */
  dispose(scene: THREE.Scene): void {
    this.pivots.forEach((p) => scene.remove(p));
    this.trails.forEach((trail) => {
      trail.forEach((clone) => {
        scene.remove(clone);
        clone.geometry.dispose();
        (clone.material as THREE.Material).dispose();
      });
    });
  }
}
```

#### 2. Update Experience.ts — Use OrbitSystem in Idle State

**File**: `src/Experience.ts`
**Changes**: Create `OrbitSystem` in constructor, use it in the `Idle` state update instead of manual trigonometry.

Add to constructor:

```typescript
import { OrbitSystem } from "@/objects/OrbitSystem";
// ...
orbitSystem!: OrbitSystem;
// ...
this.orbitSystem = new OrbitSystem(this.eggs, this.scene);
```

Replace the Idle state update block (`Experience.ts:88-98`):

```typescript
if (this.gameState.is(GameStateType.Idle)) {
  this.machine.group.position.y = Math.sin(elapsed * 0.7) * 0.04;
  this.machine.group.rotation.y = Math.sin(elapsed * 0.3) * 0.03;
  this.orbitSystem.update(delta, elapsed);
  // No trail in idle — keep it clean
}
```

Update `resetGame()` to reattach eggs to orbit:

```typescript
// After resetting egg positions:
this.orbitSystem.reattach(this.eggs);
```

### Success Criteria:

#### Automated Verification:

- [x] TypeScript compiles: `npx tsc --noEmit`
- [x] Build succeeds: `npm run build`
- [x] Tests pass: `npm test`

#### Manual Verification:

- [x] Eggs orbit in a tilted elliptical path (not flat circle)
- [x] Orbit is visibly tilted ~54° from horizontal
- [x] Eggs self-rotate as they orbit
- [x] Machine still bobs gently in idle
- [x] Orbit looks smooth and natural

**Implementation Note**: Ghost trails are not shown during Idle — they activate during BuildingUp (Phase 4). Pause here for manual confirmation of orbit appearance.

---

## Phase 4: Animation Flow Part 1 — Triggered, BuildingUp, Capturing

### Overview

Implement the first half of the new animation flow. When the user clicks the 3D handle: the handle cranks (Triggered), eggs accelerate in orbit with ghost trails and dome light glows (BuildingUp), then one egg is captured and pulled into center of dome (Capturing).

### Changes Required:

#### 1. New Animation — TriggerAnimation

**File**: `src/animations/TriggerAnimation.ts` (new file)
**Changes**: Handle crank animation + camera slight zoom.

```typescript
import gsap from "gsap";
import * as THREE from "three";

export function playTriggerAnimation(
  handle: THREE.Group,
  camera: THREE.PerspectiveCamera,
  onComplete: () => void,
): gsap.core.Timeline {
  const tl = gsap.timeline();

  // Handle crank — 3 full rotations
  tl.to(
    handle.rotation,
    {
      x: Math.PI * 6,
      duration: 1.5,
      ease: "power2.inOut",
    },
    0,
  );

  // Camera slight zoom
  tl.to(
    camera.position,
    {
      z: 11,
      y: 3.0,
      duration: 1.0,
      ease: "power2.inOut",
      onUpdate: () => camera.lookAt(0, 2.5, 0),
    },
    0,
  );

  tl.call(onComplete, undefined, ">0.1");
  return tl;
}
```

#### 2. New Animation — BuildUpAnimation

**File**: `src/animations/BuildUpAnimation.ts` (new file)
**Changes**: Accelerate orbit speed, activate dome light, enable ghost trails. Uses the OrbitSystem's speed property.

```typescript
import gsap from "gsap";
import * as THREE from "three";
import type { OrbitSystem } from "@/objects/OrbitSystem";

export function playBuildUpAnimation(
  orbitSystem: OrbitSystem,
  domeLight: THREE.PointLight,
  camera: THREE.PerspectiveCamera,
  machine: THREE.Group,
  onComplete: () => void,
): gsap.core.Timeline {
  const tl = gsap.timeline();

  // Accelerate orbit speed from 0.4 to 8.0 over 3 seconds
  tl.to(
    orbitSystem,
    {
      speed: 8.0,
      duration: 3.0,
      ease: "power2.in",
    },
    0,
  );

  // Dome light glow up
  tl.to(
    domeLight,
    {
      intensity: 1.5,
      duration: 2.0,
      ease: "power2.in",
    },
    0,
  );

  // Camera rise to track orbit
  tl.to(
    camera.position,
    {
      y: 3.5,
      z: 10,
      duration: 2.5,
      ease: "power2.inOut",
      onUpdate: () => camera.lookAt(0, 3.5, 0),
    },
    0,
  );

  // Machine subtle shake (excitement building)
  for (let i = 0; i < 15; i++) {
    const intensity = (i / 15) * 0.05; // Increasing shake
    tl.to(
      machine.position,
      {
        x: (Math.random() - 0.5) * intensity,
        z: (Math.random() - 0.5) * intensity * 0.5,
        duration: 0.1 + Math.random() * 0.1,
      },
      1.5 + i * 0.1,
    );
  }
  tl.to(machine.position, { x: 0, z: 0, duration: 0.3, ease: "power2.out" });

  tl.call(onComplete, undefined, ">0.1");
  return tl;
}
```

#### 3. New Animation — CaptureAnimation

**File**: `src/animations/CaptureAnimation.ts` (new file)
**Changes**: Pick a winner, detach it from orbit, tween it to dome center. Other eggs slow down and fade/drop.

```typescript
import gsap from "gsap";
import * as THREE from "three";
import type { Egg } from "@/objects/Egg";
import type { OrbitSystem } from "@/objects/OrbitSystem";

export function playCaptureAnimation(
  eggs: Egg[],
  orbitSystem: OrbitSystem,
  domeLight: THREE.PointLight,
  camera: THREE.PerspectiveCamera,
  scene: THREE.Scene,
  onComplete: (winnerIndex: number) => void,
): gsap.core.Timeline {
  const tl = gsap.timeline();
  const winnerIndex = Math.floor(Math.random() * eggs.length);

  // Decelerate orbit
  tl.to(
    orbitSystem,
    {
      speed: 0.5,
      duration: 1.0,
      ease: "power3.out",
    },
    0,
  );

  // Detach winner from orbit at the right moment
  tl.call(
    () => {
      orbitSystem.detachEgg(winnerIndex, scene);
    },
    undefined,
    0.5,
  );

  // Tween winner to dome center
  tl.to(
    eggs[winnerIndex].group.position,
    {
      x: 0,
      y: 4.0,
      z: 0,
      duration: 1.0,
      ease: "back.out(1.5)",
    },
    0.6,
  );

  // Winner glows — scale pulse
  tl.to(
    eggs[winnerIndex].group.scale,
    {
      x: 1.3,
      y: 1.3,
      z: 1.3,
      duration: 0.5,
      ease: "elastic.out(1, 0.5)",
    },
    1.2,
  );

  // Camera swoop toward dome
  tl.to(
    camera.position,
    {
      x: 1,
      y: 4.0,
      z: 8,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: () => camera.lookAt(0, 4.0, 0),
    },
    0.3,
  );

  // Losers detach and drop
  tl.call(
    () => {
      eggs.forEach((egg, i) => {
        if (i !== winnerIndex) {
          orbitSystem.detachEgg(i, scene);
          gsap.to(egg.group.position, {
            y: -4,
            x: (Math.random() - 0.5) * 5,
            duration: 0.8,
            ease: "power2.in",
          });
          gsap.to(egg.group.scale, {
            x: 0.15,
            y: 0.15,
            z: 0.15,
            duration: 0.8,
            ease: "power2.in",
          });
        }
      });
    },
    undefined,
    1.0,
  );

  // Dome light pulse then dim
  tl.to(
    domeLight,
    {
      intensity: 2.5,
      duration: 0.3,
      ease: "power2.in",
    },
    1.5,
  );
  tl.to(
    domeLight,
    {
      intensity: 0.5,
      duration: 0.5,
      ease: "power2.out",
    },
    1.8,
  );

  // Hide trails
  tl.call(() => orbitSystem.hideTrails(), undefined, 1.0);

  tl.call(() => onComplete(winnerIndex), undefined, ">0.3");
  return tl;
}
```

#### 4. Update Experience.ts — Wire New States and Animations

**File**: `src/Experience.ts`
**Changes**: Replace `startEntry()` and `spinGacha()` with `triggerGacha()` method chain.

New method flow:

```typescript
/** Called when 3D handle is clicked (or start button pressed) */
private triggerGacha(): void {
  if (!this.gameState.is(GameStateType.Idle)) return;
  this.gameState.transition(GameStateType.Triggered);

  this.ui.setEditEnabled(false);
  this.ui.hideTitle();
  this.ui.showParticipantThemes(this.participants);

  playTriggerAnimation(this.machine.handle, this.camera, () => {
    this.machine.handle.rotation.x = 0;
    this.gameState.transition(GameStateType.BuildingUp);
    this.buildUp();
  });
}

private buildUp(): void {
  playBuildUpAnimation(
    this.orbitSystem,
    this.machine.domeLight,
    this.camera,
    this.machine.group,
    () => {
      this.gameState.transition(GameStateType.Capturing);
      this.capture();
    },
  );
}

private capture(): void {
  playCaptureAnimation(
    this.eggs,
    this.orbitSystem,
    this.machine.domeLight,
    this.camera,
    this.scene,
    (winnerIndex) => {
      this.winnerIndex = winnerIndex;
      this.gameState.transition(GameStateType.Dispensing);
      this.dispense();
    },
  );
}
```

Update the `update()` loop to handle BuildingUp state (orbit + trail):

```typescript
} else if (this.gameState.is(GameStateType.BuildingUp)) {
  this.machine.group.position.y = Math.sin(elapsed * 0.7) * 0.02;
  this.orbitSystem.update(delta, elapsed);
  this.orbitSystem.updateTrail();
}
```

Update `startEntry()` (the DOM start button) to also call `triggerGacha()`:

```typescript
private startEntry(): void {
  this.triggerGacha();
}
```

#### 5. Delete Old Animation Files

**Files to delete**:

- `src/animations/EntryAnimation.ts`
- `src/animations/SpinAnimation.ts`

These are fully replaced by `TriggerAnimation.ts`, `BuildUpAnimation.ts`, and `CaptureAnimation.ts`.

### Success Criteria:

#### Automated Verification:

- [x] TypeScript compiles: `npx tsc --noEmit`
- [x] Build succeeds: `npm run build`
- [x] Tests pass: `npm test`

#### Manual Verification:

- [x] Clicking 3D handle triggers: handle crank → orbit acceleration → ghost trails appear → dome glows → one egg captured to center → losers drop
- [x] The "MASUKKAN TELUR" button also triggers the sequence
- [x] Ghost trails fade correctly (newest bright, oldest faint)
- [x] Dome light visibly glows gold during BuildingUp
- [x] Camera movements feel smooth and intentional
- [x] Winner egg ends up centered in dome with slight scale-up

**Implementation Note**: `dispense()` doesn't exist yet — it's implemented in Phase 5. Temporarily have it call a placeholder that transitions to Done. Pause here for manual confirmation of the first half of the animation flow.

---

## Phase 5: Animation Flow Part 2 — Dispensing, Hatching, Done

### Overview

Implement the egg dispensing down to the nest tray, the Voronoi hatch animation with progressive shake and fragment burst, and the final reveal/celebration.

### Changes Required:

#### 1. New Animation — DispenseAnimation

**File**: `src/animations/DispenseAnimation.ts` (new file)
**Changes**: Winner egg shrinks slightly, drops from dome to nest tray with bounce.

```typescript
import gsap from "gsap";
import * as THREE from "three";
import type { Egg } from "@/objects/Egg";

export function playDispenseAnimation(
  egg: Egg,
  nestTrayPosition: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
  domeLight: THREE.PointLight,
  onComplete: () => void,
): gsap.core.Timeline {
  const tl = gsap.timeline();

  // Scale back to normal
  tl.to(
    egg.group.scale,
    {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.3,
      ease: "power2.out",
    },
    0,
  );

  // Drop to nest tray
  tl.to(
    egg.group.position,
    {
      x: nestTrayPosition.x,
      y: nestTrayPosition.y + 0.5, // Sit on top of tray
      z: nestTrayPosition.z,
      duration: 0.8,
      ease: "bounce.out",
    },
    0.2,
  );

  // Rotate while falling
  tl.to(
    egg.group.rotation,
    {
      x: 0,
      y: Math.PI * 2,
      z: 0,
      duration: 0.8,
      ease: "power2.out",
    },
    0.2,
  );

  // Camera follows down to nest tray level
  tl.to(
    camera.position,
    {
      x: 0,
      y: 2.0,
      z: 9,
      duration: 1.0,
      ease: "power2.inOut",
      onUpdate: () =>
        camera.lookAt(nestTrayPosition.x, nestTrayPosition.y + 0.5, nestTrayPosition.z),
    },
    0,
  );

  // Dome light off
  tl.to(
    domeLight,
    {
      intensity: 0,
      duration: 0.5,
      ease: "power2.out",
    },
    0.5,
  );

  tl.call(onComplete, undefined, ">0.3");
  return tl;
}
```

#### 2. New Animation — HatchAnimation

**File**: `src/animations/HatchAnimation.ts` (new file)
**Changes**: Progressive shake → hide intact mesh → show Voronoi fragments → burst fragments outward → reveal winner identity.

```typescript
import gsap from "gsap";
import * as THREE from "three";
import type { Egg } from "@/objects/Egg";

export function playHatchAnimation(
  egg: Egg,
  camera: THREE.PerspectiveCamera,
  scene: THREE.Scene,
  onSparkle: (position: THREE.Vector3) => void,
  onComplete: () => void,
): gsap.core.Timeline {
  const tl = gsap.timeline();

  // --- Phase 1: Progressive shake (1.5s) ---
  // Shake intensifies over time
  const shakeSteps = 30;
  for (let i = 0; i < shakeSteps; i++) {
    const intensity = (i / shakeSteps) * 0.15;
    const duration = 0.05;
    tl.to(egg.group.rotation, {
      z: (Math.random() - 0.5) * intensity,
      x: (Math.random() - 0.5) * intensity * 0.5,
      duration,
    });
  }

  // Camera push in for intimate view
  tl.to(
    camera.position,
    {
      x: 0,
      y: 2.5,
      z: 7,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: () => camera.lookAt(egg.group.position),
    },
    0,
  );

  // --- Phase 2: Crack + burst (0.8s) ---
  // Trigger hatch — hide intact, show fragments
  tl.call(() => {
    egg.hatch();
  });

  // Reset rotation before burst
  tl.set(egg.group.rotation, { x: 0, y: 0, z: 0 });

  // Burst fragments outward
  tl.call(() => {
    egg.fragments.forEach((fragment) => {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 1.5 + 0.5,
        (Math.random() - 0.5) * 2,
      ).normalize();

      const speed = 1.5 + Math.random() * 2;
      const target = fragment.position.clone().add(dir.multiplyScalar(speed));

      gsap.to(fragment.position, {
        x: target.x,
        y: target.y,
        z: target.z,
        duration: 0.6 + Math.random() * 0.3,
        ease: "power2.out",
      });

      gsap.to(fragment.rotation, {
        x: Math.random() * Math.PI * 4,
        y: Math.random() * Math.PI * 4,
        z: Math.random() * Math.PI * 2,
        duration: 0.8,
      });

      // Fragments fall with gravity after burst
      gsap.to(fragment.position, {
        y: -2,
        duration: 1.0,
        ease: "power2.in",
        delay: 0.5,
      });

      // Fade out fragments
      gsap.to(fragment.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.5,
        delay: 0.8,
      });
    });
  });

  // Sparkle burst at egg position
  tl.call(() => onSparkle(egg.group.position.clone()), undefined, ">0.2");

  // --- Phase 3: Camera pull back for celebration ---
  tl.to(
    camera.position,
    {
      x: 0,
      y: 3.0,
      z: 10,
      duration: 1.0,
      ease: "power2.out",
      onUpdate: () => camera.lookAt(0, 2.5, 0),
    },
    ">0.3",
  );

  tl.call(onComplete, undefined, ">0.3");
  return tl;
}
```

#### 3. Delete Old Animation File

**File to delete**: `src/animations/RevealAnimation.ts`

Fully replaced by `DispenseAnimation.ts` and `HatchAnimation.ts`.

#### 4. Update Experience.ts — Wire Dispense and Hatch

**File**: `src/Experience.ts`
**Changes**: Implement `dispense()` and `hatchEgg()` methods.

```typescript
private dispense(): void {
  const winner = this.eggs[this.winnerIndex];
  const nestPos = this.machine.nestTray.position.clone();

  playDispenseAnimation(
    winner,
    nestPos,
    this.camera,
    this.machine.domeLight,
    () => {
      this.gameState.transition(GameStateType.Hatching);
      this.hatchEgg();
    },
  );
}

private hatchEgg(): void {
  const winner = this.eggs[this.winnerIndex];

  playHatchAnimation(
    winner,
    this.camera,
    this.scene,
    (position) => createSparkles(this.scene, position),
    () => {
      this.gameState.transition(GameStateType.Done);
      this.ui.showResetButton();
      this.ui.showResult(this.participants[this.winnerIndex]);
      createConfetti(this.scene);
    },
  );
}
```

Update the Done state in `update()`:

```typescript
} else if (this.gameState.is(GameStateType.Done) && this.winnerIndex >= 0) {
  // Winner egg is hatched — just gentle camera float
  // No egg animation since it's broken into fragments
}
```

#### 5. Update resetGame() — Full Reset Including Egg State

**File**: `src/Experience.ts`
**Changes**: Reset eggs (restore intact mesh, hide fragments), reattach to orbit, kill all new animations.

```typescript
private resetGame(): void {
  this.killAllAnimations();

  this.ui.hideResult();
  this.ui.resetAll();
  this.ui.setEditEnabled(true);

  // Camera reset
  gsap.to(this.camera.position, { x: 0, y: 3.0, z: 12, duration: 1, ease: "power2.out" });

  // Machine reset
  gsap.to(this.machine.group.position, { x: 0, y: 0, z: 0, duration: 0.5 });
  gsap.to(this.machine.group.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });
  this.machine.handle.rotation.x = 0;
  this.machine.domeLight.intensity = 0;

  // Reset all eggs
  this.eggs.forEach((egg, i) => {
    // Restore intact mesh, hide fragments
    egg.intact.visible = true;
    egg.fragments.forEach((f) => {
      f.visible = false;
      f.position.set(0, 0, 0);
      f.scale.set(1, 1, 1);
    });
    egg.group.scale.set(1, 1, 1);
    egg.group.rotation.set(0, 0, 0);
  });

  // Reattach eggs to orbit
  this.orbitSystem.reattach(this.eggs);

  this.winnerIndex = -1;
  this.gameState.reset();
}
```

Update `killAllAnimations()` to include new targets:

```typescript
private killAllAnimations(): void {
  this.eggs.forEach((e) => {
    gsap.killTweensOf(e.group.position);
    gsap.killTweensOf(e.group.rotation);
    gsap.killTweensOf(e.group.scale);
    e.fragments.forEach((f) => {
      gsap.killTweensOf(f.position);
      gsap.killTweensOf(f.rotation);
      gsap.killTweensOf(f.scale);
    });
  });
  gsap.killTweensOf(this.machine.group.position);
  gsap.killTweensOf(this.machine.group.rotation);
  gsap.killTweensOf(this.machine.handle.rotation);
  gsap.killTweensOf(this.machine.domeLight);
  gsap.killTweensOf(this.orbitSystem);
  gsap.killTweensOf(this.camera.position);
  if (this.spinTimeout) {
    clearTimeout(this.spinTimeout);
    this.spinTimeout = null;
  }
}
```

### Success Criteria:

#### Automated Verification:

- [x] TypeScript compiles: `npx tsc --noEmit`
- [x] Build succeeds: `npm run build`
- [x] Tests pass: `npm test`

#### Manual Verification:

- [x] Winner egg drops from dome center to nest tray with bounce
- [x] Egg shakes progressively (mild → intense)
- [x] Egg shatters into 6-8 Voronoi fragments that burst outward
- [x] Fragments fall with gravity and fade out
- [x] Sparkles burst at hatch point
- [x] Camera pushes in for hatch, pulls back for celebration
- [x] Result overlay appears with winner info
- [x] Confetti drops
- [x] Reset fully restores: eggs reattach to orbit, intact mesh visible, fragments hidden, dome light off

**Implementation Note**: This is the most visually complex phase. Fragment burst directions and timings may need tuning. The three-pinata `fracture()` output format should be verified at implementation time — if fragments are positioned relative to the egg center, the burst math works as written. If they're in world space, adjust accordingly. Pause for manual confirmation.

---

## Phase 6: Camera Choreography, Polish, and Cleanup

### Overview

Fine-tune camera positions per state, clean up unused code, ensure all transitions are smooth, add hover visual feedback on handle, and verify the complete flow end-to-end.

### Changes Required:

#### 1. Handle Visual Feedback on Hover

**File**: `src/Experience.ts`
**Changes**: When hovering over the handle in Idle state, make the handle ball glow or scale up slightly to indicate interactivity.

```typescript
// In the mousemove handler, after detecting hover:
const handleBall = this.machine.handle.children[2]; // Ball is the 3rd child
if (hits.length > 0 && this.gameState.is(GameStateType.Idle)) {
  canvas.style.cursor = "pointer";
  gsap.to(handleBall.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.2, overwrite: true });
} else {
  canvas.style.cursor = "default";
  gsap.to(handleBall.scale, { x: 1, y: 1, z: 1, duration: 0.2, overwrite: true });
}
```

#### 2. Camera LookAt Target Consistency

**File**: `src/Experience.ts`
**Changes**: Ensure camera always looks at the right target during each state. Add a `cameraTarget` property that smoothly transitions.

In the `update()` loop, after all state checks and before render:

```typescript
// Smooth camera lookAt (only during states that aren't actively animating the camera)
if (this.gameState.is(GameStateType.Idle)) {
  this.camera.lookAt(0, 2.5, 0);
} else if (this.gameState.is(GameStateType.Done)) {
  this.camera.lookAt(0, 2.5, 0);
}
```

#### 3. Participant Themes Timing

**File**: `src/Experience.ts`
**Changes**: Show participant themes at start, fade out when capturing begins.

In `triggerGacha()`:

```typescript
this.ui.showParticipantThemes(this.participants);
```

In `capture()` (at the beginning):

```typescript
this.ui.fadeOutParticipantThemes();
```

#### 4. Update Start Button Flow

**File**: `src/Experience.ts`
**Changes**: The "MASUKKAN TELUR" button should directly trigger the gacha (same as clicking the handle). Remove the old `startEntry()` → `Entering` → `Ready` flow entirely.

```typescript
this.ui.bindEvents({
  start: () => this.triggerGacha(),
  reset: () => this.resetGame(),
  edit: () => this.openEditor(),
  saveParticipants: (nextParticipants) => this.applyParticipantEdits(nextParticipants),
});
```

#### 5. Cleanup — Remove Unused Imports and References

**Files to check**:

- `src/Experience.ts` — Remove any remaining Capsule imports, old animation imports
- `src/config.ts` — Remove `coinSlot` from MACHINE_COLORS if not already done
- `src/objects/Machine.ts` — Verify no CoinSlot or ExitChute imports remain

#### 6. Update Tests — GameState Tests

**File**: `tests/state/GameState.test.ts`
**Changes**: Update to test new state transitions.

```typescript
// Test the new transition chain:
// Idle → Triggered → BuildingUp → Capturing → Dispensing → Hatching → Done → Idle
```

### Success Criteria:

#### Automated Verification:

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Build succeeds: `npm run build`
- [ ] All tests pass: `npm test`
- [ ] Lint passes: `npm run lint`
- [ ] No unused imports: `npm run knip`

#### Manual Verification:

- [ ] **Complete flow end-to-end**: Idle → click handle → crank → orbit accelerates with ghost trails → dome glows → egg captured → losers drop → egg dispenses to nest → egg shakes → egg shatters → sparkles → result overlay → confetti → reset works
- [ ] Handle ball scales up on hover, pointer cursor shown
- [ ] "MASUKKAN TELUR" button triggers same flow as handle click
- [ ] Camera movements are smooth throughout all states
- [ ] Participant themes shown at start, fade out during capture
- [ ] Reset returns everything to pristine state (orbit, trails hidden, dome light off, fragments hidden)
- [ ] No console errors or warnings
- [ ] Multiple consecutive play-throughs work (play → reset → play → reset)

**Implementation Note**: This is the final polish phase. Focus on timing, easing curves, and visual coherence. The ghost trail clone count, orbit speed curve, and fragment burst intensity can all be tuned here. Pause for final manual confirmation.

---

## Testing Strategy

### Unit Tests:

- `GameState.test.ts` — Update for new 7-state transition chain
- Test invalid transitions (e.g., `Idle → Capturing` should fail)
- Test `reset()` still bypasses validation

### Build Verification:

- `npm run build` — TypeScript + Vite build
- `npm run typecheck` — Type checking
- `npm run lint` — Linting
- `npm run knip` — Dead code detection

### Manual Testing Steps:

1. Load page — eggs orbit in tilted elliptical path, machine bobs
2. Hover over handle — ball scales up, cursor becomes pointer
3. Click handle — handle cranks, orbit accelerates, ghost trails appear, dome glows
4. Watch capture — one egg centered in dome, others drop
5. Watch dispense — egg falls to nest tray with bounce
6. Watch hatch — progressive shake, Voronoi burst, sparkles
7. See result — overlay with winner theme, confetti
8. Click "ULANGI" — full reset, eggs back in orbit
9. Click "MASUKKAN TELUR" — same flow triggers
10. Click "EDIT PESERTA" — editor works, save reloads page
11. Resize window — machine remains properly framed
12. Play 3 consecutive rounds — no state leaks or visual artifacts

## Performance Considerations

- **three-pinata pre-fracture**: Done at construction time, not runtime. Fragments are hidden meshes — zero GPU cost until hatch moment.
- **Ghost trail clones**: 8 clones × 4 eggs = 32 extra meshes during BuildingUp. Each is a simple LatheGeometry. Negligible on modern GPUs.
- **OrbitSystem world position queries**: `getWorldPosition()` called per frame per egg during trail update. Cached in Vector3 — no allocation pressure.
- **Fragment cleanup**: Fragments are children of the egg group, not separate scene objects. Reset hides them (no dispose/recreate needed).

## Dependencies

| Package                    | Version | Purpose                               |
| -------------------------- | ------- | ------------------------------------- |
| `@dgreenheck/three-pinata` | latest  | Voronoi mesh fracturing for egg hatch |

## File Change Summary

| File                                  | Change Type                          | Phase |
| ------------------------------------- | ------------------------------------ | ----- |
| `src/types/index.ts`                  | Edit (new states)                    | 1     |
| `src/state/GameState.ts`              | Edit (new transitions)               | 1     |
| `src/objects/Egg.ts`                  | **New file**                         | 1     |
| `src/objects/machine/CoinSlot.ts`     | **Delete**                           | 1     |
| `src/config.ts`                       | Edit (remove coinSlot)               | 1     |
| `src/objects/Machine.ts`              | Edit (remove CoinSlot, add nestTray) | 1, 2  |
| `src/ui/UIManager.ts`                 | Edit (remove handle button)          | 1     |
| `index.html`                          | Edit (remove handle button)          | 1     |
| `style.css`                           | Edit (remove handle button styles)   | 1     |
| `src/objects/Capsule.ts`              | **Delete** (replaced by Egg.ts)      | 1     |
| `src/objects/machine/ExitChute.ts`    | **Delete** → `NestTray.ts`           | 2     |
| `src/objects/machine/NestTray.ts`     | **New file**                         | 2     |
| `src/objects/machine/Handle.ts`       | Edit (add raycasting layer)          | 2     |
| `src/objects/machine/Dome.ts`         | Edit (add interior PointLight)       | 2     |
| `src/objects/OrbitSystem.ts`          | **New file**                         | 3     |
| `src/animations/EntryAnimation.ts`    | **Delete**                           | 4     |
| `src/animations/SpinAnimation.ts`     | **Delete**                           | 4     |
| `src/animations/TriggerAnimation.ts`  | **New file**                         | 4     |
| `src/animations/BuildUpAnimation.ts`  | **New file**                         | 4     |
| `src/animations/CaptureAnimation.ts`  | **New file**                         | 4     |
| `src/animations/RevealAnimation.ts`   | **Delete**                           | 5     |
| `src/animations/DispenseAnimation.ts` | **New file**                         | 5     |
| `src/animations/HatchAnimation.ts`    | **New file**                         | 5     |
| `src/Experience.ts`                   | **Major rewrite**                    | 1-6   |
| `tests/state/GameState.test.ts`       | Edit (new states)                    | 6     |

## References

- Research document: `thoughts/shared/research/2026-03-25-gashapon-egg-redesign-implementation.md`
- Previous plan (completed): `thoughts/shared/plans/2026-03-25-gashapon-redesign.md`
- three-pinata: https://github.com/dgreenheck/three-pinata
- LatheGeometry egg: https://www.prowaretech.com/articles/current/javascript/three-js/egg-geometry
- Raycasting tutorial: https://ryanschiang.com/threejs-clickable-vertices-tutorial
- Nested pivot orbit: https://waelyasmina.net/articles/how-to-make-an-object-rotate-around-another-object-in-three-js/
