import { useEffect, useRef } from 'react'
import {
  footfallsBetween, grainGainForRms, isWalking, LEAF_GRAIN_OFFSETS, playbackRateForSpeed,
} from '../walkingAudio.js'

const SOURCE = '/audio/autumn-leaf-steps.m4a'
const GRAIN_SECONDS = 0.32

/** Play a short leaf crunch at each foot contact in the live movement ref. */
export default function LeafFootsteps({ movement, enabled = true }) {
  const audioRef = useRef(null)
  const enabledRef = useRef(enabled)
  useEffect(() => { enabledRef.current = enabled }, [enabled])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    let context = null
    let bufferPromise = null
    let buffer = null
    let unlocked = false
    let frame = 0
    let lastStepCount = movement?.current?.stepCount ?? 0
    const active = new Set()
    let contextStateListener = null
    const updateActiveCount = () => { audio.dataset.activeGrains = String(active.size) }

    const loadBuffer = () => {
      if (!context) {
        context = AudioContextClass ? new AudioContextClass() : null
        if (context) {
          audio.dataset.contextState = context.state
          contextStateListener = () => { audio.dataset.contextState = context.state }
          context.addEventListener('statechange', contextStateListener)
        }
      }
      if (!context) return Promise.resolve(null)
      if (!bufferPromise) {
        bufferPromise = fetch(audio.src)
          .then((response) => {
            if (!response.ok) throw new Error(`Audio request failed: ${response.status}`)
            return response.arrayBuffer()
          })
          .then((data) => context.decodeAudioData(data))
          .then((decoded) => { buffer = decoded; return decoded })
          .catch(() => null)
      }
      return bufferPromise
    }

    // Fetch/decode ahead of the first step. The context stays suspended until
    // a trusted gesture resumes it, so this never starts sound on page load.
    void loadBuffer()

    const stopActive = () => {
      if (!context) return
      const now = context.currentTime
      for (const { source, gain } of active) {
        try {
          gain.gain.cancelScheduledValues(now)
          gain.gain.setValueAtTime(gain.gain.value, now)
          gain.gain.linearRampToValueAtTime(0, now + 0.012)
          source.stop(now + 0.014)
        } catch { /* The grain may already have ended. */ }
      }
      active.clear()
      updateActiveCount()
    }

    const rmsForGrain = (offset) => {
      const stride = 8
      let squareSum = 0
      let sampleCount = 0
      for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
        const samples = buffer.getChannelData(channel)
        const start = Math.floor(offset * buffer.sampleRate)
        const end = Math.min(samples.length, Math.floor((offset + GRAIN_SECONDS) * buffer.sampleRate))
        for (let index = start; index < end; index += stride) {
          squareSum += samples[index] * samples[index]
          sampleCount += 1
        }
      }
      return sampleCount ? Math.sqrt(squareSum / sampleCount) : 0
    }

    const playGrain = (stepNumber, rate) => {
      if (!context || !buffer || context.state !== 'running') return
      const offset = LEAF_GRAIN_OFFSETS[Math.abs(stepNumber) % LEAF_GRAIN_OFFSETS.length]
      const amplitude = grainGainForRms(rmsForGrain(offset))
      const source = context.createBufferSource()
      const gain = context.createGain()
      const duration = GRAIN_SECONDS / rate
      const now = context.currentTime
      source.buffer = buffer
      source.playbackRate.setValueAtTime(rate, now)
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(amplitude, now + 0.012)
      gain.gain.setValueAtTime(amplitude, now + Math.max(0.013, duration - 0.035))
      gain.gain.linearRampToValueAtTime(0, now + duration)
      source.connect(gain)
      gain.connect(context.destination)
      const grain = { source, gain }
      source.onended = () => {
        active.delete(grain)
        updateActiveCount()
        source.disconnect()
        gain.disconnect()
      }
      try {
        source.start(now, offset, GRAIN_SECONDS)
        active.add(grain)
        audio.dataset.footstepsPlayed = String(Number(audio.dataset.footstepsPlayed || 0) + 1)
        audio.dataset.lastRate = String(rate)
        updateActiveCount()
      } catch {
        source.disconnect()
        gain.disconnect()
      }
    }

    const unlock = (event) => {
      if (!event.isTrusted || !enabledRef.current || document.hidden || !context) return
      // resume() is invoked in the trusted event callback for WebKit activation.
      try {
        context.resume().then(() => {
          unlocked = true
          audio.dataset.contextState = context.state
        }).catch(() => { unlocked = false })
      } catch {
        unlocked = false
      }
    }

    const handleVisibility = () => {
      if (document.hidden) stopActive()
    }
    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('keydown', unlock)
    document.addEventListener('visibilitychange', handleVisibility)

    const tick = () => {
      const state = movement?.current
      const speed = state?.speed ?? 0
      if (!enabledRef.current || document.hidden) stopActive()
      const stepCount = state?.stepCount ?? lastStepCount
      const count = footfallsBetween(lastStepCount, stepCount, {
        enabled: enabledRef.current,
        visible: !document.hidden,
        moving: isWalking(speed),
        unlocked,
      })
      lastStepCount = Number.isFinite(stepCount) ? stepCount : lastStepCount
      if (count && buffer && context?.state === 'running') {
        const firstStep = Math.floor(stepCount) - count + 1
        const rate = playbackRateForSpeed(speed)
        for (let index = 0; index < count; index += 1) playGrain(firstStep + index, rate)
      }
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      document.removeEventListener('visibilitychange', handleVisibility)
      stopActive()
      if (context && contextStateListener) context.removeEventListener('statechange', contextStateListener)
      if (context && context.state !== 'closed') context.close().catch(() => {})
    }
  }, [movement])

  return (
    <audio
      ref={audioRef}
      src={SOURCE}
      preload="metadata"
      aria-hidden="true"
      data-context-state="uninitialized"
      data-footsteps-played="0"
      data-last-rate="1"
      data-active-grains="0"
    />
  )
}
