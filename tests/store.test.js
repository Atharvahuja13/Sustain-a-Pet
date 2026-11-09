import { describe, it, expect } from 'vitest'
import { reduce } from '../src/store.js'

const empty = { real: null, demo: null, offset: 0, inDemo: false, events: [], awayDays: 0, nonce: 0 }
const hatched = () => reduce(empty, { type: 'hatch', name: '  Pip  ', sprite: 'mossy' })
const types = (app) => app.events.map((e) => e.type)

describe('store reducer', () => {
  it('hatch trims and caps name at 20, keeps sprite', () => {
    const a = reduce(empty, { type: 'hatch', name: 'x'.repeat(40), sprite: 'sunbud' })
    expect(a.real.pet.name).toHaveLength(20)
    expect(a.real.pet.sprite).toBe('sunbud')
  })
  it('tick emits a tick event with xp, and a repeat emits nothing new', () => {
    const a = reduce(hatched(), { type: 'tick', id: 'walk' })
    expect(types(a)).toContain('tick')
    expect(a.events[0].xp).toBe(15)
    const b = reduce(a, { type: 'tick', id: 'walk' })
    expect(b).toBe(a)
  })
  it('demo never touches the real pet', () => {
    let a = reduce(hatched(), { type: 'enterDemo' })
    const realBefore = a.real
    a = reduce(a, { type: 'addXp', amount: 50 })
    a = reduce(a, { type: 'skipDay', days: 3 })
    expect(a.real).toBe(realBefore)
    expect(a.demo.xp).toBe(50)
    expect(a.demo.health).toBe(50)
  })
  it('demo: 3 days wilts, ticks recover, xp evolves, reset restores', () => {
    let a = reduce(hatched(), { type: 'enterDemo' })
    a = reduce(a, { type: 'skipDay', days: 3 })
    expect(types(a)).toContain('mood')
    expect(a.awayDays).toBe(3)
    a = reduce(a, { type: 'tick', id: 'walk' })
    expect(a.demo.health).toBe(59)
    a = reduce(a, { type: 'addXp', amount: 60 })
    expect(types(a)).toContain('stageUp')
    a = reduce(a, { type: 'resetDemo' })
    expect(a.demo.xp).toBe(0)
    expect(a.offset).toBe(0)
  })
  it('skipDay ignored outside demo', () => {
    const a = hatched()
    expect(reduce(a, { type: 'skipDay', days: 1 })).toBe(a)
  })
})
