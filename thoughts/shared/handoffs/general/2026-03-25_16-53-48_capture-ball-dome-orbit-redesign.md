---
date: 2026-03-25T16:53:48+07:00
researcher: claude
git_commit: a94e72bb5642af6e444f51ff572d8ee641c69336
branch: main
repository: gambreng
topic: "Capture-Ball Dome-Orbit Redesign Implementation Strategy"
tags: [implementation, strategy, three-js, animation, capture-ball, orbit-system, gacha]
status: complete
last_updated: 2026-03-25
last_updated_by: claude
type: implementation_strategy
---

# Handoff: Capture-ball dome-orbit redesign

## Task(s)

- **Completed:** Reviewed and implemented from `thoughts/shared/plans/2026-03-25-egg-based-gacha-redesign.md`, including the original Phase 1-6 work (states, 3D handle interaction, dome light, orbit system, trigger/build/capture/dispense/hatch flow, reset, cleanup).
- **Completed:** Incorporated a later user-directed redesign that **supersedes the egg metaphor**:
  - eggs -> **capture-ball-inspired balls**
  - idle motion -> **orbit around the outside of the glass dome**
  - buildup -> balls get **pulled inside the dome** and scramble there
  - reveal -> **smooth seam-pop opening** instead of fracture hatch
  - goal -> make **every transition as smooth as possible**
- **Completed:** Final polish / cleanup pass and immediate bug fixes after QA:
  - handle hover feedback
  - consistent reset of result overlay
  - removed dead files/dependency so `knip` passes
- **Status:** Code is working and locally verified; the remaining work is **feel/polish tuning**, not structural implementation.

## Critical References

- `thoughts/shared/plans/2026-03-25-egg-based-gacha-redesign.md` — original implementation plan; **useful for state flow, but the final object/reveal direction diverged** after user feedback.
- `src/Experience.ts` — current orchestration of the full round flow, hover handling, reset, camera behavior.
- `src/objects/CaptureBall.ts` and `src/objects/OrbitSystem.ts` — the new core object + motion system that now define the experience.

## Recent changes

- Added the new ball object with seam/button/opening state in `src/objects/CaptureBall.ts:20`.
- Replaced the old high-above orbit with outside-dome -> inside-dome chaotic motion in `src/objects/OrbitSystem.ts:15`.
- Rewired the app from eggs to balls, kept 3D handle interaction, and updated the full round chain in `src/Experience.ts:25`, `src/Experience.ts:145`, `src/Experience.ts:161`, `src/Experience.ts:174`, `src/Experience.ts:190`, `src/Experience.ts:206`, `src/Experience.ts:233`, `src/Experience.ts:288`.
- Reworked buildup to smoothly pull the orbit inward and turn on chaos inside the dome in `src/animations/BuildUpAnimation.ts:5`.
- Reworked capture to isolate a winner inside the dome with loser fade/drop behavior in `src/animations/CaptureAnimation.ts:6`.
- Reworked dispense to be a smoother tray drop with bounce in `src/animations/DispenseAnimation.ts:5`.
- Replaced fracture-style hatch with seam-charge + pop-open reveal in `src/animations/HatchAnimation.ts:5`.
- Fixed result overlay reset behavior in `src/ui/UIManager.ts:158`, `src/ui/UIManager.ts:175`, `src/ui/UIManager.ts:195`.
- Cleaned dead exports/config so `knip` passes in `src/config.ts:10`, `src/objects/machine/Dome.ts:5`, `knip.json:2`.
- Removed obsolete implementation artifacts:
  - deleted `src/objects/Egg.ts`
  - deleted `src/objects/Capsule.ts`
  - removed `@dgreenheck/three-pinata` from dependencies (`package.json:30`)

## Learnings

