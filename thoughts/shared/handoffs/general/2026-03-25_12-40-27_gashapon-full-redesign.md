---
date: 2026-03-25T12:40:27+07:00
researcher: claude
git_commit: a94e72bb5642af6e444f51ff572d8ee641c69336
branch: main
repository: gambreng
topic: "Gashapon Machine Full Redesign - Egg-Based Gacha with Hatch Animation"
tags: [implementation, redesign, three-js, animation, gashapon, egg, gacha]
status: complete
last_updated: 2026-03-25
last_updated_by: claude
type: implementation_strategy
---

# Handoff: Gashapon Machine Full Redesign

## Task(s)

**Status: Planning phase - research complete, implementation plan not yet written**

The user wants a complete redesign of the Gambreng gashapon machine. This is a vanilla Three.js + GSAP + TypeScript project (no React). The current machine uses capsules (split spheres) with a boxy body. The redesign transforms it into an egg-based gacha with a 7-beat animation flow, new machine silhouette, and egg hatching reveal.

### Key design decisions (confirmed by user):

1. **Eggs via LatheGeometry** instead of capsule spheres
2. **Tilted elliptical orbit** for idle state (4 eggs orbiting the machine)
3. **Clickable 3D crank handle** (raycasting) replaces the UI "handle" button
4. **Full machine body redesign** - rounder, more toy-like, cylindrical, bigger dome, nest tray
5. **Pre-fractured mesh pieces** for egg crack/hatch animation
6. **One-pass build** - plan everything, then implement all at once

### New 7-beat animation flow:

```
IDLE       -> eggs orbit machine in tilted ellipse, pastel colors, no text
TRIGGER    -> user clicks 3D handle, machine wobbles
BUILD-UP   -> orbit accelerates ~2s, ghost trails, one egg glows gold
CAPTURE    -> glowing egg breaks orbit, flies into dome, others scatter/fade
DISPENSE   -> machine shakes, egg drops to nest tray, bounces
HATCH      -> egg cracks (pre-fractured pieces fly apart), theme text rises, particles
RESET      -> egg disappears, others drift back into orbit
```

### New state machine:

```
Idle -> Triggered -> BuildingUp -> Capturing -> Dispensing -> Hatching -> Done -> Idle
```

## Critical References

- User's full design vision document was provided in conversation (includes physical gashapon mechanics research, emotional loop analysis, design anatomy table, digital gacha patterns, and the confirmed 7-beat flow blueprint)
- Current codebase entry: `src/Experience.ts` (main orchestrator)
- Current machine assembly: `src/objects/Machine.ts` and `src/objects/machine/*.ts`

## Recent changes

No code changes were made - this session was entirely research and planning.

## Learnings

### Research findings from 4 subagents (all completed):

**1. Physical Gashapon Machine Design (agent ad6ed4ed4b9b0625b)**

- Classic dome-to-body proportion: dome should be ~40-45% of total height (current dome is too small)
- Real machines are fundamentally cylindrical, not boxy
- Dome opacity should be 0.35-0.45 (current 0.18 is nearly invisible)
- A cylindrical collar between dome and body is a key visual signifier
- Handle should be at mid-body height on the side, not at the bottom
- Interior PointLight inside dome creates the classic "glowing capsules" look
- Type A (classic round) silhouette is the target: cylinder body, big bubble dome, round everywhere

**2. Digital Gacha UI Animation Patterns (agent a3d313ab76a475166)**

- 5 universal beats: Transition -> Signal -> Hesitation/Branch -> Reveal -> Celebration
- Genshin: shooting star + color-coded impact. 5-star gets full scene change + golden sky + silhouette delay
- ZZZ: TV metaphor, container "breaks" for S-rank (breaking containment = powerful)
- Project Sekai: card flip with hesitation at 90 degrees (0.5-0.8s hold = peak anticipation)
- Pokemon GO eggs: 3-stage crack (single crack -> radial cracks -> burst), then 0.5s black frame before reveal
- Key insight: speed itself communicates rarity (common = fast resolve, rare = slow + dramatic)
- Color language: blue=common, purple=mid, gold=high, white flash=transcendent

