import { describe, expect, it } from 'vitest'
import {
  IDLE_SPEED, MAX_PLAYBACK_RATE, MIN_PLAYBACK_RATE, WALK_VOLUME,
  footfallsBetween, grainGainForRms, isWalking, MAX_GRAIN_GAIN,
  playbackRateForSpeed, volumeForSpeed,
} from '../src/walkingAudio.js'

describe('walking audio mapping', () => {
  it('keeps playback natural and scales it with pet speed', () => {
    expect(playbackRateForSpeed(0)).toBe(MIN_PLAYBACK_RATE)
    expect(playbackRateForSpeed(0.45)).toBe(MIN_PLAYBACK_RATE)
    expect(playbackRateForSpeed(0.8)).toBeGreaterThan(playbackRateForSpeed(0.45))
    expect(playbackRateForSpeed(1.1)).toBe(MAX_PLAYBACK_RATE)
    expect(playbackRateForSpeed(5)).toBe(MAX_PLAYBACK_RATE)
  })

  it('fades in from idle to a capped walking volume', () => {
    expect(volumeForSpeed(0)).toBe(0)
    expect(volumeForSpeed(IDLE_SPEED)).toBe(0)
    expect(volumeForSpeed(0.2)).toBe(WALK_VOLUME)
    expect(volumeForSpeed(1.1)).toBe(WALK_VOLUME)
    expect(volumeForSpeed(0.2, false)).toBe(0)
  })

  it('treats only positive motion above the idle threshold as walking', () => {
    expect(isWalking(0)).toBe(false)
    expect(isWalking(IDLE_SPEED)).toBe(false)
    expect(isWalking(0.45)).toBe(true)
    expect(isWalking(Number.NaN)).toBe(false)
  })
})

describe('footfall event gating', () => {
  const ready = { enabled: true, visible: true, moving: true, unlocked: true }

  it('emits once for each newly observed step and deduplicates repeated counts', () => {
    expect(footfallsBetween(4, 5, ready)).toBe(1)
    expect(footfallsBetween(5, 5, ready)).toBe(0)
    expect(footfallsBetween(5, 7, ready)).toBe(2)
  })

  it.each([
    ['disabled', { enabled: false }],
    ['hidden', { visible: false }],
    ['idle', { moving: false }],
    ['locked', { unlocked: false }],
  ])('suppresses new footfalls while %s', (_reason, gate) => {
    expect(footfallsBetween(2, 3, { ...ready, ...gate })).toBe(0)
  })

  it('ignores backwards or invalid counters', () => {
    expect(footfallsBetween(4, 3, ready)).toBe(0)
    expect(footfallsBetween(4, Number.NaN, ready)).toBe(0)
  })
})

describe('leaf grain level', () => {
  it('normalizes quiet source segments to a consistent bounded gain', () => {
    expect(grainGainForRms(0.005)).toBe(3)
    expect(grainGainForRms(0.0125)).toBe(2)
    expect(grainGainForRms(0.05)).toBe(0.5)
    expect(grainGainForRms(0)).toBe(MAX_GRAIN_GAIN)
  })
})
