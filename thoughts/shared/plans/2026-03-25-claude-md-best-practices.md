# CLAUDE.md & agent_docs/ Implementation Plan

## Overview

Create a CLAUDE.md file and `agent_docs/` directory for the Gambreng project, following HumanLayer best practices: concise (~40 lines), covering WHY/WHAT/HOW, with progressive disclosure to `agent_docs/` for task-specific documentation.

## Current State Analysis

- No CLAUDE.md exists
- No `agent_docs/` directory exists
- Project already has strong tooling: husky pre-commit hooks, knip dead-code detection, oxlint (via vite-plus), vitest for testing
- Commits already follow conventional commit format (`feat:`, `fix:`, `refactor:`, etc.)
- `thoughts/shared/` contains handoffs, research, and plans — but is meant for session-level context, not agent onboarding docs

### Key Discoveries:

- oxlint is bundled inside vite-plus, not a standalone devDependency — `vp lint` runs oxlint under the hood
- Pre-commit hook runs `vp staged` (lint+format staged files) and `knip --cache --no-progress` (`src/.husky/pre-commit:3-4`)
- CI pipeline: check → knip → test:run → build → deploy (`.github/workflows/deploy.yml:28-46`)
- Path alias `@/` → `./src/` configured in `tsconfig.json:17-19`
- `Experience.ts` is the main orchestrator that wires scene, machine, capsules, state, UI, and animations (`src/Experience.ts:21`)
- ~20 source files, small focused project

## Desired End State

1. A `CLAUDE.md` at project root (~40 lines) that any Claude session can read to immediately understand the project
2. An `agent_docs/` directory with a single architecture doc for deeper context
3. Both indexed so Claude Code picks them up automatically

### How to Verify:

- `CLAUDE.md` exists at project root and is under 50 lines
- `agent_docs/architecture.md` exists with project structure and key patterns
- Content is accurate and matches current codebase state
- No code style rules duplicated from linter config
- No stale code snippets (use `file:line` references instead)

## What We're NOT Doing

- Adding code style rules to CLAUDE.md (handled by oxlint via vite-plus)
- Documenting Three.js patterns (derivable from code)
- Moving or restructuring `thoughts/` directory
- Adding task-specific instructions to CLAUDE.md
- Embedding code snippets (use file:line pointers instead)

## Implementation Approach

Two phases: first create the progressive disclosure target (`agent_docs/`), then create CLAUDE.md that points to it. This order ensures CLAUDE.md references are valid from the start.

## Phase 1: Create `agent_docs/` Directory

### Overview

Create `agent_docs/architecture.md` — a concise architecture reference for task-specific context.

### Changes Required:

#### 1. `agent_docs/architecture.md`

**File**: `agent_docs/architecture.md` (new)
**Purpose**: Progressive disclosure target for project architecture details

Content should cover:

- **Project structure**: src/ directory layout with one-line descriptions per directory
  - `src/core/` — Renderer, game loop, responsive sizing
  - `src/objects/` — 3D scene objects (Machine, Capsule, Environment, FloatingStars)
  - `src/objects/machine/` — Factory functions for machine parts (base, body, dome, handle, etc.)
  - `src/animations/` — Entry, spin, and reveal animation sequences
  - `src/effects/` — Confetti and sparkle particle effects
  - `src/state/` — Finite state machine (Idle → Entering → Ready → Spinning → Revealing → Done)
  - `src/ui/` — DOM-based UI overlay management
  - `src/utils/` — EventEmitter, color helpers, rounded box geometry
  - `src/types/` — Shared TypeScript interfaces
- **Key patterns**:
  - `Experience.ts` is the main orchestrator — entry point for scene setup, state transitions, and animation coordination
  - Event-driven architecture via `EventEmitter` base class
  - Factory functions for machine parts in `src/objects/machine/`
  - URL-based state sharing via query parameter encoding (`src/config.ts`)
  - Game state machine with explicit transitions (`src/state/GameState.ts`)
- **Data flow**: `main.ts` → `Experience` → (Machine + Capsules + GameState + UIManager) → animation sequences

### Success Criteria:

#### Automated Verification:

- [x] File exists: `agent_docs/architecture.md`
- [x] No lint/typecheck impact (it's a markdown file)

#### Manual Verification:

- [ ] Content accurately describes current project structure
- [ ] No stale information or incorrect file references
- [ ] Useful for a new Claude session to understand the codebase quickly

---

## Phase 2: Create `CLAUDE.md`

### Overview

Create the root CLAUDE.md file — concise, universally applicable, with pointers to `agent_docs/` for deeper context.

### Changes Required:

#### 1. `CLAUDE.md`

**File**: `CLAUDE.md` (new, at project root)
**Target**: ~40 lines

Structure:

```markdown
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
- `npm run check` — Lint + format check (oxlint via vite-plus)
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
```

### Success Criteria:

#### Automated Verification:

- [x] File exists: `CLAUDE.md`
- [x] Line count under 50: `wc -l CLAUDE.md`
- [x] Pre-commit hooks still pass: `npm run check && npm run knip`

#### Manual Verification:

- [ ] All commands listed are accurate and runnable
- [ ] Progressive disclosure links point to real files/directories
- [ ] No code style rules duplicated from linter
- [ ] Reads well as a quick onboarding doc for any Claude session

**Implementation Note**: After completing both phases and all automated verification passes, pause for manual confirmation that the content is accurate and reads well before considering the task done.

---

## Testing Strategy

### Automated:

- Verify files exist at expected paths
- Run `npm run check` to ensure no project impact
- Run `wc -l CLAUDE.md` to verify conciseness (<50 lines)

### Manual:

- Read through CLAUDE.md and verify every command works
- Read through `agent_docs/architecture.md` and verify accuracy against actual code
- Start a fresh Claude Code session and confirm CLAUDE.md is picked up

## References

- Research: `thoughts/shared/research/2026-03-25-claude-md-best-practices.md`
- HumanLayer blog: https://www.humanlayer.dev/blog/writing-a-good-claude-md
- Package scripts: `package.json:11-28`
- Pre-commit hooks: `.husky/pre-commit:1-4`
- CI pipeline: `.github/workflows/deploy.yml:28-46`
- Main orchestrator: `src/Experience.ts:21`
