import { describe, expect, it } from 'vitest'
import { addDays, answerQuiz, createState, logHabit, migrateState, rollover, taskCount } from '../src/engine.js'
import { buyDecor, claimGift, claimQuest, placeDecor, restore, selectPet, visitArea } from '../src/progression.js'
const D = '2026-11-15'
const fresh = () => createState('Pip', D)
const earn = (s, day) => {
  for (const id of ['walk', 'meat_free', 'bottle', 'lights', 'shower', 'sort', 'plate']) s = logHabit(s, id, day)
  return claimQuest(claimQuest(claimGift(answerQuiz(s, 0, day, 1), day), 'three', day), 'eight', day)
}
describe('garden progression', () => {
  it('migrates old saves without changing progress', () => {
    const old = { version: 1, pet: { name: 'Old', sprite: 'mossy' }, xp: 275, health: 54, days: { [D]: { habits: ['walk'] } }, counts: { walk: 7 }, unlocked: ['helmet'], lastOpenDate: D }
    const s = migrateState(old)
    expect(s.xp).toBe(275)
    expect(s.days).toBe(old.days)
    expect(s.coins).toBe(0)
    expect(s.activePet).toBe('mossy')
    expect(migrateState({ version: 1 })).toBeNull()
  })
  it('gifts are once a day, grow with streaks, reset after missed days', () => {
    const s = claimGift(fresh(), D)
    expect(claimGift(s, D)).toBe(s)
    expect(claimGift(s, addDays(D, -1))).toBe(s)
    expect(claimGift(s, addDays(D, 1)).coins).toBe(45)
    expect(claimGift(s, addDays(D, 3)).streak).toBe(1)
  })
  it('wrong quiz completes eight tasks without quiz XP or coins', () => {
    const s = earn(fresh(), D)
    expect(taskCount(s, D)).toBe(8)
    expect(s.xp).toBe(50)
    expect(s.coins).toBe(115)
    expect(claimQuest(s, 'eight', D)).toBe(s)
  })
  it('requires restoration before area unlocks and refuses duplicate spending', () => {
    let s = earn(fresh(), D)
    expect(visitArea(s, 'pond')).toBe(s)
    expect(restore(s, 'bridge')).toBe(s)
    s = restore(s, 'flowerbed')
    expect(restore(s, 'flowerbed')).toBe(s)
    s = visitArea(s, 'pond')
    expect(s.area).toBe('pond')
    expect(s.coins).toBe(25)
    expect(visitArea(s, 'pond')).toBe(s)
  })
  it('earned days 1–3 revive the grove and allow adoption with shared locks', () => {
    let s = visitArea(restore(earn(fresh(), D), 'flowerbed'), 'pond')
    s = visitArea(restore(earn(s, addDays(D, 1)), 'bridge'), 'grove')
    s = restore(earn(s, addDays(D, 2)), 'tree')
    expect(s.restored).toEqual(['flowerbed', 'bridge', 'tree'])
    s = selectPet(s, 'mossy', addDays(D, 2))
    expect(s.activePet).toBe('mossy')
    expect(s.xp).toBe(0)
    expect(s.health).toBe(80)
    expect(logHabit(s, 'walk', addDays(D, 2))).toBe(s)
    expect(selectPet(s, 'leafling', addDays(D, 2)).xp).toBe(150)
  })
  it('decays inactive pets once across switches and preserves independent health', () => {
    let s = { ...fresh(), coins: 100, health: 95 }
    s = selectPet(s, 'mossy', D)
    s = rollover(s, addDays(D, 2))
    expect(s.health).toBe(60)
    s = selectPet(s, 'leafling', addDays(D, 2))
    expect(s.health).toBe(75)
    s = rollover(s, addDays(D, 2))
    expect(selectPet(s, 'mossy', addDays(D, 2)).health).toBe(60)
  })
  it('places only owned decor, moves it and puts it away', () => {
    let s = fresh()
    expect(buyDecor(s, 'bench')).toBe(s)
    expect(placeDecor(s, 'bench', 'left')).toBe(s)
    s = buyDecor({ ...s, coins: 100 }, 'bench')
    expect(buyDecor(s, 'bench')).toBe(s)
    s = placeDecor(placeDecor(s, 'bench', 'left'), 'bench', 'right')
    expect(s.placements).toEqual({ 'meadow:right': 'bench' })
    expect(placeDecor(s, 'bench', 'invalid')).toBe(s)
    expect(placeDecor(s, 'bench', null).placements).toEqual({})
  })
})