**3. 3D Egg Crack/Hatch Techniques (agent a50c95cfaf5dd7864)**

- Egg profile formula: `r(t) = a * sin(t) * (1 + k * cos(t))` where k=0.15 for chicken egg shape
- LatheGeometry with 32 profile points and 64 lathe segments for smooth normals
- Pre-fracturing: 6-12 pieces is sweet spot. Top cap lifts first, sides tumble outward, bottom stays as bowl
- Recommended approach: pre-model fragments in Blender OR runtime procedural with noise-displaced cut planes
- Shell thickness: two nested LatheGeometry (outer + inner at 93% radius) for visible edge on crack
- Crack timing: Phase 1 (impact, 67ms) -> Phase 2 (propagation, 133ms) -> Phase 3 (break+settle, 467ms)
- Total crack-to-settled: 600-800ms
- Light from inside the egg at crack moment sells "something was alive in there"

**4. Orbit & Motion Design (agent a7bfa11ebe0e344fd)**

- Tilted orbit: nested Group technique (tilt the plane, not the objects). Best angle: 45-65 degrees
- Speed ramping: 3-phase model (wind-up power3.in -> full speed linear -> landing expo.out + micro-bounce)
- Ghost trails: manual clone array (8 clones, decreasing opacity) OR AfterimagePass postprocessing
- Golden selection: emissive pulse (emissiveIntensity 0->2.5->0.8 yoyo), gold particle trail
- Camera choreography: establishing wide -> swoop in -> intimate push -> pedestal reveal
- Squash & stretch for egg landing: volume-conserving (squash Y=0.6, X/Z=1.3)
- Bounce sequence: impact squash (70ms) -> first bounce (180ms) -> second bounce (120ms) -> settle (200ms)

### Current codebase architecture:

- Machine is a THREE.Group with 9 sub-components added in `Machine.ts` constructor
- Each machine part is a standalone `create*()` function returning void (adds to group)
- Capsule is a class with `group` property, `addToScene()` method
- Animations are standalone functions taking objects + callbacks, returning GSAP timelines
- State machine uses EventEmitter with valid transition map
- UI is DOM-based (getElementById), not 3D

## Artifacts

Research agent outputs (JSON format, machine-readable):

- `/private/tmp/claude-501/-Users-adrifadilah-Learn-gambreng/tasks/ad6ed4ed4b9b0625b.output` - Physical machine design research
- `/private/tmp/claude-501/-Users-adrifadilah-Learn-gambreng/tasks/a3d313ab76a475166.output` - Digital gacha animation research
- `/private/tmp/claude-501/-Users-adrifadilah-Learn-gambreng/tasks/a50c95cfaf5dd7864.output` - Egg crack/hatch techniques research
- `/private/tmp/claude-501/-Users-adrifadilah-Learn-gambreng/tasks/a7bfa11ebe0e344fd.output` - Orbit & motion design research

Plan file location (not yet created): `/Users/adrifadilah/.claude/plans/velvet-yawning-bumblebee.md`

## Action Items & Next Steps

1. **Write the full implementation plan** at `/Users/adrifadilah/.claude/plans/velvet-yawning-bumblebee.md` incorporating all research findings above. The plan should cover file-by-file changes in implementation order.

