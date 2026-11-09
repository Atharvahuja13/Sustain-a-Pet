// Pure game rules. No React, no storage, no clock: every function takes today as YYYY-MM-DD.
import habits from './data/habits.json'
import accessories from './data/accessories.json'

export const START_HEALTH = 80
export const MIN_HEALTH = 10
export const DECAY_PER_DAY = 10
export const QUIZ_XP = 10
export const QUIZ_HEALTH = 6
export const STAGES = ['Seed', 'Sprout', 'Sapling', 'Guardian']
export const STAGE_STARTS = [0, 60, 250, 600]

export const habitById = (id) => habits.find((h) => h.id === id)

export function moodFor(health) {
  if (health >= 75) return 'Thriving'
  if (health >= 40) return 'Okay'
  if (health >= 15) return 'Wilting'
  return 'Sick'
}

export function stageFor(xp) {
  if (xp >= 600) return 'Guardian'
  if (xp >= 250) return 'Sapling'
  if (xp >= 60) return 'Sprout'
  return 'Seed'
}

export const stageIndex = (xp) => STAGES.indexOf(stageFor(xp))

/** XP left until the next stage, or null at the top. */
export function nextStage(xp) {
  const i = stageIndex(xp)
  if (i === STAGES.length - 1) return null
  return { name: STAGES[i + 1], at: STAGE_STARTS[i + 1], from: STAGE_STARTS[i] }
}

const pad = (n) => String(n).padStart(2, '0')
export const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Whole days from a to b (YYYY-MM-DD). Uses UTC so DST and month ends cannot skew it. */
export function daysBetween(a, b) {
  const [ya, ma, da] = a.split('-').map(Number)
  const [yb, mb, db] = b.split('-').map(Number)
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000)
}

export function addDays(date, n) {
  const [y, m, d] = date.split('-').map(Number)
  return dateKey(new Date(y, m - 1, d + n))
}

export function createState(name, today, sprite = 'leafling') {
  return {
    version: 1,
    pet: { name, sprite, createdOn: today },
    xp: 0,
    health: START_HEALTH,
    lastOpenDate: today,
    days: {},
    counts: {},
    unlocked: [],
  }
}

const dayOf = (state, today) => state.days[today] ?? { habits: [], xp: 0, quiz: null }

export function checkUnlocks(state) {
  return accessories.filter((a) => (state.counts[a.habit] ?? 0) >= a.count).map((a) => a.id)
}

function award(state, today, habitId, xp, health, dayPatch = {}) {
  const day = dayOf(state, today)
  const next = {
    ...state,
    xp: state.xp + xp,
    health: Math.min(100, state.health + health),
    days: { ...state.days, [today]: { ...day, ...dayPatch, habits: [...day.habits, habitId], xp: day.xp + xp } },
    counts: { ...state.counts, [habitId]: (state.counts[habitId] ?? 0) + 1 },
  }
  next.unlocked = checkUnlocks(next)
  return next
}

/** Tick a habit once per day. Returns the same state object when refused. */
export function logHabit(state, habitId, today) {
  const habit = habitById(habitId)
  if (!habit || habitId === 'quiz') return state // quiz is ticked by answerQuiz
  if (dayOf(state, today).habits.includes(habitId)) return state
  return award(state, today, habitId, habit.xp, Math.ceil(habit.xp * 0.6))
}

/** One quiz answer per day. Correct: +10 XP, +6 health. Wrong: recorded, no reward. */
export function answerQuiz(state, choiceIndex, today, correctIndex) {
  const day = dayOf(state, today)
  if (day.quiz) return state
  if (choiceIndex !== correctIndex) {
    return { ...state, days: { ...state.days, [today]: { ...day, quiz: 'wrong' } } }
  }
  return award(state, today, 'quiz', QUIZ_XP, QUIZ_HEALTH, { quiz: 'correct' })
}

/** Apply daily decay for the days that passed. No-op if the date has not moved on. */
export function rollover(state, today) {
  const away = daysBetween(state.lastOpenDate, today)
  if (away <= 0) return state
  return {
    ...state,
    health: Math.max(MIN_HEALTH, state.health - DECAY_PER_DAY * away),
    lastOpenDate: today,
  }
}

/** Demo helper: add raw XP (no health). */
export function addXp(state, amount) {
  return { ...state, xp: state.xp + amount }
}

/** Which of today's habits are done, for the checklist. */
export const habitsDone = (state, today) => dayOf(state, today).habits
export const allHabitsDone = (state, today) => habitsDone(state, today).length >= habits.length
