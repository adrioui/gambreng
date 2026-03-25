---
date: 2026-03-25T18:18:02+0700
researcher: claude
git_commit: 57ec7352cc22a59be782637918a9e8308baa7f96
branch: main
repository: gambreng
topic: "SiDhodot Art Style Conversion — Research & Implementation Strategy"
tags: [art-style, toon-shading, three-js, npr-rendering, sidhodot, comic-strip]
status: complete
last_updated: 2026-03-25
last_updated_by: claude
type: implementation_strategy
---

# Handoff: SiDhodot (@dhoodot) Art Style Conversion Research

## Task(s)

1. **Deep research on @dhoodot TikTok art style** — COMPLETED
   - User wants to restyle the 3D gacha machine to match the art style of TikTok creator @dhoodot (SiDhodot)
   - Researched the creator's identity, platform presence, and visual style
   - Retrieved and analyzed their TikTok avatar image to characterize the art style
   - Identified Three.js techniques needed to replicate the style

2. **Implementation of art style changes** — PLANNED (not started)
   - No code changes have been made yet
   - A full implementation strategy has been defined below

## Critical References

- `src/objects/machine/materials.ts` — All shared machine materials (current PBR, needs conversion to toon)
- `src/objects/Environment.ts` — Scene lighting, fog, sky, ground (needs complete restyle)
- `src/config.ts:10-32` — The `PALETTE` and `MACHINE_COLORS` color definitions (needs palette swap)

## Recent changes

No code changes were made in this session. This was a research-only session.

## Learnings

### About @dhoodot / SiDhodot

- **TikTok**: @dhoodot | **Instagram**: @sidhodot | **Display name**: SiDhodot
- **Bio**: "Comic strip & Ilustration, Story about 'Si Dhodot'"
- **Country**: Indonesia | **Stats**: ~13.7K followers, 440 videos, 1.26M likes
- **Format**: Multi-panel komik strip gag comedy, shared on TikTok/Instagram/Facebook (via IDN Toon aggregator)
- **Known works**: "Parfum Tembus Pandang" comic strip, "Senyuman Manis Tanpa Karies" educational ebook

### Art Style Characteristics (from avatar analysis + context)

The avatar was successfully retrieved via tikwm.com API and viewed directly. The Si Dhodot character has:

- **Wild spiky dark maroon/brown hair** radiating outward
- **Big white bulging eyes** with black pupils (gag-comic convention)
- **Small orange round nose**, **wide grinning mouth with gapped teeth**
- **Tan/beige skin**, large protruding ears
- **Bold, sketchy hand-drawn outlines** — not clean vectors, organic brush strokes with visible weight variation
- **Warm earthy muted color palette** — maroons, browns, tans, orange accents, off-whites
- **Flat-ish fills with slight brush texture** — not perfectly smooth digital coloring
- **Exaggerated proportions** — big heads, expressive faces, comedic style

### How to Access TikTok Content Programmatically

- **tikwm.com** is the best free no-auth TikTok proxy API:
  - `GET https://www.tikwm.com/api/user/info?unique_id=dhoodot` — user profile (confirmed working)
  - `POST https://www.tikwm.com/api/user/posts` with form data `unique_id=dhoodot&count=20&cursor=0` — video list with thumbnails
  - Note: tikwm has Cloudflare protection, so curl from CLI gets blocked. WebFetch tool worked for the GET endpoint.
- **TikTok oEmbed API**: `GET https://www.tiktok.com/oembed?url=...` — gives profile/video metadata, no auth needed
- **TikNeuron** (tikneuron.com) offers a TikTok MCP tool for Claude integration (20 free credits/month, requires API key)

### Three.js Implementation Techniques Researched

| Technique                                        | Purpose                                           | Source                                                                                 |
| ------------------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `MeshToonMaterial` + gradient maps               | Flat toon shading with discrete tonal steps       | Three.js built-in                                                                      |
| `OutlineEffect` (three/addons)                   | Bold cartoon outlines on silhouettes              | `three/addons/effects/OutlineEffect.js`                                                |
| Post-process outline pass (Sobel + depth/normal) | Interior edge detection (creases, folds)          | Three.js forum tutorial                                                                |
| PencilLinesPass (Codrops)                        | Hand-drawn wobble/sketch effect                   | `tympanus.net/codrops/2022/11/29/sketchy-pencil-effect-with-three-js-post-processing/` |
| Custom ShaderMaterial toon shader                | Full artistic control over shadow/highlight bands | `maya-ndljk.com/blog/threejs-basic-toon-shader`                                        |

### Current Visual Stack (what needs to change)

The project currently uses:

- **7 lights** (ambient, hemisphere, key directional, fill directional, rim point, under-glow point, dome spot)
- **All `MeshStandardMaterial`** except dome (`MeshPhysicalMaterial`) and a few `MeshBasicMaterial` for unlit elements
- **ACES filmic tone mapping** at 1.1 exposure
- **PCFSoftShadowMap** shadows
- **Dark teal palette** (`#003333` fog, `#001a1a`-`#004040` sky gradient) with orange/gold accents
- **No post-processing** — no `EffectComposer`, no passes, no custom shaders
- Color config in `src/config.ts:10-32` (`PALETTE` and `MACHINE_COLORS`)
- All per-component materials defined inline in `src/objects/machine/*.ts` and `src/objects/CaptureBall.ts`

