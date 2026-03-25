# Gambreng

## What

3D gacha machine web app for random theme/winner selection. Indonesian-themed UI.
Deployed to Cloudflare Pages at gambreng.pages.dev.

## Stack

Three.js, GSAP, TypeScript, vite-plus (wraps Vite + oxlint), Vitest

## Project Structure

- `src/Experience.ts` — Main orchestrator
- `src/core/` — Renderer, loop, sizing
- `src/objects/` — 3D scene objects and machine parts
- `src/animations/` — Entry, spin, reveal sequences
- `src/effects/` — Particle effects
- `src/state/` — Game state machine
- `src/ui/` — DOM UI overlay
- `src/config.ts` — Participants, URL encoding

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Typecheck + build
- `npm run check` — Format, lint, and type checks (via vite-plus)
- `npm run test:run` — Run tests once
- `npm run knip` — Detect unused exports/dependencies

## Tooling

- **Linting/formatting**: `vp lint` / `vp fmt` (oxlint under the hood)
- **Pre-commit**: Husky runs `vp staged` + `knip` automatically
- **Dead code**: Knip detects unused exports, dependencies, and files
- **Testing**: Vitest with jsdom environment

## Conventions

- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `ci:`, `style:`, `build:`, `test:`
- Path alias: `@/` maps to `./src/`

## Docs

- `agent_docs/architecture.md` — Project architecture and patterns
- `thoughts/shared/plans/` — Implementation plans
- `thoughts/shared/research/` — Research documents
