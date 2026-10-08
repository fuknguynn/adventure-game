# Deployment (Vercel Hobby, static)

- Framework: Vite · Build: `npm run build` · Output: `dist` · Install: `npm install` (lockfile committed).
- Steps: push repo to GitHub → Vercel → Import → defaults (vercel.json already sets build/output) → deploy.
- Verify on production URL: loads, Welcome → Creation → PLAYING, no console 404s, reload mid-game restores via Continue, mobile viewport, direct `/` navigation, asset case-sensitivity (all lowercase paths).
- Budgets: public/models 4.41MB; JS 3.15MB (gzip 1.07MB). No server/DB/auth/paid APIs. Quotas per Vercel Hobby terms; do not claim success until URL verified.

# Known Limitations
- Environments/props load as glTF+bin+texture PNG (upstream ships 0 native GLB); all three files must deploy together — vendor script guarantees the sets and rewrites buffer uris to local names.
- Character animation clips: upstream Rig_Medium GLBs exist but retargeting across KayKit rigs is unreliable; characters render in rest pose with a heading marker. Idle-bob fallback was cut for scope; motion readability comes from movement + spirit light.
- Wildlife: no verified fauna in the three approved repos — ambient life is fireflies/light particles + spirit only. No unlicensed downloads made.
- Audio: no verified music/SFX in approved repos — all sound is Web Audio synthesis (mute + volume in Settings).
- Village buildings use KayKit village pack (home_a/home_b/barracks/market/watchtower/tent/well) + dungeon pack (walls/columns/rubble) for the ruins; graveyard props imply tone only, no textures beyond pack defaults.
- NPC uses a stylized robed figure (compatible silhouette), not a claimed KayKit model.
- Bundle 3.15MB (three.js); code-splitting and KTX2/Meshopt optimization are future work. Mobile target 30fps not yet measured on device.
