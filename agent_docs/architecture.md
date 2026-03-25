# Architecture

## Project Structure

```
src/
├── main.ts              — Entry point: parses URL params, creates Experience
├── Experience.ts        — Main orchestrator: wires scene, state, UI, animations
├── config.ts            — Default participants, color palette, URL encoding/decoding
├── core/
│   ├── Renderer.ts      — Three.js WebGL renderer setup
│   ├── Loop.ts          — requestAnimationFrame game loop
│   └── Sizes.ts         — Viewport sizing and resize events
├── objects/
│   ├── Machine.ts       — Gacha machine assembly (composes parts from machine/)
│   ├── Capsule.ts       — Individual gacha capsule with participant data
│   ├── Environment.ts   — Lighting and scene background
│   ├── FloatingStars.ts — Decorative floating star particles
│   └── machine/         — Factory functions for machine parts
│       ├── Base.ts, Body.ts, Dome.ts, TopCap.ts
│       ├── Handle.ts, CoinSlot.ts, ExitChute.ts
│       ├── Label.ts, Decorations.ts
│       └── materials.ts — Shared machine materials
├── animations/
│   ├── EntryAnimation.ts  — Capsules enter the machine dome
│   ├── SpinAnimation.ts   — Handle crank + tumble + winner selection
│   └── RevealAnimation.ts — Winner capsule exits and zooms in
├── effects/
│   ├── ConfettiEffect.ts  — Confetti burst on winner reveal
│   └── SparkleEffect.ts   — Sparkle particles on capsule exit
├── state/
│   └── GameState.ts     — FSM: Idle → Entering → Ready → Spinning → Revealing → Done
├── ui/
│   └── UIManager.ts     — DOM overlay: buttons, result display, participant editor
├── utils/
│   ├── EventEmitter.ts  — Minimal event emitter base class
│   ├── colorToHex.ts    — Numeric color → CSS hex string
│   └── roundedBox.ts    — Rounded box geometry helper
└── types/
    └── index.ts         — Shared TypeScript interfaces (Participant, LoopCallback, etc.)
```

## Key Patterns

- **Orchestrator pattern**: `Experience` is the central coordinator — it owns the scene, camera, renderer, and all game objects. All state transitions and animation triggers flow through it.
- **Event-driven communication**: `EventEmitter` underpins resize events in `Sizes` and state-change events in `GameState`, keeping coordination decoupled.
- **Factory functions**: Machine parts in `src/objects/machine/` are standalone factory functions that return Three.js groups/meshes, composed by `Machine.ts`.
- **URL-based state sharing**: Participant names, themes, and colors are encoded as query parameters (`p1Name`, `p1Theme`, `p1Color`, etc.) so game configs can be shared via URL.
- **Finite state machine**: `GameState` enforces valid transitions between game phases, preventing out-of-order actions.
- **Animation sequences**: Each game phase is implemented as a GSAP sequence (`EntryAnimation`, `SpinAnimation`, `RevealAnimation`), and `Experience` advances state via callbacks.

## Data Flow

```
main.ts
  → parseParticipantsFromURL()     — reads URL params, falls back to defaults
  → new Experience(canvas, participants)
      → creates core (Sizes, Renderer, Loop)
      → creates scene objects (Environment, Machine, Capsules, FloatingStars)
      → creates GameState + UIManager
      → UIManager.bindEvents() connects UI buttons to Experience methods
      → Loop.start() begins render cycle

User interaction:
  Start → startEntry() → Entering state → EntryAnimation → Ready state
  Spin  → spinGacha()  → Spinning state → SpinAnimation → Revealing state → RevealAnimation → Done state
  Reset → resetGame()  → GameState.reset() → Idle state
```
