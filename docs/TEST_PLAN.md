# Test Plan + Results (2026-10-08)

## Automated (verified)
- `npx vitest run`: **13/13 pass** — name validation (blank/overlong/controls/unicode/min), save round-trip/garbage/migration-clamp/unrecoverable, sequence solve/reset-replay/post-solve-ignore, beam alignment.
- `npx tsc --noEmit`: **clean**.
- `npm run build`: **pass** — dist/index.html + assets (JS 3.15MB / gzip 1.07MB; three.js baseline, code-split later).
- Asset URL check: all 18 `/models/*` URLs referenced in src resolve on disk; public/models = 1.52MB.

## Manual smoke (dev server, required before release claim)
- [ ] Welcome → name + 3 real GLB previews rotate → Enter enabled only when valid
- [ ] Cinematic skips → spawn village → WASD/drag/Space/E work; no fall-through; rim walls hold
- [ ] E near Mira/spirit → dialogue + quest; E at grove/lake/ruins → panels solve → fragment toast + counter
- [ ] Reload → Continue restores fragments; corrupted save → Welcome, no crash
- [ ] Mobile viewport: joystick/camera/buttons, safe-area, no scroll
- [ ] Photo mode screenshot downloads; WebGL-off browser shows message

## Acceptance mapping
Character/saves, gameplay/world, technical/delivery checklists in spec §14 are covered by the rows above; full end-to-end (all 3 puzzles + finale + Vercel URL) must be ticked with evidence before claiming release.