## Artifacts

- This handoff document (research synthesis)
- Avatar image cached at: `~/.claude/projects/-Users-adrifadilah-Learn-gambreng/6035b47e-0084-401e-b717-99508e1ef3d6/tool-results/webfetch-1774436950868-zku3v1.webp` (the Si Dhodot character — spiky hair, gapped teeth, sketchy outlines)

## Action Items & Next Steps

### Phase 1: Color Palette Swap

1. Redefine `PALETTE` and `MACHINE_COLORS` in `src/config.ts` with warm earthy tones:
   - Replace teals → warm browns, tans, cream
   - Replace bright oranges → muted ochre, maroon
   - Keep accent pops (orange nose color) for highlights
2. Update `Environment.ts` sky gradient from teal → warm cream/paper tones
3. Update fog color from `#003333` → warm muted tone (e.g., `#f5efe6` or similar warm off-white)

### Phase 2: Material Conversion (PBR → Toon)

1. Replace all `MeshStandardMaterial` with `MeshToonMaterial` across:
   - `src/objects/machine/materials.ts` (shared trim material)
   - `src/objects/machine/Base.ts`, `Body.ts`, `TopCap.ts`, `Handle.ts`, `Decorations.ts`, `NestTray.ts`
   - `src/objects/CaptureBall.ts` (5 materials per ball)
   - `src/objects/Dome.ts` (dome `MeshPhysicalMaterial` → toon or keep transparent)
2. Create 3-tone gradient map textures (canvas-generated or loaded) for warm tonal steps
3. Use `THREE.NearestFilter` on gradient maps for discrete tonal bands

### Phase 3: Add Outline Effect

1. Import `OutlineEffect` from `three/addons/effects/OutlineEffect.js`
2. Wrap renderer in `OutlineEffect` in `src/core/Renderer.ts`
3. Use dark brown outlines (`#2d1a0e`), not pure black — thickness ~0.003-0.005
4. Configure per-object outline parameters via `mesh.material.userData.outlineParameters`

### Phase 4: Post-Processing Pipeline

1. Add `EffectComposer` (first time — project currently has none)
2. Add `RenderPass` → optional `PencilLinesPass` for hand-drawn edge wobble
3. Consider Sobel edge detection for interior crease lines
4. May need to switch from `OutlineEffect` to a post-process outline pass if both are needed

### Phase 5: Lighting Simplification

1. Reduce from 7 lights to 2-3:
   - Warm directional key light (keep shadows)
   - Low warm ambient light
   - Optional warm rim/fill
2. Remove all teal-colored lights
3. Adjust tone mapping — possibly switch from ACES filmic to `THREE.NoToneMapping` or `LinearToneMapping` for flatter comic look

### Phase 6: Environment Restyle

1. Sky sphere gradient → warm cream/paper tones
2. Ground material → warm earthy tone, possibly with paper texture
3. Floating stars → adjust colors to match new palette
4. Particle effects (sparkles, confetti) → warm earthy palette

### Optional Enhancements

- Paper/canvas texture overlay on background for hand-drawn feel
- Slight UV noise displacement on sketch pass for organic wobble
- Cross-hatching texture in shadow regions

## Other Notes

### Key Files to Modify (exhaustive list)

**Core rendering:**

- `src/core/Renderer.ts` — tone mapping, shadow type, add OutlineEffect/EffectComposer
- `src/Experience.ts:54-56` — camera setup (FOV 40° is fine for comic feel)

**Colors/config:**

- `src/config.ts:10-32` — `PALETTE` and `MACHINE_COLORS` definitions

**Environment:**

- `src/objects/Environment.ts` — all 7 lights, sky sphere, fog, ground, ground ring

**Machine parts (materials):**

- `src/objects/machine/materials.ts` — shared `createTrimMaterial()`
- `src/objects/machine/Base.ts:7,26` — feet, base platform materials
- `src/objects/machine/Body.ts:8,23` — body, front panel materials
- `src/objects/machine/TopCap.ts:7,18` — cap, knob materials
- `src/objects/machine/Handle.ts:10,27` — stem, ball materials
- `src/objects/machine/NestTray.ts:20` — bowl material
- `src/objects/machine/Decorations.ts:6,25` — stars, side panels
- `src/objects/Dome.ts:13` — dome (only MeshPhysicalMaterial in project)
- `src/objects/Label.ts:5` — logo label

**Capture balls:**

- `src/objects/CaptureBall.ts:54` — 5 distinct materials per ball + trail system

**Effects:**

- `src/effects/SparkleEffect.ts` — sparkle colors
- `src/effects/ConfettiEffect.ts` — confetti colors
- `src/objects/FloatingStars.ts` — floating star colors

### User Preference

- The user wants the style to **resemble** @dhoodot's art — this is an artistic direction change, not an exact clone. The key pillars are: warm earthy toon-shaded look with bold sketchy outlines, replacing the current cool-toned PBR arcade aesthetic.
- The user may want to provide screenshots from the TikTok for more precise style matching before implementation begins. Consider asking.
