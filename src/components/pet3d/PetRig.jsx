import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { damp, MOODS, STAGE_SCALE } from './shared.js'

const useChanged = (value, fn) => {
  const prev = useRef(value) // compare, not a first-run flag: StrictMode re-runs effects on mount
  useEffect(() => {
    if (prev.current === value) return
    prev.current = value
    fn()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
}
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

/**
 * Shared motion for every sprite: breathing, idle sway, look-at-pointer, tick bounce (spring + squash),
 * stage-up spin with a pop, a happy dance, and mood slump. `ctl` hands live values to the sprite parts.
 */
export default function PetRig({ stage, mood, fx = {}, reduced, position = [0, 0, 0], scale = 1, children }) {
  const body = useRef(), halo = useRef()
  const ctl = useRef({ droop: 0, grey: 0, stage: 0 })
  const s = useRef({ y: 0, vy: 0, sc: STAGE_SCALE[stage] * 0.8, evolve: -1, dance: -1 })
  const haloMat = useRef()

  useChanged(fx.bounce, () => { if (!reduced) s.current.vy = 4.2 })
  useChanged(fx.evolve, () => { s.current.evolve = reduced ? 1.5 : 0 })
  useChanged(fx.dance, () => { if (!reduced) s.current.dance = 0 })

  useFrame((state, dt) => {
    dt = Math.min(dt, 0.05)
    const st = s.current, t = state.clock.elapsedTime, m = MOODS[mood], c = ctl.current
    c.droop = damp(c.droop, m.droop, 4, dt)
    c.grey = damp(c.grey, m.grey, 3, dt)
    c.stage = stage

    // jump spring
    st.vy += (-70 * st.y - 7.5 * st.vy) * dt
    st.y += st.vy * dt

    let rotY = reduced ? 0 : Math.sin(t * 0.55) * 0.1 + state.pointer.x * 0.35
    let rotZ = 0, hop = 0, pop = 1
    if (st.evolve >= 0) {
      st.evolve += dt
      const k = Math.min(st.evolve / 1.6, 1)
      if (!reduced) rotY += easeInOut(k) * Math.PI * 2
      pop = 1 + Math.sin(k * Math.PI) * 0.35
      if (st.evolve > 1.6) st.evolve = -1
    }
    if (st.dance >= 0) {
      st.dance += dt
      rotZ = Math.sin(st.dance * 10) * 0.14
      hop = Math.abs(Math.sin(st.dance * 6.5)) * 0.28
      rotY += Math.sin(st.dance * 5) * 0.4
      if (st.dance > 2.8) st.dance = -1
    }

    const breathe = reduced ? 0 : Math.sin(t * 1.7) * 0.022
    const target = STAGE_SCALE[stage] * 0.8 * scale
    st.sc = damp(st.sc, target, 5, dt)
    const slump = 1 - c.droop * 0.07
    const squash = st.vy * 0.022
    const g = body.current
    g.scale.set(st.sc * pop * (1 - breathe * 0.5 - squash * 0.6 + c.droop * 0.02), st.sc * pop * (1 + breathe + squash) * slump, st.sc * pop * (1 - breathe * 0.5))
    g.position.y = Math.max(0, st.y) + hop
    g.rotation.set(c.droop * 0.1, rotY, rotZ)

    // evolve halo
    if (halo.current) {
      const k = st.evolve < 0 ? 0 : Math.sin(Math.min(st.evolve / 1.6, 1) * Math.PI)
      halo.current.visible = k > 0.01
      haloMat.current.opacity = k * 0.6
      halo.current.scale.setScalar(1.6 + k * 1.4)
      halo.current.rotation.z = t * 2
    }
  })

  return (
    <group position={position}>
      <group ref={body}>{children(ctl)}</group>
      <mesh ref={halo} position={[0, 1.2, -0.6]} visible={false}>
        <ringGeometry args={[0.8, 1.0, 64]} />
        <meshBasicMaterial ref={haloMat} color="#fff2a8" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
