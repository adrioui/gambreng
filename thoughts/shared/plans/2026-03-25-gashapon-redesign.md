# Gashapon Machine Redesign + #FAAB36 Primary Color Implementation Plan

## Overview

Redesign the 3D gacha machine from a cylindrical gumball-style machine into a proper Japanese **gashapon (capsule vending machine)** with a boxy rectangular body and transparent dome. Simultaneously shift the color system so **#FAAB36 (warm gold)** is the dominant machine color instead of an accent, with teals and darker oranges used as contrasting accents.

## Current State Analysis

### Current Machine Shape

- **Body**: Tapered cylinder (`CylinderGeometry(1.5, 1.7, 2.8, 32)`) — top radius 1.5, bottom 1.7, height 2.8
- **Base**: Tapered cylinder disc (`CylinderGeometry(1.8, 2, 0.5, 32)`) with 4 cylindrical feet
- **Dome**: Partial sphere (`SphereGeometry(1.6, 48, 32, 0, PI*2, 0, PI*0.55)`) scaled Y by 1.2
- **TopCap**: Tapered cone (`CylinderGeometry(0.4, 1.0, 0.7, 32)`)
- **Handle**: Stem + arm + ball group protruding from front
- **ExitChute**: Box protruding from lower front
- **CoinSlot**: Plate + slit on front panel
- **Decorations**: 5 octahedron star studs + 2 side panels
- **Label**: Plane with texture/canvas fallback

### Current Color Assignments

| Part        | Color          | Hex       |
| ----------- | -------------- | --------- |
| Body        | Mid teal       | `#008083` |
| Base        | Dark orange    | `#FD5901` |
| Cap         | Dark orange    | `#FD5901` |
| Front panel | Dark teal      | `#005F60` |
| Trim rings  | Gold           | `#FAAB36` |
| Feet        | Very dark teal | `#003D3D` |
| Chute       | Very dark teal | `#003D3D` |
| Handle stem | Steel grey     | `#374151` |
| Handle ball | Gold           | `#FAAB36` |
| Stars       | Gold           | `#FAAB36` |
| Side panels | Mid-dark teal  | `#006566` |

### Key Constraints

- `Machine.handle` is referenced by `SpinAnimation.ts` via `handle.rotation.x` — must remain a `THREE.Group`
- `Machine.dome` is stored but not animated — safe to reshape
- `Machine.group` is animated (idle bob, shake during spin, reset tween) — overall dimensions can change but group pivot stays at origin
- Capsule positions during animations reference hardcoded Y values (e.g., `y: 3.5 + random * 1.5` in spin, `y: 4 + random * 0.8` in entry) — these must be updated to match new dome interior
- Camera position starts at `(0, 3.5, 9)` and looks at `(0, 2, 0)` — may need minor adjustment for new proportions

## Desired End State

A machine that looks like a classic **Bandai-style gashapon capsule vending machine**:

- **Boxy rectangular body** with slightly rounded edges (not cylindrical)
- **Large transparent dome** on top filled with visible capsules
- **Front-mounted rotating crank/knob** on the body
- **Coin slot** on the front panel
- **Exit chute** at the bottom front with a door/opening
- **Display header/label panel** on the body face
- **#FAAB36 as the dominant body color**
- Proper gashapon proportions (~2.25:1 height:width ratio)

### Verification

- Visual: Machine is instantly recognizable as a gashapon/capsule vending machine
- Functional: All existing game states (Idle, Entering, Ready, Spinning, Revealing, Done) work correctly
- Animations: Entry, spin, reveal, and idle animations play smoothly with correct positions
- Color: `#FAAB36` is clearly the dominant color when viewing the machine
- Tests: All existing unit tests pass (`npm test`)
- Build: `npm run build` succeeds without errors

## What We're NOT Doing

- Changing the game flow or state machine logic
- Changing the capsule design (`Capsule.ts`)
- Changing the UI overlay layout (HTML/CSS structure)
- Adding new game features (display capsules inside dome is deferred — can be a follow-up)
- Changing the participant editor or URL encoding
- Changing the environment (sky, ground, lights) — only minor tweaks if needed
- Adding new dependencies

## Implementation Approach

Split into **4 phases**, each producing a working build. The core strategy is:

