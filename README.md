# Sustain-a-Pet

A virtual pet that stays healthy only while you do small green habits in real life. Pick one of three 3D sprites, explore its garden, complete daily habits at their own mushrooms, answer a quiz question, and watch your pet react, grow and celebrate.

Everything stays on your device (localStorage). No accounts, no tracking.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # engine + store tests
npm run build
```

Demo mode: open `/?demo=1`, or tap the pet 5 times. It runs on its own saved copy, so your real pet is never touched.

## What's built

- Pure game engine (`src/engine.js`): habits, daily decay, mood bands, stages, unlocks, quiz.
- Reducer + saving (`src/store.js`) with an in-memory fallback if storage is blocked.
- Three procedural 3D pets (Leafling, Mossy, Sunbud) in `src/components/pet3d/`: four moods, four stages, no model files.
- Full-screen responsive garden with a mushroom for each daily habit. Walk close to a mushroom to reveal its completion checkbox; completing it uses the same persisted XP and reward flow as before.
- Rewards: tick bounce + leaf burst, quiz confetti, stage-up cutscene, happy dance, unlock toasts. All respect reduced motion.

## AI-use disclosure

Written with Claude Code (Anthropic). _Team: expand this section with who prompted, reviewed and can explain each part._

## Sources

_TODO: list sources for the habit "why" lines and quiz facts._
