export const MIN_WALK_SPEED = 0.45
export const MAX_WALK_SPEED = 1.1
export const MIN_PLAYBACK_RATE = 0.72
export const MAX_PLAYBACK_RATE = 1.08
export const FULL_VOLUME_SPEED = 0.2
export const IDLE_SPEED = 0.035
export const WALK_VOLUME = 0.24
export const GRAIN_TARGET_RMS = 0.025
export const MAX_GRAIN_GAIN = 3
export const LEAF_GRAIN_OFFSETS = [1.9, 3.5, 4.2, 4.9, 5.55, 10.25, 10.95, 11.75]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/** Map world units per second to a natural playback rate for the leaf loop. */
export function playbackRateForSpeed(speed) {
  const value = Number.isFinite(speed) ? speed : 0
  const t = clamp((value - MIN_WALK_SPEED) / (MAX_WALK_SPEED - MIN_WALK_SPEED), 0, 1)
  return MIN_PLAYBACK_RATE + (MAX_PLAYBACK_RATE - MIN_PLAYBACK_RATE) * t
}

/** Fade in over the start of a walk, and return to silence at rest. */
export function volumeForSpeed(speed, enabled = true) {
  if (!enabled || !Number.isFinite(speed) || speed <= IDLE_SPEED) return 0
  const t = clamp((speed - IDLE_SPEED) / (FULL_VOLUME_SPEED - IDLE_SPEED), 0, 1)
  return WALK_VOLUME * t
}

export function isWalking(speed) {
  return Number.isFinite(speed) && speed > IDLE_SPEED
}

/** Count new contacts without replaying a step already handled last frame. */
export function footfallsBetween(previous, current, { enabled, visible, moving, unlocked }) {
  const before = Number.isFinite(previous) ? Math.floor(previous) : 0
  const after = Number.isFinite(current) ? Math.floor(current) : before
  if (!enabled || !visible || !moving || !unlocked || after <= before) return 0
  return after - before
}

/** Raise quiet source grains to a consistent level without unbounded gain. */
export function grainGainForRms(rms) {
  if (!Number.isFinite(rms) || rms <= 0) return MAX_GRAIN_GAIN
  return Math.min(MAX_GRAIN_GAIN, GRAIN_TARGET_RMS / rms)
}
