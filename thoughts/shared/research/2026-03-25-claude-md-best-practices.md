---
date: 2026-03-25T20:00:00+07:00
researcher: Claude
git_commit: a94e72bb5642af6e444f51ff572d8ee641c69336
branch: main
repository: gambreng
topic: "How to apply CLAUDE.md best practices from HumanLayer blog to this project"
tags: [research, claude-md, developer-experience, documentation]
status: complete
last_updated: 2026-03-25
last_updated_by: Claude
---

# Research: Applying CLAUDE.md Best Practices to Gambreng

**Date**: 2026-03-25T20:00:00+07:00
**Researcher**: Claude
**Git Commit**: a94e72bb5642af6e444f51ff572d8ee641c69336
**Branch**: main
**Repository**: gambreng

## Research Question

How to apply the advice from https://www.humanlayer.dev/blog/writing-a-good-claude-md to this codebase.

## Summary

The blog post (by Kyle at HumanLayer, Nov 2025) centers on six principles for writing effective CLAUDE.md files. Applied to Gambreng — a small, single-purpose Three.js gacha machine app — the result should be a very short CLAUDE.md (~30-50 lines) covering WHY/WHAT/HOW, with progressive disclosure to existing docs in `thoughts/`.

## Key Principles from the Blog Post

### 1. CLAUDE.md = Onboarding Document (WHY / WHAT / HOW)

- **WHY**: Purpose of the project
- **WHAT**: Tech stack, project structure map
- **HOW**: Build commands, verification steps, how Claude should work

### 2. Less Instructions is More

- LLMs can reliably follow ~150-200 instructions (frontier thinking models)
- Claude Code system prompt already uses ~50 of those
- Every unnecessary instruction degrades ALL instruction-following uniformly
- Claude Code injects a `<system-reminder>` telling Claude to ignore CLAUDE.md if not relevant

### 3. Keep It Concise and Universally Applicable

- Target under 300 lines; shorter is better (HumanLayer's own is <60 lines)
- Only include what applies to every task/session
- Bad example: "how to structure a database schema" (task-specific)

### 4. Progressive Disclosure

- Keep task-specific docs in separate files (e.g., `agent_docs/` or `thoughts/`)
- CLAUDE.md just lists those files with brief descriptions
- Use `file:line` pointers instead of code snippets (they go stale)

### 5. Don't Use LLMs as Linters

- Use actual linters/formatters (this project already has vite-plus lint/fmt + knip)
- Use hooks (this project already has Husky pre-commit running `vp staged` + `knip`)
- Don't put code style guidelines in CLAUDE.md

### 6. Don't Auto-Generate CLAUDE.md

- Highest leverage point in the harness — craft it carefully
- Don't use `/init`

## Application to Gambreng

### What This Project Already Has Right

- **Linting/formatting**: vite-plus handles lint + format; no need for style rules in CLAUDE.md
- **Pre-commit hooks**: Husky runs `vp staged` and `knip --cache` — catches issues automatically
- **CI pipeline**: GitHub Actions runs check → knip → test → build → deploy
- **Clean structure**: Well-organized src/ with clear separation of concerns
- **Existing docs**: thoughts/shared/ has handoffs, research, and plans

### What CLAUDE.md Should Contain

**WHY section (~3 lines)**:

- Gambreng is a 3D gacha machine web app for random theme/winner selection
- Indonesian-themed UI, deployed to Cloudflare Pages at gambreng.pages.dev

**WHAT section (~10 lines)**:

- Tech stack: Three.js, GSAP, TypeScript, Vite (vite-plus), Vitest
- Project structure overview: src/core/, src/objects/, src/animations/, src/effects/, src/state/, src/ui/
- Experience.ts is the main orchestrator

**HOW section (~15 lines)**:

- Build/dev commands: `npm run dev`, `npm run build`
- Verification: `npm run typecheck`, `npm test`, `npm run check`
- Unused code detection: `npm run knip`
- Note about conventional commits
- Note about path aliases (`@/` → `./src/`)

**Progressive disclosure pointers (~5 lines)**:

- Point to `thoughts/shared/plans/` for implementation plans
- Point to `thoughts/shared/research/` for research documents
- Point to `thoughts/shared/handoffs/` for session handoffs

### What CLAUDE.md Should NOT Contain

- Code style rules (handled by linter/formatter)
- Three.js patterns or conventions (derivable from code)
- Detailed architecture docs (put in separate file if needed)
- Task-specific instructions
- Code snippets

## Recommended CLAUDE.md Draft

See the draft CLAUDE.md proposed alongside this research. Target: ~40 lines, covering all three pillars (WHY/WHAT/HOW) with progressive disclosure to thoughts/.

## Code References

- `package.json` - All available npm scripts
- `src/Experience.ts` - Main orchestrator class
- `src/config.ts` - Configuration, participants, URL encoding
- `src/state/GameState.ts` - Finite state machine
- `.github/workflows/deploy.yml` - CI/CD pipeline
- `.husky/pre-commit` - Git hooks setup
- `tsconfig.json` - TypeScript config with path aliases

## Architecture Insights

- Small, focused project (~20 source files) — CLAUDE.md should be proportionally small
- No monorepo complexity — no need for elaborate project maps
- Factory function pattern for machine parts (src/objects/machine/)
- Event-driven architecture (EventEmitter base class)
- URL-based state sharing (query parameter encoding)

## Historical Context (from thoughts/)

- `thoughts/shared/handoffs/general/2026-03-23_22-23-08_gambreng-gacha-app.md` - Initial project handoff
- `thoughts/shared/handoffs/general/2026-03-25_12-40-27_gashapon-full-redesign.md` - Recent redesign handoff
- `thoughts/shared/plans/2026-03-25-gashapon-redesign.md` - Current redesign plan
- `thoughts/shared/research/2026-03-24-typescript-cloudflare-refactor.md` - Prior refactor research

## Open Questions

- Should `agent_docs/` be created as a separate directory, or is `thoughts/shared/` sufficient for progressive disclosure?
- Are there any project-specific conventions not captured in linting that should be documented?
