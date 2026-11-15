Continue Sustain-a-Pet from the actual repository below. Focus on Blender-authored visual integration and a real gameplay demo. Gameplay implementation is complete for the current feasible scope; do not replace it with mocked flows.

User rules: use separate chats, NEVER subagents. Use GPT-6.1 medium for code quality and Blender/world work; GPT-6 Luna high only for repetitive work where quality will not suffer. Read AGENTS.md. Commit incrementally and push main directly; never force-push. Preserve saves and the implemented behavior.

Repository: https://github.com/Atharvahuja13/Sustain-a-Pet.git
Local checkout: /Users/sonalahuja/Documents/Codex/2026-11-15/fol/work/Sustain-a-Pet
Stable gameplay SHA: 84c0e30e4a1531dee0e32a11afbd6dcce82dc7d3 (pushed main).
Earlier checkpoints: cea6222 (rules/migration), 8daac27 (journal/motion). This handoff file may be committed in a later documentation-only commit; fetch and inspect current main before editing.

Historical-source warning: the pasted prior handoff listed 51efa96, 9089a1c, 8649d94, 4f27002 and 1a1b7e8. None were in confirmed remote history, local refs/reflog or unreachable objects; fetching 51efa96 failed. Starting source actually available was 102760d. Do not claim those prior assets, video or features were recovered.

RUN / VERIFY
npm ci
npm run dev -- --host 127.0.0.1
npm test
npm run build
npm run lint
The current dev server was left at http://127.0.0.1:5173/ (verify it is still running). 52 automated tests pass. Build passes with a large Three chunk warning; lint exits successfully with existing React/Three ref/mutation, useMemo and Fast Refresh warnings. See docs/QA.md for exact browser verification and limits.

ACTUAL GAMEPLAY
- Local save version 2 migrates existing v1 identity, XP, health, daily history, habit counts and unlocks. Real/practice saves are separate localStorage keys: sustain-a-pet and sustain-a-pet-demo. Blocked storage falls back to memory.
- Daily gift 20 leaves plus 5 per consecutive day (cap 50); once a local calendar day; missed day resets streak.
- Seven habits earn 50 XP/leaves total, correct quiz +10 XP/leaves. Wrong quiz is recorded and still counts as the eighth daily task, without quiz XP or leaves.
- Daily quests at 3 and 8 tasks grant 15 and 30 leaves, claimed once daily.
- Shared coins, daily habit/quiz locks, quests, gifts, decor and restoration across pets. Each pet retains separate XP/health. Inactive pets decay once across elapsed days. Remaining species cost 50 leaves; switching costs nothing.
- Restoration path: flowerbed 35 -> pond 55 -> bridge 50 -> grove 90 -> wishing tree 75. Prerequisites and funds enforced in pure engine. Tests verify earned progression through day 3, including adoption, without raw XP or coin injection.
- Shop: lantern 25, planter 35, bench 45; buy once; place left/center/right, move across areas, replace occupied slots, put away. Ownership/placement persists.
- Native modal journal has Today/Garden/Shop/Pets pages; all habits and quiz accessible outside canvas; global shortcuts pause while a modal/tutorial is open. Camera has touch controls.
- Explicit practice entry before/after hatch; separate saved copy; advance 1/3 days or add raw XP (no leaves); reset copies real garden or fresh Pip. Returning focus in future practice never decays real save. Query ?demo=1 enters practice.
- Animation springs use bounded delta, live reduced-motion subscription cancels in-flight particle/auto-wander/dance/bounce movement, removes decorative ring rotation/float and selected CSS animations. No blanket .01ms CSS override. Manual navigation remains usable. New error boundary isolates 3D failures from journal.

VISUAL INTEGRATION STILL REQUIRED
No new 3D maps or models were authored. Current scene and three pets are the original procedural components. New unlocked areas, restored landmarks and decor appear only as journal cards / a clearly labelled 2D decoration layout preview. Product copy explains that 3D view stays in the original garden and decoration preview is journal-only. Do not imply these are distinct rendered 3D environments until integration is complete.

Use Blender MCP for ALL newly authored maps and 3D models. Do not substitute procedural Three geometry, generated fake assets or unverified downloaded scenes. The previous investigation found no configured Blender MCP and no supplied phone .blend/.glb on this Mac. First establish actual Blender MCP capability and locate/provide the user's realistic phone model. If unavailable, report the concrete blocker; do not claim an asset was authored.

DATA / FILE HOOKS
- src/progression.js exports PETS, DECOR, AREAS, RESTORATIONS, QUESTS and pure operations. IDs must remain stable: leafling/mossy/sunbud; lantern/planter/bench; meadow/pond/grove; flowerbed/bridge/tree.
- src/engine.js is pure daily rules/migration; src/store.js routes mutations and real/practice persistence. Reducer actions: gift, quest(id), buy(id), place(id,slot), restore(id), area(id), pet(id), tick(id), quiz(choice,correct).
- src/App.jsx activeOf(app) currently names the whole garden state pet. pet.area is selected area, pet.areas unlocked IDs, pet.restored completion IDs, pet.placements object maps `${area}:${slot}` to decor ID, pet.owned is item IDs. Pass these into World rather than inventing duplicate state. Example: placements['pond:center'] === 'lantern'.
- src/components/pet3d/World.jsx currently gets habit/quiz/progress props only. Integrate authored area scenes, restoration model visibility and decor transforms there, with suitable default-camera visibility and walkable bounds. Do not hide rewards under bottom UI.
- PetModel.jsx selects original sprite bodies; PetRig.jsx supplies live motion/growth/glow; Face.jsx animates face. Blender body meshes can replace body geometry while preserving ctl/stage/mood/reduced interfaces. Faces, transient effects and invisible input surfaces may remain runtime geometry where needed for animation; be precise in claims.
- src/components/GardenJournal.jsx contains area/restoration cards and preview disclaimer. Remove/update disclaimers only after actual rendered assets work.
- src/components/SceneBoundary.jsx wraps 3D view/preview; retain journal fallback on load failures.

DEMO VIDEO (SEPARATE CHAT)
User requested a full 120-second HyperFrames demo showing ACTUAL gameplay footage, not invented features or composited fake behavior. Locate/read the user's HyperFrames skill; it was not available in this Mac's skill catalog. Locate the realistic installed iPhone model; use it without the reflection map (do not load the EXR). No demo-video files or phone assets were created in this checkout. Build an editable project and render only after the gameplay/assets are stable; coordinate a source freeze so HMR does not disrupt capture. Capture practice with earned progress (skip days is allowed and should be visibly practice), not injected saves. Do not present missing pond/grove scenery as if already rendered. Capture journal gift/quests, real habit and quiz flow, shop ownership/placement, restoration prerequisites, adoption/switching and reload persistence. Include the final exact app SHA and describe any remaining visual-only limits.

BROWSER QA ALREADY DONE
In-app browser: practice from onboarding -> gift -> seven habits + wrong quiz -> 8/8 -> quest claims -> flowerbed -> pond -> buy/place lantern -> reload/resume -> locks persist -> next day -> gift/habits/correct quiz -> claim -> earned Mossy adoption (0 XP) while Pip retains 110 XP and shared tasks remain locked. Journal and garden visually inspected at 390x844. Day-3 route tested in engine, not full browser walkthrough. Live OS reduced-motion preference toggle and injected storage/WebGL failure were not performed. Recheck browser after asset integration and do not inherit unsupported QA claims.
