---
date: 2026-03-23T22:23:08+07:00
researcher: claude
git_commit: none (no git init)
branch: none
repository: gambreng
topic: "Gambreng 3D Gacha App - Build & Polish"
tags: [gacha, three.js, web-app, 3d-animation, orange-teal-theme]
status: in_progress
last_updated: 2026-03-23
last_updated_by: claude
type: implementation_strategy
---

# Handoff: Gambreng 3D Gachapon Gacha App

## Task(s)

**Primary Task**: Build a web-based 3D gachapon (capsule toy machine) application called "Gambreng" for random theme selection in a drawing challenge video production.

**Status**: Core implementation complete, polish/bugfixes in progress.

### Completed

- Full Three.js scene with custom-built gachapon machine (no external 3D assets)
- Machine geometry: base with feet, teal body, glass dome (MeshPhysicalMaterial), top cap, coin slot, exit chute, handle, decorative trims/stars/side panels
- 4 animated capsules (two-tone spheres with P1-P4 labels)
- Game flow: idle → entering → ready → spinning → revealing → done → reset
- GSAP animation system: capsule orbit, entry, shuffle, shake, winner reveal, sparkles, confetti
- Color scheme applied: Orange (#FD5901, #F78104, #FAAB36) + Teal (#249EA0, #008083, #005F60)
- Environment: dark teal sky, ground with glow ring, floating stars, fog, 5-light setup (ACES filmic tone mapping)
- UI overlay: buttons (start/spin/reset), participant theme panel, result overlay
- Sticker/logo system: loads `assets/gambreng-logo.png` with canvas text fallback

### In Progress / Known Bugs

1. **Participant themes panel overlaps "PUTAR!" button** — was moved to top-left but still overlapping at bottom of screen (see screenshot). Needs to either auto-hide when handle button appears, or be repositioned further away.
2. **Logo/sticker not showing** — user has a GAMBRENG logo image (metallic rock-style text, black background, PNG) that needs to be saved to `assets/gambreng-logo.png`. The code already handles loading it. User needs to save the file there.
3. **Capsule colors are all white in dome** — from the screenshot, capsules inside the dome appear all white/same color. The bottom halves (colored) may not be visible due to rotation or the sphere geometry orientation. Investigate `SphereGeometry` half construction in `createCapsules()`.

### Explored but Rejected

- Sketchfab asset embed (looked "ditempel"/pasted on, user rejected)
- External 3D model download (Sketchfab requires auth, no suitable free direct-download gachapon models found)
- Decision: build everything from scratch in Three.js for cohesive look

## Critical References

- `handoff.md` — original design spec with requirements, flow, and user preferences
- Color palette: Orange & Teal from SchemeColor (#FD5901, #F78104, #FAAB36, #249EA0, #008083, #005F60)

## Recent changes

- `app.js` — Full rewrite: custom machine geometry, orange/teal color scheme, reduced winner capsule scale (2.5 → 1.6), sticker loader with fallback
- `style.css` — Full rewrite: dark teal theme, orange/teal buttons, participant panel moved to top-left, result overlay with teal gradient
- `index.html` — Title changed to use logo image with onerror fallback to text

## Learnings

- Sketchfab download API requires authentication (401). Even CC-BY models can't be downloaded programmatically without a user token.
- Sketchfab viewer `.binz` files are proprietary encrypted format, not convertible to GLTF.
- Poly Pizza (`static.poly.pizza`) allows direct GLB downloads without auth, but has no gachapon models.
- `MeshPhysicalMaterial` with `clearcoat` gives nice glass dome effect for the transparent sphere.
- User communication style: casual Indonesian (Jakarta slang), direct, no fluff. They get annoyed if asked to do manual steps ("ya lu download lah sendiri").
- User explicitly rejected the "tempel" (pasted-on) look of embedding external assets — everything must feel like one cohesive scene.

## Artifacts

- `index.html` — Main HTML entry point
- `style.css` — Full styling (orange/teal theme)
- `app.js` — All Three.js logic, machine construction, animations, game state (~750 lines)
- `handoff.md` — Original design document with requirements
- `assets/` — Directory created for logo, currently empty (user needs to save gambreng-logo.png here)

## Action Items & Next Steps

1. **Fix participant themes overlapping button** — Either hide the themes panel when "PUTAR!" button appears (add `participantThemesEl.classList.add('hidden')` before showing handleBtn in `startEntry()`), or move it to a non-overlapping position. The panel is at `position: fixed; top: 16px; left: 16px;` in CSS but still overlaps because the button area is at bottom-center.

2. **Get logo file saved** — User has the GAMBRENG logo image. It needs to be saved to `assets/gambreng-logo.png`. Once there, it auto-loads as machine sticker + UI title.

3. **Fix capsule colors visibility** — From screenshot, capsules in dome look all white. Check `createCapsules()` in `app.js:363-420` — the bottom half sphere geometry and material color assignments. May need to adjust the sphere segment parameters or capsule rotation so colored halves are visible.

4. **Polish pass** — Once bugs are fixed:
   - Test full flow end-to-end (start → spin → reveal → reset → repeat)
   - Verify reset properly returns all state
   - Consider adding sound effects
   - Make participant names/themes configurable (currently hardcoded)

## Other Notes

- **Project structure**: Single-page app, no build tools, served via `python3 -m http.server 8080`
- **Key dependencies**: Three.js r128 (CDN), GSAP 3.12.2 (CDN)
- **Machine coordinate reference**: Ground at y=0, machine base ~y=0.5, body ~y=2, dome ~y=3.6, cap ~y=5.5. Capsules orbit at y=6 in idle, settle at y=3.8 inside dome.
- **No git repo initialized** — all files are local only
- **User context**: This is for a video production where 4 participants each propose a drawing theme, and the gacha randomly picks one. Needs to be OBS-capture friendly.
- **Downloaded but unused models** in `assets/`: arcade.glb, claw.glb, slot.glb, vending\_\*.glb — these can be deleted, they were exploration attempts.