2. **Implementation order (recommended)**:
   - Phase 1: Foundation changes
     - Update `types/index.ts` with new GameStateType enum (7 states)
     - Update `state/GameState.ts` with new valid transitions
     - Update `config.ts` MACHINE_COLORS for cylindrical design
   - Phase 2: Egg object
     - Create `src/objects/Egg.ts` replacing `Capsule.ts` (LatheGeometry egg + pre-fractured version)
     - Egg profile: `r(t) = a * sin(t) * (1 + k * cos(t))`, k=0.15
     - Pre-fractured: 5-7 pieces (top cap, 3-4 side pieces, bottom bowl)
   - Phase 3: Machine redesign
     - Rewrite `machine/Base.ts` - cylindrical pedestal instead of box + feet
     - Rewrite `machine/Body.ts` - cylinder instead of rounded box
     - Rewrite `machine/Dome.ts` - larger dome (radius ~1.8), higher opacity (0.35-0.45), collar ring
     - Rewrite `machine/TopCap.ts` - simpler, playful finial
     - Delete `machine/CoinSlot.ts` (no coins in digital version)
     - Rewrite `machine/ExitChute.ts` -> nest-like tray (LatheGeometry bowl)
     - Rewrite `machine/Handle.ts` - more prominent, side-mounted, add raycasting
     - Update `machine/Decorations.ts` for cylindrical body
     - Update `machine/Label.ts` for new body shape
     - Update `Machine.ts` to expose nest tray + handle for raycasting
   - Phase 4: Orbit system
     - Implement tilted elliptical orbit in Experience.ts update loop
     - Nested Group technique: orbit plane (tilted 50-55deg) > pivot group > eggs
   - Phase 5: Animation rewrites
     - New `animations/TriggerAnimation.ts` - handle crank + wobble
     - New `animations/BuildUpAnimation.ts` - orbit speed ramp + ghost trails + golden glow
     - New `animations/CaptureAnimation.ts` - winning egg into dome + others scatter
     - New `animations/DispenseAnimation.ts` - egg drops to tray + bounce
     - New `animations/HatchAnimation.ts` - pre-fractured crack + text reveal + particles
     - Delete old `EntryAnimation.ts`, `SpinAnimation.ts`, `RevealAnimation.ts`
   - Phase 6: Experience.ts rewrite
     - New update loop with 7-state handling
     - Raycaster setup for clickable handle
     - Camera choreography per state
     - Remove UI handle button, keep edit/reset buttons
   - Phase 7: UI updates
     - Simplify `UIManager.ts` - remove `showHandleButton`/`disableHandleButton`
     - Update `index.html` if needed
   - Phase 8: Effects & polish
     - Add ghost trail effect (clone array or AfterimagePass)
     - Update `SparkleEffect.ts` for hatch burst
     - Add interior light effect for hatch moment
     - Camera choreography fine-tuning

3. **Get user approval** on the plan via ExitPlanMode before implementing.

## Other Notes

### Files to keep unchanged:

- `src/core/Renderer.ts`, `src/core/Sizes.ts`, `src/core/Loop.ts`
- `src/utils/EventEmitter.ts`, `src/utils/colorToHex.ts`
- `src/utils/roundedBox.ts` (may still be useful)
- `src/effects/ConfettiEffect.ts` (reuse as-is)
- `src/objects/FloatingStars.ts`

### Files to delete:

- `src/objects/Capsule.ts` (replaced by Egg.ts)
- `src/objects/machine/CoinSlot.ts`
- `src/animations/EntryAnimation.ts`
- `src/animations/SpinAnimation.ts`
- `src/animations/RevealAnimation.ts`

### Key technical notes:

- No external physics library needed - simple Euler integration for egg pieces (gravity + damping + angular velocity)
- Raycaster for handle click detection needs mouse/touch event listeners on canvas
- Ghost trails: start with manual clone approach (8 clones, decreasing opacity) - simpler than postprocessing
- Consider adding `simplex-noise` package if doing runtime crack-line generation (alternative: pre-compute jagged cuts)
- The egg's pre-fractured pieces should be built at construction time and kept hidden until hatch phase
- All research agents completed successfully despite web access limitations (used training knowledge)
- Plan mode was entered but no plan file was written yet - the next session should write the plan and get approval
