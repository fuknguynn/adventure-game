# Gameplay Verification Report — branch `qa/gameplay-verification`

Worktree: `../fantasy-qa` (dedicated; production code frozen during pass).
Base commit: `1711b8d` (includes movement-basis fix).
No gameplay fixes until this report is complete. No merges.

## Scope
End-to-end, no debug shortcuts: New Adventure → Character Creation →
Cinematic → Village → 3 regions → 3 puzzles → 3 fragments → Ancient Tree →
Ending. Plus: movement/camera/animation, save/continue, mobile viewport,
console/runtime errors.

## Runs (append-only)
| # | Area | Script | Result |
|---|---|---|---|
| 1 | Onboarding + HUD (J/M/Esc/photo) + mobile | `scripts/shot-audit.mjs` | PASS except F-01/F-02 (pause-Esc dead, J one-way); zero console errors |
| 2 | Movement calibration (post basis-fix) | `scripts/shot-calib.mjs` | PASS (W/D/WD headings sane; ~1.2m/s sprint headless) |
| 3 | E2E in progress | `scripts/shot-e2e.mjs` | onboarding/dialogue/save/lake-solve PASS; grove/ruins/finale pending |
| 4 | Env branch visual (`feat/environment-polish` @04fe4a4) | `scripts/shot-envtour.mjs` | PASS (below), zero console errors |

## Findings
### F-01 (bugs): Esc does not open any pause UI
Repro: in PLAYING with journal open (or closed), press Esc → no pause
overlay appears; `text/Resume` absent from DOM.
Root cause (code-read, `App.tsx:53-54` vs `GameCanvas` local state):
App sets *phase*=`PAUSED`, but `PauseView` renders only from GameCanvas's
*local* `paused` state, which is set solely by the HUD pause button.
Phase and overlay are split-brained; keyboard pause is dead on arrival.
Impact: keyboard-only players cannot pause. No console errors.
Status: DOCUMENTED — no fix per no-fix-during-verification rule.

### F-02 (ux): J opens journal but no keyboard path closes it
`KeyJ` handler (`App.tsx:56`) only sets `showJournal=true`; closing needs
the Close button click. Minor; mouse/touch users unaffected.
Status: DOCUMENTED — no fix per no-fix-during-verification rule.

### V-01 (visual pass, env branch @04fe4a4): APPROVED with nits
Tour: spawn / 3 orbit angles / path walk / mobile (`shots/env-0*.png`).
No longer a flat prototype: textured medieval houses, market benches, lamps,
fences, lake with lilies/reeds/gems, layered tree wall hiding the horizon,
moss patches, pebbles, winding path, fireflies. Mobile HUD readable.
Nits (non-blocking): lake waterline meets grass abruptly; path still has one
long straight stretch; day-slider overlaps nothing. Zero console errors.
Status: recorded; merge decision belongs to repo owner, not QA.
