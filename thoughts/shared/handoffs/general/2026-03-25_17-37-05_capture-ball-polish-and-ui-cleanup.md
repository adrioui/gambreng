---
date: 2026-03-25T17:37:05+07:00
researcher: adrifadilah
git_commit: ab6c179323fcbd8b3b0fdf599dd002227019c084
branch: main
repository: gambreng
topic: "Capture-Ball Polish and UI Cleanup Implementation Strategy"
tags: [implementation, polish, three-js, animation, capture-ball, ui]
status: complete
last_updated: 2026-03-25
last_updated_by: adrifadilah
type: implementation_strategy
---

# Handoff: general capture-ball polish and UI cleanup

## Task(s)

- **Completed:** Resumed from `thoughts/shared/handoffs/general/2026-03-25_16-53-48_capture-ball-dome-orbit-redesign.md`, verified the redesign state, and confirmed the repo still matches the capture-ball / dome-orbit direction rather than the older egg plan.
- **Completed:** Ran a polish pass across visuals, motion, camera framing, ball styling, and UI consistency.
- **Completed:** Ran browser QA on the main start → reveal → reset loop and repeated play cycles.
- **Completed:** Fixed lingering egg-era UI copy (`MASUKKAN TELUR` -> `MULAI GAMBRENG`).
- **Not fully closed:** 3D handle hover/click was not fully automation-verified in browser tooling; previous handoff said it worked manually, and this session removed likely UI overlap issues, but a human browser check is still worth doing once before commit.

## Critical References

- `thoughts/shared/handoffs/general/2026-03-25_16-53-48_capture-ball-dome-orbit-redesign.md`
- `src/Experience.ts`
- `src/objects/CaptureBall.ts`

## Recent changes

- Updated default framing / camera target and reset framing in `src/Experience.ts:25`, `src/Experience.ts:55`, `src/Experience.ts:152`, `src/Experience.ts:227-234`, `src/Experience.ts:282`.
- Reworked trigger crank timing and camera push in `src/animations/TriggerAnimation.ts:11-52`.
- Smoothed hatch settle camera target in `src/animations/HatchAnimation.ts:264-285`.
- Made the balls less directly Pokémon-like via warmer shell tint, bronze/copper seam/button materials, smaller button shapes, and reset-state updates in `src/objects/CaptureBall.ts:54-90`, `src/objects/CaptureBall.ts:113-116`, `src/objects/CaptureBall.ts:140-157`, `src/objects/CaptureBall.ts:178-209`.
- Tightened idle orbit / reduced vertical wobble / cleaned inside scramble in `src/objects/OrbitSystem.ts:5-8`, `src/objects/OrbitSystem.ts:178-203`.
- Improved scene lighting / fog / ring readability in `src/objects/Environment.ts:9`, `src/objects/Environment.ts:48`, `src/objects/Environment.ts:59-97`.
- Improved body/panel readability and fixed front-face z-fighting by pushing the panel forward in `src/objects/machine/Body.ts:8-31`.
- Improved dome glass material in `src/objects/machine/Dome.ts:12-24`.
- Tuned top cap silhouette / knob / trim in `src/objects/machine/TopCap.ts:12-33`.
- Moved label slightly forward for cleaner layering in `src/objects/machine/Label.ts:13`.
- Refined participant-theme panel animation in `src/ui/UIManager.ts:131-140`.
- Cleaned UI layout / title placement / overlay pointer behavior / responsive result sizing in `style.css:21-79`, `style.css:118-133`, `style.css:157-202`, `style.css:401-431`.
- Updated start CTA copy in `index.html:26`.

## Learnings

- The old egg plan remains useful only as history; the actual product direction is now fully capture-ball based. Do not reintroduce egg-specific UI or motion assumptions.
- The biggest visible issue during this session was not code correctness but **composition/readability**: lighting, title placement, and front-panel layering had more impact than structural animation changes.
- The title previously occupied the lower center and visually fought the machine/handle area. Moving it to the top center made the scene feel much more finished and reduced the chance of confusing 3D handle interaction.
- The machine front panel needed a slight Z push (`src/objects/machine/Body.ts:31`) and the label needed to move forward (`src/objects/machine/Label.ts:13`) to avoid muddy overlap/flicker.
- Browser automation could validate full DOM/UI state transitions well, but it was not reliable for proving raycasted Three.js handle hover/click. If a future agent needs certainty there, do a manual browser pass.
- `scripts/spec_metadata.sh` is still missing in this repo, so metadata for this handoff was gathered manually again.
- `git_commit` in frontmatter is the current HEAD, **not** a commit containing this session’s work. The working tree is dirty/uncommitted.

## Artifacts

- Previous redesign handoff: `thoughts/shared/handoffs/general/2026-03-25_16-53-48_capture-ball-dome-orbit-redesign.md`
- Current session handoff: `thoughts/shared/handoffs/general/2026-03-25_17-37-05_capture-ball-polish-and-ui-cleanup.md`
- Updated implementation files:
  - `index.html`
  - `src/Experience.ts`
  - `src/animations/HatchAnimation.ts`
  - `src/animations/TriggerAnimation.ts`
  - `src/objects/CaptureBall.ts`
  - `src/objects/Environment.ts`
  - `src/objects/OrbitSystem.ts`
  - `src/objects/machine/Body.ts`
  - `src/objects/machine/Dome.ts`
  - `src/objects/machine/Label.ts`
  - `src/objects/machine/TopCap.ts`
  - `src/ui/UIManager.ts`
  - `style.css`

## Action Items & Next Steps

1. **Manual browser QA (recommended before commit):** verify real pointer hover/click on the 3D handle and ensure the cursor/hover scale works from a human interaction perspective.
2. **If approved, commit the work** from both the redesign session and this polish session.
3. Optional final polish only if requested:
   - tweak orbit height/radius a little more by eye in `src/objects/OrbitSystem.ts`
   - tweak title/logo size or spacing in `style.css` if branding should be more subtle
   - further de-Pokémon-ify the ball if product feedback asks for it

## Other Notes

- Browser QA completed this session:
  - idle load / composition check ✅
  - start flow ✅
  - participant themes show/fade ✅
  - result overlay appears ✅
  - reset works ✅
  - repeated replay works ✅
- Validation completed this session:
  - `npm run build` ✅
  - `npm run test:run` ✅
  - `npm run lint` ✅
  - `npm run knip` ✅
- `humanlayer thoughts status` reported that the current repository is **not mapped** to thoughts, but sync may still be attempted per instructions.
