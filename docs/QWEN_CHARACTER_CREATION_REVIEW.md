# Qwen Technical Review - Character Creation Overhaul

Commit under review: `df39e6a` "feat: cinematic character creation (auto-framed 3D stage, live thumbnails, verified in headless Chrome)"

Scope: technical correctness, regressions, performance, maintainability. This review modifies no production code. Visual/UX verification is deliberately not duplicated (Muse's screenshots + `scripts/shot-creation.mjs` cover it).

Verified before writing: `npm run build` passes (tsc + vite), `npm test` passes (17/17, 3 files), full `git show df39e6a` diff read, `fitModel.ts` math audited line-by-line, `.gitignore` hexdump inspected, drei `ContactShadows` default `frames = Infinity` confirmed in `node_modules`.

## Summary

Solid work. The auto-framing math (`fitModel.ts`) is correct including degenerate cases; thumbnail/stage GLB reuse through the module-global `useLoader` cache is the right pattern; per-switch remount via `key={modelUrl}` does not leak WebGL contexts; the Enter flow (`setProfile -> onEnter -> persistAll -> CINEMATIC`) is intact; the 17-test suite still passes; no new prod-bundle dependencies. Findings below, worst first.

## High

### H1. iOS Safari WebGL context ceiling - creation page runs 4 simultaneous contexts

`src/game/CreationStage.tsx`: `CreationStage` mounts one `Canvas` (the stage) and `ThumbCanvas` mounts one `Canvas` per character card (`src/ui/CharacterCreation.tsx`, 3 cards) - 4 live contexts, each with its own WebGLRenderer, drawing buffer, and (stage only) a `ContactShadows` depth render target.

WebKit has historically killed the oldest live context when the total exceeds a small per-page cap (documented behavior varies; commonly reported around 4-8 depending on Safari version/device) [uncertainty: exact cap is version- and device-dependent; not reproducible on this Windows host]. At exactly 4 active contexts the creation page sits at that boundary; when `GameCanvas` mounts after CREATION->CINEMATIC the stage unmounts first, so in-game is fine - the risk window is the creation screen itself on older iOS devices.

Fix options (either suffices):
- One thumbnail canvas rendering 3 views via `gl.setScissor`/`setViewport` (single context), or
- Render each thumbnail once (`frameloop="never"` + one `invalidate()` after load) into a texture, blit to a canvas/blob, then unmount the canvas entirely (also wins M1's battery issue).

### H2. `shots/` committed to the repo (3.7 MB binaries); `.gitignore` line is dead

`git check-ignore -v shots/01-welcome.png` matches only `node_modules` on the path - nothing ignores `shots/`, and 10 PNG screenshots (~3.7 MB) are tracked at HEAD.

Root cause verified by hexdump: the committed `.gitignore` is UTF-16LE with BOM from the appended `shots/` line onward (`73 00 68 00 6f 00 74 00 73 00 2f 00 0d 00 0a 00`). Git does not decode UTF-16, so the pattern arrives as `\x00h\x00o...` garbage and never matches. Future screenshots will keep getting tracked; every Vercel clone pays the blob cost.

Fix (mechanical, not done here per no-code-change scope): re-encode `.gitignore` as UTF-8 with `shots/` on a clean line, then `git rm -r --cached shots`.

## Medium

### M1. Four always-on RAF loops on the creation screen

All four canvases use R3F's default `frameloop="always"`. The stage genuinely needs frames while `ContactShadows` (`frames=Infinity`, confirmed in `node_modules/@react-three/drei/core/ContactShadows.js:9`) and `autoRotate` run, and `Fireflies` animates. The three thumbnails render ~100 FPS static scenes forever: wasted GPU/battery on exactly the mobile class H1 worries about.

Fix: `frameloop="demand"` on `ThumbCanvas` + one `invalidate()` after the model resolves. `Comment says "Tiny always-on canvas (no render-race)"` - the no-race claim is right, but demand+invalidate preserves it at 1 frame.

### M2. Fit-transition goal lerp can fight `autoRotate`

`CreationStage.tsx` `FramedCharacter`: the fit effect does `camera.position.copy(pos)` and sets a `goal` that the frame loop lerps toward until `distance < 0.02`. With `autoRotate` + damping, `controls.update()` moves the camera every frame; if a fit happens while autoRotate is live (character switch or resize after the 2.5 s autoplay resumes), the lerp pulls toward a fixed point while autoRotate drags along the orbit - equilibrium sits above the 0.02 threshold, so the goal never clears and the two fight for the rest of the session. Initial mount clears (drift/frame ~0.017 < 0.02 at dist ~3), so the common path is fine; the resize/switch-during-autoplay path degrades.

Fix: clear the goal on the controls `start` event, or time-box the transition (~1 s), or hold `autoRotate` off until the goal clears.

### M3. Conflicting `.char-card` definitions between `styles.css` and `CharacterCreation.css`

Old `styles.css` `.char-card` (border 2px solid transparent, radius 12px, padding 8px, background `#0f1c17`) still exists while the new `CharacterCreation.css` redefines `.char-card`. Same specificity, so the winner is pure import-order (main.tsx imports styles.css first, the component CSS appends later, so the new sheet wins). It renders correctly today and breaks silently on any import reshuffle. Two names also collide: `.char-grid` in `styles.css` is now dead (zero usages), and the old `CharacterPreview` consumer of `usePlayerModel` is gone.

Fix: rename the new classes (e.g. `.cc-card`), delete the orphan `.char-grid` and old `.char-card` block.

### M4. `usePlayerModel` is now dead code

`src/game/Model.tsx:53` - `git grep usePlayerModel HEAD^` shows its only historical consumer was the deleted `CharacterPreview`; `Player.tsx` uses `useLoader(GLTFLoader, def.file)` directly. At HEAD it is an unused export.

### M5. `.gitignore` UTF-16 corruption (tracked in H2) and `shot-creation.mjs` hardcoded Chrome path

`scripts/shot-creation.mjs` hardcodes `C:\Program Files\Google\Chrome\Application\chrome.exe` - the harness script fails on any other machine/CI. Take the path from an env var (`CHROME_PATH`) with the current value as fallback. devDependency-only, so it does not touch the prod bundle.

## Low

- L1. `role="radiogroup"` + bare `role="radio"` buttons without arrow-key navigation violates the ARIA radio pattern; either implement arrow-key handling or use plain buttons with `aria-pressed`. Keyboard users can still select via Tab+Enter, so not High.
- L2. Enter `disabled={!valid}` hides the reason from keyboard users (button untabbable); `aria-disabled` + click-time error would keep focus flow. Hint text + `aria-describedby` already exist - just gate with `aria-disabled`.
- L3. `touch-action: none` on the stage canvas: single-finger drags on the top ~44 vh rotate the model instead of scrolling the page - intentional for a 3D stage, but on small viewports (`390x844` shots confirm the stage sits mid-screen) a user starting a scroll on the stage gets nothing. Acceptable game convention; add a hint line or `overscroll-behavior: contain` on the scroller.
- L4. iOS Safari `100vh`/`dvh`: `.creation { min-height: 100vh }` under dynamic toolbars; the Enter button is below the fold at 390x844 (verified in Muse's mobile screenshot) and the inner scroller compensates, so reachable - recommend `dvh` with `vh` fallback.
- L5. `onFitted` callback is recreated per render but excluded from the fit effect deps (eslint-disable comment present). Correct today; a future contributor adding it to deps turns it into a render loop (setTarget -> re-render -> new arrow). Add `useCallback` at the call site or comment the hazard.
- L6. Duplicated normalize/measure logic (feet-at-y=0, center-x) between `FramedCharacter` and `ThumbModel` memos - extract into `fitModel.ts` when next touched.
- L7. `CreationStage` `Fireflies`: 42 separate `<mesh>` with own geometry+material = ~84 GPU objects + 42 draw calls in the stage. Fine; instance or share two geometry/material consts when convenient. Game-side `Regions.tsx` `Fireflies` (50-90 meshes) has the same shape.
- L8. Name input `maxLength={24}` vs validator cap 20: chars 21-24 are typeable but leave the button disabled with no distinct message. Cosmetic.

## Notes (verified positive)

- Loader-cache reuse is real and load-bearing: `useLoader` keys by URL module-globally, so the 3 character GLBs (total ~1.1 MB) are fetched/parsed once and shared between thumbnails and stage; the same URLs later serve `GameCanvas`/`Regions` with zero re-fetch.
- Character switch remount (`key={modelUrl}`) disposes no shared geometry (R3F v8 does not auto-dispose `primitive` subtrees) and creates no new context (same `Canvas`); no leak across switches or into gameplay. R3F v8 teardown on unmount handles the stage context when leaving CREATION [inference from R3F v8 unmount behavior; not directly observed].
- `fitModel.ts` degenerate-path audit: empty/degenerate box -> `size = -Inf` -> `NaN` worst -> loop no-ops -> negative dist grows loop to `+Inf` -> ends at `fitLimit`; no crash, camera never ends up inside the model; elevation-shift feedback converges (max 10 iters, 0.9 factor) for all aspect ratios including portrait.
- Enter/flow regression check: 17 tests pass; `sanitizeDisplayName` slicing (20) consistent with validator; name preserved across character switches; App.tsx wiring (`persistAll`, `startAmbient(false)`, `CINEMATIC`) unchanged from HEAD^.
- StrictMode double-effect is idempotent here (same fit result, same autoRotate state).
- `PauseAutoRotate`'s early-return-when-controls-null recovers: `useThree(s => s.controls)` re-renders on `makeDefault`, so the effect re-runs.

## Suggested fix order

1. `.gitignore` UTF-8 re-encode + `git rm -r --cached shots` (H2) - 2 minutes, prevents repo growth.
2. Thumbnails `frameloop="demand"` + `invalidate()` (M1) - 5 lines; also mitigates H1 pressure.
3. Delete dead `.char-card`/`.char-grid`/`usePlayerModel` (M3/M4).
4. Schedule iOS single-context thumbnails (H1) before any iOS release; goal lerp `start`-event clear (M2) whenever CreationStage is next touched.
