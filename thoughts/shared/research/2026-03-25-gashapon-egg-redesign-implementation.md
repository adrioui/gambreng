---
date: 2026-03-25T13:15:00+07:00
researcher: claude
git_commit: a94e72bb5642af6e444f51ff572d8ee641c69336
branch: main
repository: gambreng
topic: "Gashapon Egg-Based Redesign - Full Codebase Analysis & Implementation Research"
tags:
  [
    research,
    codebase,
    three-js,
    gsap,
    egg,
    gashapon,
    gacha,
    animation,
    lathe-geometry,
    raycasting,
    fracturing,
  ]
status: complete
last_updated: 2026-03-25
last_updated_by: claude
---

# Research: Gashapon Egg-Based Redesign — Implementation Guide

**Date**: 2026-03-25T13:15:00+07:00
**Researcher**: claude
**Git Commit**: a94e72bb5642af6e444f51ff572d8ee641c69336
**Branch**: main
**Repository**: gambreng

## Research Question

How should the current gashapon machine codebase be restructured to support egg-based gacha with LatheGeometry eggs, pre-fractured hatch animation, clickable 3D crank handle, tilted elliptical orbit, and 7-beat animation flow?

## Summary

The current codebase is well-structured for the redesign. The architecture — standalone `create*()` functions for machine parts, class-based objects (Capsule), GSAP-timeline animations with `onComplete` callbacks, and an enum-based state machine — maps cleanly onto the new design. No architectural overhaul is needed; each component can be replaced in-place.

Key technical decisions:

1. **Egg geometry**: LatheGeometry with `r(t) = (apex * cos(t) + girth) * sin(t)` profile, split into top/bottom halves at construction time
2. **Fracturing**: Start simple (pre-built halves), upgrade to `three-pinata` Voronoi if more dramatic shatter is needed
3. **Handle raycasting**: Layer-based filtering (`layers.enable(1)`) on handle mesh, canvas click listener with NDC normalization
4. **Orbit**: Nested `Object3D` pivot technique — tilt the pivot's Z rotation, rotate Y per frame
5. **State machine**: Add `Triggered`, `BuildingUp`, `Capturing`, `Dispensing`, `Hatching` states to existing enum

## Detailed Findings

### Current Architecture (What Exists)

#### Machine Parts (`src/objects/machine/*.ts`)

Each part is a standalone `create*()` function that takes `group: THREE.Group` and adds meshes to it.

| File             | Geometries                                                     | Returns                | Notes                                        |
| ---------------- | -------------------------------------------------------------- | ---------------------- | -------------------------------------------- |
| `Base.ts`        | CylinderGeometry (feet), BoxGeometry (platform, trim)          | void                   | 4 tapered feet + box platform                |
| `Body.ts`        | ExtrudeGeometry via `roundedBox()`, BoxGeometry (panel, trims) | void                   | Rounded box body, teal front panel           |
| `Dome.ts`        | SphereGeometry (partial), TorusGeometry (ring)                 | `THREE.Mesh`           | Opacity 0.18, clearcoat, scale.y=1.15        |
| `TopCap.ts`      | CylinderGeometry, SphereGeometry, TorusGeometry                | void                   | Tapered cap + gold knob                      |
| `CoinSlot.ts`    | BoxGeometry ×2                                                 | void                   | **Delete** — no coins in digital version     |
| `ExitChute.ts`   | BoxGeometry ×3                                                 | void                   | **Rewrite** → nest tray (LatheGeometry bowl) |
| `Handle.ts`      | CylinderGeometry, BoxGeometry, SphereGeometry                  | `THREE.Group`          | **Rewrite** — add raycasting, side-mount     |
| `Label.ts`       | PlaneGeometry + TextureLoader                                  | void                   | Logo sticker with canvas fallback            |
| `Decorations.ts` | OctahedronGeometry, BoxGeometry                                | void                   | Star studs + side panels                     |
| `materials.ts`   | —                                                              | `MeshStandardMaterial` | Shared trim material factory                 |

**Key insight**: Only `Dome.ts` and `Handle.ts` return their created objects (needed by `Experience.ts` for animation targets). The new design will need `ExitChute.ts` to also return its mesh (nest tray for egg landing).

#### Capsule Object (`src/objects/Capsule.ts`)

- Two `SphereGeometry` hemispheres (top colored, bottom white) + torus band + canvas label + glow ring
- Radius: 0.38, positioned at `(-2 + index * 1.3, 6, 0)` initially
- `userData = { index, color }` — used for winner identification

#### State Machine (`src/state/GameState.ts`)

