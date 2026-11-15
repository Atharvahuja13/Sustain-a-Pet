# Sustain-a-Pet

A local-first virtual pet garden. Real-world green habits grow your active companion and earn shared leaves for gifts, quests, decorations, adoption and restoration.

## Run

```sh
npm ci
npm run dev -- --host 127.0.0.1
npm test
npm run build
npm run lint
```

Open http://127.0.0.1:5173. Saves stay in localStorage with an in-memory fallback when storage is blocked. Existing version-one saves migrate automatically; no accounts or tracking.

## Play

Hatch Leafling, Mossy or Sunbud. Open the journal for Today, Garden, Shop and Pets; every habit and the quiz is usable without the 3D canvas. Mushrooms still offer the original garden interactions. Camera buttons support touch; arrows rotate, +/- zoom and 0 resets the view. Global gameplay shortcuts pause while a journal or tutorial is open.

- Seven daily habits award 50 XP and 50 shared leaves in total. A correct quiz adds 10 XP/leaves; any quiz attempt completes the eighth task. Every task locks across companions for that local day.
- Claim a daily gift: 20 leaves, increasing by 5 per consecutive day to 50. A missed day resets the streak. Claims persist across reloads.
- Claim daily quests at 3 and 8 tasks for 15 and 30 leaves.
- Restore flowerbed (35), unlock Willow Pond (55), mend bridge (50), unlock Amber Grove (90), revive wishing tree (75). Prerequisites and funds are checked in the engine.
- Adopt remaining species for 50 leaves each; switch freely. Each pet keeps independent XP/health, including decay while inactive. Daily tasks, coins and garden progress are shared.
- Buy decorations once, place them left/center/right in each area, move them or put them away. Placing replaces an occupied slot. Decoration layout currently renders in the journal preview only.
- Areas/restorations currently render as journal chapters and completion cards. The 3D view remains the original procedural garden. New scenery/models must be authored through Blender MCP; none were added during this implementation.

Try a separate **practice garden** before or after hatching, or open `/?demo=1`. It uses `sustain-a-pet-demo`, while the real save uses `sustain-a-pet`. The practice drawer advances days and adds raw XP, which grants no leaves. Reset practice copies your current real garden, or starts Pip if none exists. Reload resumes the saved practice when you choose practice again. Five pet taps and Shift+D also enter practice.

## Architecture

- `src/engine.js`: pure daily habit/quiz/health rules, migration and task counting.
- `src/progression.js`: catalogs and pure economy/adoption/placement/restoration functions.
- `src/store.js`: reducer, real/practice routing, local calendar and persistence.
- `src/components/GardenJournal.jsx`: accessible native dialog with all progression controls and 2D placement preview.
- `src/components/pet3d/`: original scene/pets, damped animations and live reduced-motion subscription.
- `src/components/SceneBoundary.jsx`: isolates 3D load failures from the journal.

## Validation

52 engine/store/audio/progression tests pass; build and lint complete. Lint reports existing React/Three mutation/ref and Fast Refresh warnings; the production build warns about a large Three bundle. Browser checks and limits are recorded in `docs/QA.md`. See `docs/OTHER_AGENT_HANDOFF.md` for the remaining Blender and actual-footage video work.
