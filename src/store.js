// App state: useReducer over engine.js, persisted to localStorage (in-memory fallback).
import { useEffect, useReducer } from 'react'
import {
  addDays, addXp, allHabitsDone, answerQuiz, createState, dateKey, daysBetween, logHabit, moodFor, rollover, stageIndex,
} from './engine.js'

const REAL_KEY = 'sustain-a-pet'
const DEMO_KEY = 'sustain-a-pet-demo'

const memory = {}
const storage = {
  get(key) {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return memory[key] ?? null
    }
  },
  set(key, value) {
    memory[key] = value
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage blocked: memory copy keeps the app working */
    }
  },
  remove(key) {
    delete memory[key]
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  },
}

const realToday = () => dateKey(new Date())
export const todayOf = (app) => addDays(realToday(), app.inDemo ? app.offset : 0)
export const activeOf = (app) => (app.inDemo ? app.demo : app.real)

function load() {
  const inDemo = new URLSearchParams(window.location.search).get('demo') === '1'
  const real = storage.get(REAL_KEY)
  const demoSave = storage.get(DEMO_KEY)
  const app = {
    real: real?.version === 1 ? real : null,
    demo: demoSave?.state ?? null,
    offset: demoSave?.offset ?? 0,
    inDemo: false,
    events: [],
    awayDays: 0,
    nonce: 0,
  }
  return reduce(app, { type: inDemo ? 'enterDemo' : 'open' })
}

/** Diff two pet states into reward events the UI can play. */
function diffEvents(before, after, today) {
  const ev = []
  if (!before || !after || before === after) return ev
  const habitNow = after.days[today]?.habits ?? []
  const habitBefore = before.days[today]?.habits ?? []
  const newHabit = habitNow.find((h) => !habitBefore.includes(h))
  if (newHabit) ev.push({ type: 'tick', habit: newHabit, xp: after.xp - before.xp, health: after.health - before.health })
  if (after.days[today]?.quiz && !before.days[today]?.quiz) {
    ev.push({ type: after.days[today].quiz === 'correct' ? 'quizCorrect' : 'quizWrong' })
  }
  if (stageIndex(after.xp) > stageIndex(before.xp)) ev.push({ type: 'stageUp', stage: stageIndex(after.xp) })
  for (const id of after.unlocked) if (!before.unlocked.includes(id)) ev.push({ type: 'unlock', id })
  if (moodFor(after.health) !== moodFor(before.health)) ev.push({ type: 'mood', mood: moodFor(after.health), from: moodFor(before.health) })
  if (allHabitsDone(after, today) && !allHabitsDone(before, today)) ev.push({ type: 'allDone' })
  return ev
}

function withPet(app, update) {
  const today = todayOf(app)
  const before = activeOf(app)
  const after = update(before, today)
  if (after === before) return app
  const next = app.inDemo ? { ...app, demo: after } : { ...app, real: after }
  return { ...next, events: diffEvents(before, after, today), nonce: app.nonce + 1 }
}

export function reduce(app, action) {
  switch (action.type) {
    case 'open': {
      // On open/focus: apply decay for days away; remember how long for the welcome-back line.
      if (!app.real) return app
      const today = todayOf(app)
      const away = daysBetween(app.real.lastOpenDate, today)
      const real = rollover(app.real, today)
      if (real === app.real) return app
      return { ...app, real, awayDays: away, events: [], nonce: app.nonce + 1 }
    }
    case 'hatch': {
      const real = createState(action.name.trim().slice(0, 20), todayOf({ ...app, inDemo: false }), action.sprite)
      return { ...app, real, awayDays: 0, events: [], nonce: app.nonce + 1 }
    }
    case 'tick':
      return withPet(app, (s, t) => logHabit(s, action.id, t))
    case 'quiz':
      return withPet(app, (s, t) => answerQuiz(s, action.choice, t, action.correct))
    case 'dismissAway':
      return { ...app, awayDays: 0 }
    case 'enterDemo': {
      const seed = app.demo ?? { ...(app.real ?? createState('Pip', realToday())), lastOpenDate: realToday() }
      const demo = app.demo ? rollover(seed, addDays(realToday(), app.offset)) : seed
      return { ...app, inDemo: true, demo, events: [], awayDays: 0, nonce: app.nonce + 1 }
    }
    case 'exitDemo':
      return { ...app, inDemo: false, events: [], nonce: app.nonce + 1 }
    case 'skipDay': {
      if (!app.inDemo) return app
      const offset = app.offset + (action.days ?? 1)
      const today = addDays(realToday(), offset)
      const before = app.demo
      const demo = rollover(before, today)
      return { ...app, offset, demo, awayDays: daysBetween(before.lastOpenDate, today), events: diffEvents(before, demo, today), nonce: app.nonce + 1 }
    }
    case 'addXp':
      return app.inDemo ? withPet(app, (s) => addXp(s, action.amount)) : app
    case 'resetDemo': {
      storage.remove(DEMO_KEY)
      const seed = { ...(app.real ?? createState('Pip', realToday())), lastOpenDate: realToday() }
      return { ...app, demo: seed, offset: 0, events: [], awayDays: 0, nonce: app.nonce + 1 }
    }
    default:
      return app
  }
}

export function useApp() {
  const [app, dispatch] = useReducer(reduce, undefined, load)

  useEffect(() => {
    if (app.real) storage.set(REAL_KEY, app.real)
  }, [app.real])
  useEffect(() => {
    if (app.demo) storage.set(DEMO_KEY, { state: app.demo, offset: app.offset })
  }, [app.demo, app.offset])

  // Apply decay when the tab comes back after midnight.
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && dispatch({ type: 'open' })
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  return [app, dispatch]
}
