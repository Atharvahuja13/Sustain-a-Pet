# Gameplay validation — 15 November 2026

## Automated

- 52 tests across engine, store, audio and progression pass.
- Production build passes; a Three-related chunk exceeds 500 kB.
- Oxlint exits successfully with warnings in the original React/Three patterns (mutable refs/materials, Fast Refresh exports, useMemo).
- New coverage: version-one migration retains XP/history/identity; once-daily gifts and streak reset; wrong quiz still completes the eight-task quest; prerequisites and duplicate spending; an earned day-one-to-three route to wishing-tree restoration plus adoption; owned-only decor and movement; independent inactive-pet decay across switches; practice focus rollover with no real save and no mutation of a real save at a future practice date.

## Actual in-app browser walkthrough

- Entered practice from onboarding without hatching a real save.
- Journal native modal opens, closes and focuses its close control. Fixed StrictMode cleanup immediately closing the modal.
- Collected daily gift; completed seven habits and answered quiz incorrectly: eight tasks, 50 XP, no quiz reward. Claimed both quests.
- Verified pond locked until flowerbed restoration; restored flowerbed and unlocked pond through earned leaves.
- Bought lantern, placed it in pond center and observed the journal layout preview.
- Reloaded, resumed practice and verified gift, task and quest locks persisted.
- Advanced one practice day; new gift/tasks available. Completed habits and a correct quiz, claimed quests, adopted Mossy with earned funds. Mossy shows 0 XP, original Pip retains 110 XP, and daily tasks/gift/quest claims remain locked after switching active pet.
- Inspected journal and garden at 390 × 844. All daily tasks are in the scrolling journal, outside the canvas. Added touch camera controls.

## Limits and pending checks

- Day-one-to-three complete restoration route is an engine test; browser walkthrough covered first two days including pond, shop and adoption.
- Live reduced-motion subscription and in-flight effect cancellation were reviewed in code. A live OS preference toggle was not performed in this browser. No claim of automated motion emulation.
- Storage-blocked and WebGL-error fallback paths were implemented, but not browser fault-injected.
- New area/restoration/decor 3D visuals are missing, explicitly described in the journal. Existing procedural scenery and pets remain. No Blender asset or demo video was generated.
- Earlier handoff commits ending in 51efa96 could not be found in the confirmed remote history, refs, reflog or unreachable objects. Latest accessible starting commit was 102760d; fetching the later abbreviated ref failed.