- The **user prefers metaphor + motion coherence over literal completion of the egg plan**. The big product correction was: the dome should be the star, so the objects must begin **around** the dome and then be drawn **into** it.
- The new design reads much better when the sequence is: **outside orbit -> inward pull -> inside chaos -> winner isolate -> tray drop -> seam pop**. That logic is encoded in `src/objects/OrbitSystem.ts` and the animation files above.
- The old fracture approach was functionally working, but it felt visually abrupt. The seam-pop approach in `src/animations/HatchAnimation.ts` is smoother and matches the user’s taste better.
- `UIManager.hideResult(true)` was needed because the previous animated hide left the overlay feeling stale during reset. That immediate hide is now used from `Experience.resetGame()`.
- `knip` originally failed due to leftover files/exports/dependency. It is now clean, so if a future agent sees a `knip` regression, first check for new unused files/exports rather than runtime breakage.
- **Important:** the frontmatter metadata script requested by the handoff instructions does **not** exist in this repo (`scripts/spec_metadata.sh` returned “No such file or directory”), so metadata in this handoff was gathered manually.
- **Important:** `git_commit` in frontmatter is the current HEAD commit, but the working tree contains uncommitted changes from this session. Do not assume these changes are already committed.

## Artifacts

- Updated plan/reference context:
  - `thoughts/shared/plans/2026-03-25-egg-based-gacha-redesign.md`
- New / updated implementation files:
  - `src/Experience.ts`
  - `src/objects/CaptureBall.ts`
  - `src/objects/OrbitSystem.ts`
  - `src/animations/TriggerAnimation.ts`
  - `src/animations/BuildUpAnimation.ts`
  - `src/animations/CaptureAnimation.ts`
  - `src/animations/DispenseAnimation.ts`
  - `src/animations/HatchAnimation.ts`
  - `src/objects/Machine.ts`
  - `src/objects/machine/NestTray.ts`
  - `src/objects/machine/Handle.ts`
  - `src/objects/machine/Dome.ts`
  - `src/ui/UIManager.ts`
  - `src/config.ts`
  - `src/state/GameState.ts`
  - `src/types/index.ts`
  - `tests/state/GameState.test.ts`
  - `package.json`
  - `package-lock.json`
  - `knip.json`
- Deleted obsolete files:
  - `src/objects/Egg.ts`
  - `src/objects/Capsule.ts`
  - `src/animations/EntryAnimation.ts`
  - `src/animations/SpinAnimation.ts`
  - `src/animations/RevealAnimation.ts`
  - `src/objects/machine/CoinSlot.ts`
  - `src/objects/machine/ExitChute.ts`
- Existing earlier handoff worth reading for historical context only:
  - `thoughts/shared/handoffs/general/2026-03-25_12-40-27_gashapon-full-redesign.md`

## Action Items & Next Steps

1. **Manual feel polish** (highest value remaining work):
   - tune outside-dome orbit radius/height so the balls hug the dome more elegantly in idle
   - tune internal chaos to feel richer but still legible
   - smooth camera timing/easing even further across build-up, capture, dispense, and reveal
2. **Visual design polish:** make the ball design more original / less directly evocative of Pokémon if desired (color blocking, button proportions, seam styling).
3. **Manual QA pass:** test multiple consecutive play/reset cycles in browser and on different viewport sizes.
4. **Commit the work** if approved; nothing from this session has been committed yet.

## Other Notes

- Verification performed locally after the redesign:
  - `npm run lint` ✅
  - `npm run build` ✅
  - `npm run test:run` ✅
  - `npm run knip` ✅
  - browser smoke test ✅ (no runtime errors; idle outside-dome orbit, inside-dome chaos, tray drop, pop-open reveal, result overlay, reset)
- `humanlayer thoughts sync` should mirror this handoff into searchable thoughts storage if the CLI is available.
- The repo still has some unrelated untracked project docs (`CLAUDE.md`, `agent_docs/`, `thoughts/` content outside this handoff) and a dirty working tree; avoid assuming a clean git state.
