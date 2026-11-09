import { describe, it, expect } from 'vitest'
import {
  moodFor, stageFor, logHabit, answerQuiz, rollover, checkUnlocks, createState, addDays, daysBetween,
} from '../src/engine.js'

const D = '2026-11-10'
const fresh = () => createState('Pip', D)

describe('moodFor', () => {
  it.each([[100, 'Thriving'], [75, 'Thriving'], [74, 'Okay'], [40, 'Okay'], [39, 'Wilting'], [15, 'Wilting'], [14, 'Sick'], [10, 'Sick']])(
    '%i is %s', (h, m) => expect(moodFor(h)).toBe(m))
})

describe('stageFor', () => {
  it.each([[0, 'Seed'], [59, 'Seed'], [60, 'Sprout'], [249, 'Sprout'], [250, 'Sapling'], [599, 'Sapling'], [600, 'Guardian']])(
    '%i is %s', (x, s) => expect(stageFor(x)).toBe(s))
})

describe('logHabit', () => {
  it('adds xp, health, counts and day record', () => {
    const s = logHabit({ ...fresh(), health: 50 }, 'walk', D)
    expect(s.xp).toBe(15)
    expect(s.health).toBe(59)
    expect(s.counts.walk).toBe(1)
    expect(s.days[D].habits).toEqual(['walk'])
  })
  it('refuses a repeat on the same day', () => {
    const once = logHabit(fresh(), 'bottle', D)
    expect(logHabit(once, 'bottle', D)).toBe(once)
  })
  it('allows the same habit on the next day', () => {
    const s = logHabit(logHabit(fresh(), 'bottle', D), 'bottle', addDays(D, 1))
    expect(s.counts.bottle).toBe(2)
  })
  it('never exceeds 100 health', () => {
    expect(logHabit({ ...fresh(), health: 100 }, 'walk', D).health).toBe(100)
    expect(logHabit({ ...fresh(), health: 98 }, 'bottle', D).health).toBe(100)
  })
  it('5 xp habit gives +3 health, quiz habit id is refused', () => {
    expect(logHabit({ ...fresh(), health: 50 }, 'lights', D).health).toBe(53)
    const s = fresh()
    expect(logHabit(s, 'quiz', D)).toBe(s)
    expect(logHabit(s, 'nope', D)).toBe(s)
  })
})

describe('rollover', () => {
  it('health 50 after 2 missed days is 30', () => {
    expect(rollover({ ...fresh(), health: 50 }, addDays(D, 2)).health).toBe(30)
  })
  it('new pet is 70 (Okay) the next day', () => {
    expect(moodFor(rollover(fresh(), addDays(D, 1)).health)).toBe('Okay')
    expect(rollover(fresh(), addDays(D, 1)).health).toBe(70)
  })
  it('never goes below 10', () => {
    expect(rollover(fresh(), addDays(D, 30)).health).toBe(10)
  })
  it('same date, or a date in the past, does nothing', () => {
    const s = fresh()
    expect(rollover(s, D)).toBe(s)
    expect(rollover(s, addDays(D, -1))).toBe(s)
  })
  it('keeps xp and sets lastOpenDate', () => {
    const s = rollover({ ...fresh(), xp: 300 }, addDays(D, 3))
    expect(s.xp).toBe(300)
    expect(s.lastOpenDate).toBe(addDays(D, 3))
  })
})

describe('dates', () => {
  it('crosses month and year ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1)
  })
})

describe('answerQuiz', () => {
  it('correct answer: +10 xp, +6 health, once a day', () => {
    const base = { ...fresh(), health: 50 }
    const s = answerQuiz(base, 1, D, 1)
    expect(s.xp).toBe(10)
    expect(s.health).toBe(56)
    expect(s.days[D].quiz).toBe('correct')
    expect(answerQuiz(s, 1, D, 1)).toBe(s)
  })
  it('wrong answer: recorded, no reward, no retry', () => {
    const s = answerQuiz(fresh(), 0, D, 1)
    expect(s.xp).toBe(0)
    expect(s.days[D].quiz).toBe('wrong')
    expect(answerQuiz(s, 1, D, 1)).toBe(s)
  })
})

describe('checkUnlocks', () => {
  it('fires on the 7th tick, not the 6th', () => {
    let s = fresh()
    for (let i = 0; i < 6; i++) s = logHabit(s, 'walk', addDays(D, i))
    expect(checkUnlocks(s)).not.toContain('helmet')
    s = logHabit(s, 'walk', addDays(D, 6))
    expect(checkUnlocks(s)).toContain('helmet')
    expect(s.unlocked).toContain('helmet')
  })
})