```
Current: Idle → Entering → Ready → Spinning → Revealing → Done → Idle
New:     Idle → Triggered → BuildingUp → Capturing → Dispensing → Hatching → Done → Idle
```

- Uses `EventEmitter` base class
- `VALID_TRANSITIONS` record enforces allowed transitions
- `reset()` bypasses transition validation (direct to Idle)

#### Animation Flow (`src/animations/*.ts`)

All animations are standalone functions returning GSAP timelines:

- `playEntryAnimation(capsules, camera, onComplete)` — lineup + fly into dome (replaces with orbit start)
- `playSpinAnimation(machine, handle, capsules, onComplete)` — handle crank + shuffle + winner pick (replaces with build-up + capture)
- `playRevealAnimation(capsules, winnerIndex, camera, onSparkle, onComplete)` — losers drop + winner pops (replaces with dispense + hatch)

#### Experience.ts Update Loop

```typescript
// Idle: machine bobs, capsules orbit (circular, flat plane)
// Ready: machine bobs gently, capsules float in dome
// Done: winner bobs and rotates
```

The update loop is state-driven with `gameState.is()` checks. New states will add new branches here.

#### UI (`src/ui/UIManager.ts`)

DOM-based with 4 buttons: edit, start, handle, reset. The handle button (`#handle-btn`) will be **removed** in favor of 3D raycasting on the handle mesh.

### Egg Geometry — LatheGeometry Approach