1. First update the color palette (config-only change, instant visual shift)
2. Then reshape the body from cylinder to rounded box
3. Then reshape the base/feet to match
4. Finally adjust dome, top cap, and all dependent positions (animations, camera)

Each phase is independently testable and the machine remains functional throughout.

---

## Phase 1: Color Palette Shift — Make #FAAB36 Dominant

### Overview

Remap `MACHINE_COLORS` so #FAAB36 is used for the large surfaces (body, base, cap) and darker colors become accents. Update CSS to match.

### Changes Required:

#### 1. Config — Color Remapping

**File**: `src/config.ts`
**Changes**: Update `MACHINE_COLORS` assignments

```typescript
export const MACHINE_COLORS = {
  foot: PALETTE.teal.dark, // #005F60 (was #003D3D)
  base: PALETTE.orange.mid, // #F78104 (was #FD5901)
  body: PALETTE.orange.gold, // #FAAB36 (was #008083) ← PRIMARY CHANGE
  panel: PALETTE.teal.mid, // #008083 (was #005F60)
  trim: PALETTE.orange.dark, // #FD5901 (was #FAAB36) — swap: trim is now dark orange
  dome: 0xaaddff, // unchanged
  cap: PALETTE.orange.gold, // #FAAB36 (was #FD5901)
  coinSlot: PALETTE.teal.dark, // #005F60 (was #003D3D)
  chute: PALETTE.teal.mid, // #008083 (was #003D3D)
  handleStem: PALETTE.metal.dark, // unchanged
  handleBall: PALETTE.orange.dark, // #FD5901 (was #FAAB36) — swap with trim
  star: PALETTE.teal.bright, // #249EA0 (was #FAAB36) — teal stars for contrast
  sidePanel: PALETTE.teal.dark, // #005F60 (was #006566)
} as const;
```

**Rationale**: The body is the largest surface area and gets #FAAB36. Trim rings swap to dark orange (#FD5901) so they contrast against the now-gold body. Stars become teal for contrast. Cap becomes gold to unify with the body.

#### 2. CSS — Button and UI Color Updates

**File**: `style.css`
**Changes**: Update background body color and button gradients to be consistent with the new palette hierarchy.

```css
body {
  background: #002a2a; /* slightly lighter than current #003d3d for contrast with teal accents */
}
```

Update `#start-btn` to use #FAAB36 as primary gradient:

```css
#start-btn {
  background: linear-gradient(180deg, #faab36 0%, #f78104 100%);
  color: #fff;
  box-shadow:
    0 5px 0 #a35600,
    0 8px 20px rgba(250, 171, 54, 0.3);
}
#start-btn:hover {
  box-shadow:
    0 7px 0 #a35600,
    0 10px 25px rgba(250, 171, 54, 0.4);
}
#start-btn:active {
  box-shadow: 0 2px 0 #a35600;
}
```

Update `#edit-btn` to use teal (secondary):

```css
#edit-btn {
  background: linear-gradient(180deg, #249ea0 0%, #008083 100%);
  box-shadow:
    0 5px 0 #005f60,
    0 8px 20px rgba(36, 158, 160, 0.3);
}
```

Update `#save-editor-btn` to use gold:

```css
#save-editor-btn {
  background: linear-gradient(180deg, #faab36 0%, #f78104 100%);
  color: #fff;
  box-shadow: 0 4px 0 #a35600;
}
```

#### 3. Environment — Ground Ring Color

**File**: `src/objects/Environment.ts`
**Changes**: Update ground ring color from `0xf78104` to `0xfaab36` so the ground glow matches the new primary.

```typescript
color: 0xfaab36, // was 0xf78104
```

### Success Criteria:

#### Automated Verification:

- [x] TypeScript compiles: `npx tsc --noEmit`
- [x] Build succeeds: `npm run build`
- [x] Tests pass: `npm test`
- [x] Lint passes: `npx vp lint`

#### Manual Verification:

- [x] Machine body appears warm gold (#FAAB36) — dominant color
- [x] Trim rings are visible dark orange against gold body
- [x] Buttons feel consistent with the orange-gold theme
- [x] All game states (idle, spin, reveal) still work

**Implementation Note**: After completing this phase, pause for manual confirmation before proceeding.

---

## Phase 2: Reshape Body — Cylinder to Rounded Box

### Overview

Replace the cylindrical body with a `BoxGeometry` that has beveled/rounded edges using Three.js `ExtrudeGeometry` with a `RoundedRectShape`, or a simple `BoxGeometry` (since Three.js doesn't natively support rounded BoxGeometry). For a clean rounded look, we'll use a custom approach with `ExtrudeGeometry` + a rounded rectangle shape.

### Changes Required:

#### 1. Body — Cylinder to Rounded Box

**File**: `src/objects/machine/Body.ts`
**Changes**: Replace `CylinderGeometry` with a rounded box shape.

**New body dimensions** (maintaining ~2.25:1 height:width gashapon proportions):

- Width: 3.0 (replaces diameter ~3.0-3.4)
- Depth: 2.4 (shallower than wide — authentic gashapon proportions, ~0.8x width)
- Height: 2.8 (same as current)
- Corner radius: 0.2

```typescript
import * as THREE from "three";
import { MACHINE_COLORS } from "@/config";
import { createTrimMaterial } from "@/objects/machine/materials";
import { createRoundedBox } from "@/utils/roundedBox";

export function createBody(group: THREE.Group): void {
  // Main body — rounded box
  const bodyMat = new THREE.MeshStandardMaterial({
    color: MACHINE_COLORS.body,
    metalness: 0.1,
    roughness: 0.75,
  });
  const body = createRoundedBox(3.0, 2.8, 2.4, 0.2);
  body.material = bodyMat;
  body.position.y = 2.2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Front face panel — slightly inset rectangle on front
  const panelMat = new THREE.MeshStandardMaterial({
    color: MACHINE_COLORS.panel,
    metalness: 0.2,
    roughness: 0.6,
  });
  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 0.1), panelMat);
  panel.position.set(0, 2, 1.25); // z adjusted for box depth
  group.add(panel);

  // Trim rings — horizontal box-shaped trim strips instead of torus
  const trimMat = createTrimMaterial();
  [1.2, 2.0, 2.8, 3.5].forEach((y) => {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.08, 2.5), trimMat);
    trim.position.y = y;
    group.add(trim);
  });
}
```

#### 2. New Utility — Rounded Box Helper

**File**: `src/utils/roundedBox.ts` (new file)
**Changes**: Create a reusable rounded box mesh factory using Three.js `ExtrudeGeometry` or `BoxGeometry` with custom buffer manipulation.

The simplest approach for a clean rounded box is to use Three.js's `RoundedBoxGeometry` from three/examples, or create one with `ExtrudeGeometry`:

```typescript
import * as THREE from "three";

/**
 * Create a box mesh with rounded vertical edges using ExtrudeGeometry.
 * The shape is a rounded rectangle extruded along the Z axis.
 */
export function createRoundedBox(
  width: number,
  height: number,
  depth: number,
  radius: number,
): THREE.Mesh {
  const shape = new THREE.Shape();
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);

  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: depth,
    bevelEnabled: true,
    bevelThickness: r * 0.5,
    bevelSize: r * 0.3,
    bevelSegments: 4,
    curveSegments: 8,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Center the geometry (extrude goes from 0 to depth, we want -depth/2 to depth/2)
  geometry.translate(0, 0, -depth / 2);

  return new THREE.Mesh(geometry);
}
```

#### 3. Front Panel Z-Position Adjustments

**File**: `src/objects/machine/CoinSlot.ts`
**Changes**: Adjust Z positions since body front face is now at `z ≈ 1.2` instead of `z ≈ 1.55` (cylinder surface).

```typescript
// Slot plate
slotPlate.position.set(0, 2.2, 1.3); // was (0, 2.2, 1.62)

// Coin slot opening
slot.position.set(0, 2.2, 1.36); // was (0, 2.2, 1.68)
```

#### 4. Exit Chute Position

**File**: `src/objects/machine/ExitChute.ts`
**Changes**: Adjust Z to align with new box front face.

```typescript
// Chute body
chute.position.set(0, 0.75, 1.7); // was (0, 0.75, 2.0)

// Chute opening
opening.position.set(0, 0.8, 2.22); // was (0, 0.8, 2.52)

// Chute trim
chuteTrim.position.set(0, 0.8, 2.24); // was (0, 0.8, 2.54)
```

#### 5. Handle Position

**File**: `src/objects/machine/Handle.ts`
**Changes**: Adjust Z to protrude from box front face.

```typescript
// Stem — protrudes from front face
handleStem.position.set(0, 1.7, 1.55); // was (0, 1.7, 1.85)

// Arm
handleArm.position.set(0, 1.25, 1.8); // was (0, 1.25, 2.1)

// Ball
handleBall.position.set(0, 0.78, 1.8); // was (0, 0.78, 2.1)
```

#### 6. Label Position

**File**: `src/objects/machine/Label.ts`
**Changes**: Adjust Z to sit on new front panel.

```typescript
stickerMesh.position.set(0, 2.9, 1.27); // was (0, 2.9, 1.57)
```

#### 7. Decorations — Star Positions + Side Panel Width

**File**: `src/objects/machine/Decorations.ts`
**Changes**: Adjust star Z positions for new front face, and widen side panels to match box width.

```typescript
// Stars — adjusted Z to match new front face
const starPositions: [number, number, number][] = [
  [-1.0, 1.5, 1.0], // was (-1.1, 1.5, 1.3)
  [1.0, 1.5, 1.0], // was (1.1, 1.5, 1.3)
  [-0.7, 2.7, 1.15], // was (-0.8, 2.7, 1.45)
  [0.7, 2.7, 1.15], // was (0.8, 2.7, 1.45)
  [0, 3.2, 1.2], // was (0, 3.2, 1.5)
];

// Side panels — now flush with box sides at x = ±1.5 (half of 3.0 width)
sidePanel.position.set(side * 1.55, 2.1, 0); // was (side * 1.55, 2.1, 0.3)
```

### Success Criteria:

#### Automated Verification:

- [x] TypeScript compiles: `npx tsc --noEmit`
- [x] Build succeeds: `npm run build`
- [x] Tests pass: `npm test`
- [x] Lint passes: `npx vp lint`

#### Manual Verification:

- [x] Machine body is visibly rectangular (not cylindrical)
- [x] Body has slightly rounded edges (not sharp box)
- [x] Front panel, coin slot, handle, chute all sit correctly on the front face
- [x] Label is visible and properly positioned
- [x] No floating/clipping geometry

**Implementation Note**: After completing this phase, pause for manual confirmation. The exact Z offsets may need fine-tuning based on visual inspection.

---

## Phase 3: Reshape Base and Feet

### Overview

Change the base from a cylindrical disc to a rectangular platform matching the body width, and reposition feet to the 4 corners of the rectangle.

### Changes Required:

#### 1. Base — Cylinder to Rounded Box

**File**: `src/objects/machine/Base.ts`
**Changes**: Replace `CylinderGeometry` with a box platform, adjust feet to rectangular corners.

```typescript
import * as THREE from "three";
import { MACHINE_COLORS } from "@/config";
import { createTrimMaterial } from "@/objects/machine/materials";

export function createBase(group: THREE.Group): void {
  // Feet (4 stubby legs at box corners)
  const footMat = new THREE.MeshStandardMaterial({
    color: MACHINE_COLORS.foot,
    metalness: 0.4,
    roughness: 0.6,
  });
  const footPositions: [number, number][] = [
    [-1.3, -1.0], // front-left (x, z)
    [1.3, -1.0], // front-right
    [-1.3, 1.0], // back-left
    [1.3, 1.0], // back-right
  ];
  footPositions.forEach(([x, z]) => {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.3, 8), footMat);
    foot.position.set(x, 0.15, z);
    foot.castShadow = true;
    group.add(foot);
  });

  // Base platform — rectangular
  const baseMat = new THREE.MeshStandardMaterial({
    color: MACHINE_COLORS.base,
    metalness: 0.15,
    roughness: 0.7,
  });
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.5, 2.6), baseMat);
  base.position.y = 0.55;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Base trim — horizontal strip around the top edge of the base
  const trimMat = createTrimMaterial();
  const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.08, 2.7), trimMat);
  baseTrim.position.y = 0.8;
  group.add(baseTrim);
}
```

### Success Criteria:

#### Automated Verification:

- [x] TypeScript compiles: `npx tsc --noEmit`
- [x] Build succeeds: `npm run build`
- [x] Tests pass: `npm test`

#### Manual Verification:

- [x] Base is rectangular, matching body width
- [x] Feet are at the 4 corners, not in a circular pattern
- [x] Base trim strip sits cleanly between base and body
- [x] Machine looks stable and grounded

**Implementation Note**: After completing this phase, pause for manual confirmation.

---

## Phase 4: Dome, Top Cap, and Animation Adjustments

### Overview

Adjust the dome to sit naturally on the rectangular body. Update the top cap proportions. Fix all animation Y/Z positions that reference the old geometry. Adjust camera if needed.

### Changes Required:

#### 1. Dome — Adjust Width and Position

**File**: `src/objects/machine/Dome.ts`
**Changes**: The dome sphere should sit centered on the box body. The dome radius should match the body width (~1.5 to fill a 3.0 wide body). Keep the partial sphere shape but remove the Y-scale stretch to be more authentically spherical.

```typescript
export function createDome(group: THREE.Group): THREE.Mesh {
  // Glass sphere — radius matches half body width
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
  dome.scale.y = 1.15; // slight vertical stretch, less than before (was 1.2)
  group.add(dome);

  // Dome border ring — slightly larger than dome radius
  const trimMat = createTrimMaterial();
  const domeBorder = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.07, 12, 48), trimMat);
  domeBorder.rotation.x = Math.PI / 2;
  domeBorder.position.y = 3.6;
  group.add(domeBorder);

  return dome;
}
```

#### 2. Top Cap — Match New Dome

**File**: `src/objects/machine/TopCap.ts`
**Changes**: Adjust cap to sit on top of the slightly smaller dome. Keep proportions similar.

```typescript
// Cap — slightly adjusted for new dome size
const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.9, 0.65, 32), capMat);
cap.position.y = 5.35; // was 5.5 — adjusted for less Y-stretched dome

// Golden knob
knob.position.y = 5.8; // was 5.95

// Cap trim
capTrim.position.y = 5.05; // was 5.15
```

#### 3. Animation Positions — Entry Animation

**File**: `src/animations/EntryAnimation.ts`
**Changes**: Capsule fly-in positions need adjustment for the new dome interior space.

Key values to update:

```typescript
// Fly to lineup — z adjusted for new body depth
capsule.group.position: {
  x: -1.8 + i * 1.2,  // unchanged — still fits within 3.0 width
  y: 2.5,              // unchanged
  z: 3.0,              // was 3.5 — closer since body is shallower
}

// Fly into dome — same dome interior
capsule.group.position: {
  x: (Math.random() - 0.5) * 1.0,  // was 1.2 — slightly tighter for 1.5r dome
  y: 4 + Math.random() * 0.6,       // was 0.8 — dome top is slightly lower
  z: (Math.random() - 0.5) * 0.6,   // was 0.8 — shallower
}

// Bounce settle
capsule.group.position.y: 3.8 + Math.random() * 0.5  // was 0.6
```

#### 4. Animation Positions — Spin Animation

**File**: `src/animations/SpinAnimation.ts`
**Changes**: Capsule shuffle bounds during spin.

```typescript
// Capsule shuffle positions
capsule.group.position: {
  x: (Math.random() - 0.5) * 1.6,   // was 1.8 — tighter for box body
  y: 3.5 + Math.random() * 1.2,      // was 1.5 — dome top is slightly lower
  z: (Math.random() - 0.5) * 1.0,    // was 1.2 — shallower depth
}
```

#### 5. Animation Positions — Reveal Animation

**File**: `src/animations/RevealAnimation.ts`
**Changes**: Winner path to chute adjusted for new chute Z.

```typescript
// Winner to chute
w.group.position: { x: 0, y: 1.5, z: 1.9 }  // was z: 2.2

// Pop forward
w.group.position: { x: 0, y: 2.5, z: 3.5 }  // was z: 4
```

#### 6. Experience.ts — Idle Capsule Orbit and Ready State

**File**: `src/Experience.ts`
**Changes**: Idle orbit radius and ready-state capsule bounce heights.

```typescript
// Idle state capsules — orbit radius slightly smaller
c.group.position.x = Math.cos(a) * 2.0; // was 2.2
c.group.position.z = Math.sin(a) * 2.0; // was 2.2

// Ready state — capsule bob
c.group.position.y = 3.8 + Math.sin(elapsed * 1.8 + i * 1.3) * 0.08; // was 0.1
```

#### 7. Camera — Minor Adjustment

**File**: `src/Experience.ts`
**Changes**: Camera might need a slight pull-back since the box body is slightly wider.

```typescript
// Only if the machine looks too close:
this.camera.position.set(0, 3.5, 9.5); // was z: 9
```

### Success Criteria:

#### Automated Verification:

- [x] TypeScript compiles: `npx tsc --noEmit`
- [x] Build succeeds: `npm run build`
- [x] All tests pass: `npm test`
- [x] Lint passes: `npx vp lint`

#### Manual Verification:

- [x] Dome sits cleanly on the rectangular body — no gaps or overlap
- [x] Top cap and knob are properly positioned on dome apex
- [x] **Entry animation**: capsules fly in and settle inside the dome correctly
- [x] **Spin animation**: capsules shuffle within dome bounds, no clipping through body
- [x] **Reveal animation**: winner capsule drops to chute area and pops forward correctly
- [x] **Idle state**: capsules orbit smoothly around the machine
- [x] **Reset**: everything returns to correct positions
- [x] Camera framing looks good — full machine visible with some breathing room
- [x] The machine is instantly recognizable as a gashapon machine

**Implementation Note**: This is the most sensitive phase — animation positions are tuned by feel. Expect 2-3 rounds of tweaking after initial implementation.

---

## Testing Strategy

### Unit Tests:

- Existing tests should pass unchanged (they test config parsing, not geometry)
- No new unit tests needed for geometry changes (visual only)

### Build Verification:

- `npm run build` — ensures all imports resolve and TypeScript compiles
- `npm test` — ensures no regressions in game logic

### Manual Testing Steps:

1. Load the page — machine should appear as a gold rectangular box with dome
2. Click "EDIT PESERTA" — editor opens, colors are consistent
3. Click "MASUKKAN KAPSUL" — capsules fly into dome correctly
4. Click "PUTAR!" — handle spins, capsules shuffle inside dome
5. Watch reveal — winner drops to chute, pops forward, sparkles play
6. Click "ULANGI" — everything resets cleanly
7. Resize window — machine remains properly framed

## Performance Considerations

- `ExtrudeGeometry` for rounded box creates more triangles than `BoxGeometry` — this is negligible for a single mesh
- All other geometries remain the same — no performance impact
- No new textures or shader changes

## File Change Summary

| File                                 | Change Type                            | Phase |
| ------------------------------------ | -------------------------------------- | ----- |
| `src/config.ts`                      | Edit (color values)                    | 1     |
| `style.css`                          | Edit (button gradients, body bg)       | 1     |
| `src/objects/Environment.ts`         | Edit (ground ring color)               | 1     |
| `src/objects/machine/Body.ts`        | Rewrite (cylinder → rounded box)       | 2     |
| `src/utils/roundedBox.ts`            | **New file**                           | 2     |
| `src/objects/machine/CoinSlot.ts`    | Edit (Z positions)                     | 2     |
| `src/objects/machine/ExitChute.ts`   | Edit (Z positions)                     | 2     |
| `src/objects/machine/Handle.ts`      | Edit (Z positions)                     | 2     |
| `src/objects/machine/Label.ts`       | Edit (Z position)                      | 2     |
| `src/objects/machine/Decorations.ts` | Edit (positions)                       | 2     |
| `src/objects/machine/Base.ts`        | Rewrite (cylinder → box, feet corners) | 3     |
| `src/objects/machine/Dome.ts`        | Edit (radius, scale)                   | 4     |
| `src/objects/machine/TopCap.ts`      | Edit (positions)                       | 4     |
| `src/animations/EntryAnimation.ts`   | Edit (position values)                 | 4     |
| `src/animations/SpinAnimation.ts`    | Edit (position bounds)                 | 4     |
| `src/animations/RevealAnimation.ts`  | Edit (position values)                 | 4     |
| `src/Experience.ts`                  | Edit (idle orbit, camera)              | 4     |

## References

- Gashapon machine anatomy research (from discussion above)
- Three.js ExtrudeGeometry: https://threejs.org/docs/#api/en/geometries/ExtrudeGeometry
- Bandai Capsule Station proportions: 315mm H x 140mm W (~2.25:1 ratio)
- mam-mam.net Three.js gacha example (reference implementation)