**Source**: [PROWARE Technologies — Three.js Egg Geometry](https://www.prowaretech.com/articles/current/javascript/three-js/egg-geometry)

The canonical egg profile formula:

```typescript
const girth = 0.719;
const apex = girth * 0.111111111;
const points: THREE.Vector2[] = [];
for (let rad = 0; rad <= Math.PI; rad += Math.PI / 30) {
  // 31 points
  points.push(new THREE.Vector2((apex * Math.cos(rad) + girth) * Math.sin(rad), -Math.cos(rad)));
}
const eggGeo = new THREE.LatheGeometry(points, 32);
```

**Pre-split for hatch animation**: Store `points[0..15]` as top-half and `points[15..30]` as bottom-half. Create two separate `LatheGeometry` instances at construction time, keep the "cracked" halves hidden until hatch phase.

**Alternative egg profile** (from handoff research): `r(t) = a * sin(t) * (1 + k * cos(t))` where k=0.15 for chicken egg shape. Either formula works; the PROWARE one is more tested in Three.js.

**Reference**: [Three.js Forum — Easter Egg](https://discourse.threejs.org/t/easter-egg-generative-painting/63440), [CodePen — prisoner849](https://codepen.io/prisoner849/full/WNWZdLV)

### Mesh Fracturing Options

**Option A — Simple pre-split (no packages)**
Build two LatheGeometry halves at construction time. At hatch: tween top half up+rotate, bottom stays as bowl. Simplest approach, zero dependencies.

**Option B — three-pinata Voronoi fracturing**

```bash
npm install @dgreenheck/three-pinata
```

```typescript
import { DestructibleMesh, FractureOptions } from "@dgreenheck/three-pinata";
const egg = new DestructibleMesh(eggGeo, outerMat, innerMat);
const fragments = egg.fracture({
  fractureMethod: "voronoi",
  fragmentCount: 8,
  voronoiOptions: { mode: "2.5D", impactPoint: new THREE.Vector3(0, 0.3, 0) },
});
```

Pre-fracture at load time, hide fragments until hatch moment. 2.5D mode is fast for shell-like shapes.

**Source**: [three-pinata GitHub](https://github.com/dgreenheck/three-pinata)

**Option C — three-bvh-csg plane slicing**

```bash
npm install three-bvh-csg
```

CSG SUBTRACTION with a cutting plane. Mathematically exact halves. Good for a clean equatorial split.

**Source**: [three-bvh-csg GitHub](https://github.com/gkjohnson/three-bvh-csg)

**Recommendation**: Start with Option A (zero complexity). If it looks too simple, upgrade to Option B for 6-8 piece dramatic shatter.

### Raycasting for Clickable Handle

**Coordinate normalization** (critical):

```typescript
const mouse = new THREE.Vector2();
canvas.addEventListener("click", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(machine.handle.children, true);
  if (hits.length > 0 && gameState.is(GameStateType.Ready)) spinGacha();
});
```

**Layer filtering** for performance/correctness:

```typescript
// Handle.ts — mark handle mesh as interactive
handleMesh.layers.enable(1);
// Experience.ts — raycaster only tests interactive layer
raycaster.layers.set(1);
```

This prevents dome glass, decorations, and labels from intercepting handle clicks.

**Source**: [Ryan Schiang — Three.js Raycasting](https://ryanschiang.com/threejs-clickable-vertices-tutorial), [Three.js Forum — Layers for Raycasting](https://discourse.threejs.org/t/using-layers-to-optimize-application-performance-with-raycaster/55822)

### Tilted Elliptical Orbit

**Nested Object3D pivot technique**:

```typescript
const orbitPivot = new THREE.Object3D();
scene.add(orbitPivot);
orbitPivot.rotation.z = Math.PI * 0.3; // tilt ~54°

const egg = new Egg(participant, index);
orbitPivot.add(egg.group);
egg.group.position.x = 2.0; // orbit radius

// In update loop:
orbitPivot.rotation.y += 0.01 * delta; // orbital speed
egg.group.rotation.y += 0.02 * delta; // self-spin
```

**Elliptical orbit** (non-circular): set `egg.group.position.x = 2.0` (semi-major) and `egg.group.position.z = 0.8` (semi-minor) for an ellipse. The pivot rotation handles the tilt automatically.

**Source**: [Wael Yasmina — Object Rotation](https://waelyasmina.net/articles/how-to-make-an-object-rotate-around-another-object-in-three-js/)

Current codebase uses manual `Math.cos/sin` in `Experience.ts:91-98` for flat circular orbit. The nested pivot approach replaces ~8 lines of trigonometry with 3 lines of group hierarchy.

### Egg Hatch Animation — Progressive Shake + Burst

**Pokemon GO-style progressive shake**:

```typescript
let shakeSpeed = 2;
const shakeEgg = (elapsed: number) => {
  if (shakeSpeed < 50) shakeSpeed += 0.05;
  egg.group.rotation.z = Math.sin(shakeSpeed * elapsed) * 0.15;
};
```

**Crack timing** (from handoff research):

- Phase 1: Impact (67ms) — first crack line appears
- Phase 2: Propagation (133ms) — cracks spread
- Phase 3: Break + settle (467ms) — pieces fly apart
- Total: 600-800ms

**GSAP particle burst** (efficient buffer approach):

```typescript
gsap.fromTo(
  particleGeo.attributes.position.array,
  { endArray: compactPositions },
  {
    endArray: burstPositions,
    duration: 0.8,
    ease: "power3.out",
    onUpdate: () => {
      particleGeo.attributes.position.needsUpdate = true;
    },
  },
);
```

**Source**: [Observable — Animating Particles with GSAP](https://observablehq.com/@deaxmachina/animating-lots-of-three-js-particles-with-gsap)

### Ghost Trail Effect

**Manual clone approach** (recommended for simplicity):

```typescript
const TRAIL_COUNT = 8;
const clones = Array.from({ length: TRAIL_COUNT }, (_, i) => {
  const clone = egg.group.clone();
  clone.material = clone.material.clone();
  clone.material.transparent = true;
  clone.material.opacity = 0.6 * (1 - i / TRAIL_COUNT);
  scene.add(clone);
  return clone;
});
// In update: shift positions down the clone array, newest at [0]
```

**Alternative**: Ping-pong framebuffer afterimage (more complex, smoother). See [Codrops — Typography Motion Trail](https://tympanus.net/codrops/2021/07/21/creating-a-typography-motion-trail-effect-with-three-js/).

### Camera Choreography

Current camera: `position.set(0, 3.0, 12)`, `lookAt(0, 2.5, 0)`, FOV 40.

**Per-state camera plan**:
| State | Camera Position | Notes |
|-------|----------------|-------|
| Idle | (0, 3.0, 12) | Establishing wide shot |
| Triggered | (0, 3.0, 11) | Slight zoom on handle crank |
| BuildingUp | (0, 3.5, 10) | Rise slightly, track orbit acceleration |
| Capturing | (1, 4.0, 8) | Swoop toward dome as egg enters |
| Dispensing | (0, 2.0, 9) | Drop with egg to nest tray level |
| Hatching | (0, 2.5, 7) | Intimate push for crack reveal |
| Done | (0, 3.0, 10) | Pull back for celebration |

**Important**: Add `onUpdate: () => camera.lookAt(target)` to all camera GSAP tweens to maintain gaze.

## Code References

- `src/Experience.ts:87-113` — Update loop with state-driven branches
- `src/Experience.ts:59-63` — Capsule creation from participants
- `src/Experience.ts:91-98` — Current flat circular orbit (replace with tilted pivot)
- `src/objects/Capsule.ts:12-35` — SphereGeometry hemispheres (replace with LatheGeometry egg)
- `src/objects/Machine.ts:17-29` — Machine assembly (add nest tray return, remove CoinSlot)
- `src/objects/machine/Handle.ts:1-27` — Handle group (add raycasting layer)
- `src/objects/machine/Dome.ts:8-16` — Dome geometry (increase radius, opacity)
- `src/objects/machine/ExitChute.ts:1-22` — Box chute (replace with LatheGeometry bowl)
- `src/state/GameState.ts:4-11` — VALID_TRANSITIONS map (add new states)
- `src/types/index.ts:7-14` — GameStateType enum (add Triggered, BuildingUp, Capturing, Dispensing, Hatching)
- `src/animations/SpinAnimation.ts:57-64` — Winner selection via setTimeout (replace with animation-driven state transitions)
- `src/ui/UIManager.ts:155-165` — showHandleButton/disableHandleButton (remove, replace with raycasting)

## Architecture Insights

1. **Clean separation** — Each machine part is a standalone function, making it safe to rewrite one at a time without breaking others
2. **Animation callback pattern** — All animations use `onComplete` callbacks, mapping perfectly to state transitions
3. **GSAP is the animation backbone** — No custom interpolation anywhere; everything goes through GSAP timelines. Keep this pattern for the redesign
4. **DOM UI is thin** — UIManager is mostly show/hide with GSAP entry/exit animations. The handle button removal is the only breaking change
5. **No physics engine** — Simple Euler integration (gravity + damping) is sufficient for egg piece trajectories. No need for cannon-es or ammo.js
6. **Fixed delta (1/60)** — Loop.ts uses a fixed timestep, meaning animations are frame-rate dependent. GSAP handles its own timing internally, so this only affects the `update()` loop math

## Visual Inspiration Links

### Machine Design

- [Sketchfab — Classic Bandai Capsule Station Type 1](https://sketchfab.com/3d-models/capsule-station-type-1-cc4b789795324b9d9a16c2a2a347baae) — Iconic yellow Bandai silhouette
- [Sketchfab — Gachapon Egg Capsule Machine (CGMA)](https://sketchfab.com/3d-models/gachapon-egg-capsule-machine-c33ffebbac7b4192b21f75e3e6f8bbcf) — Stylized game-ready, closest to our target
- [Sketchfab — Gashapon Japanese Toy Vending Machine](https://sketchfab.com/3d-models/gashapon-japanese-toy-vending-machine-4cb0fd802fda43578cfc96776e4e3795) — High-detail Bandai reference
- [ArtStation — Raccoon-themed Gachapon](https://www.artstation.com/artwork/rJWy06)
- [ArtStation — Neo Tokyo Gacha Machine](https://www.artstation.com/artwork/kQXEWn)
- [ArtStation — Potionomics Gachapon Concepts](https://www.artstation.com/artwork/lVZA8e)

### Animation & Interaction

- [CodePen — Gacha Machine with GSAP](https://codepen.io/wheatup/pen/BawKVYe) — Turn knob + capsule drop
- [CodePen — Three.js LatheGeometry Egg](https://codepen.io/prisoner849/full/WNWZdLV) — Exact technique for egg meshes
- [Observable — Animating Particles with GSAP](https://observablehq.com/@deaxmachina/animating-lots-of-three-js-particles-with-gsap) — Buffer array particle burst

### Tutorials & Docs

- [PROWARE — Three.js Egg Geometry](https://www.prowaretech.com/articles/current/javascript/three-js/egg-geometry) — LatheGeometry egg formula
- [Wael Yasmina — Object Rotation](https://waelyasmina.net/articles/how-to-make-an-object-rotate-around-another-object-in-three-js/) — Nested pivot orbit
- [Ryan Schiang — Three.js Raycasting](https://ryanschiang.com/threejs-clickable-vertices-tutorial) — Clickable 3D objects
- [GSAP Timeline Docs](https://gsap.com/docs/v3/GSAP/Timeline/) — Position parameter choreography

## Open Questions

1. **Egg fracturing complexity** — Should we start with simple 2-piece split or go straight to Voronoi? Depends on visual expectations.
2. **Ghost trail implementation** — Manual clone array (simpler, 8 clones) vs ping-pong framebuffer (smoother, more GPU overhead)?
3. **Handle click UX** — Keep DOM handle button as mobile fallback alongside 3D raycasting? Or pure 3D only?
4. **Interior dome light** — Add a PointLight inside the dome during BuildUp/Capture phases? Research suggests this "glowing capsules" effect is a key gashapon visual.
5. **Package additions** — `three-pinata` for Voronoi fracturing is optional. `three-bvh-csg` for CSG slicing is optional. Both are zero-config. Prefer no new packages if simple split looks good enough.
