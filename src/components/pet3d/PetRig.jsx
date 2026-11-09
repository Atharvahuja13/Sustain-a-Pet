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
const GLOW = new THREE.Color('#46ff86')
const ORBS = 9

// Fresnel rim: bright at the silhouette, transparent in the middle. Gives the power-up aura.
const auraMaterial = () => new THREE.ShaderMaterial({
  uniforms: { uColor: { value: GLOW.clone() }, uOpacity: { value: 0 } },
  vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = -mv.xyz; gl_Position = projectionMatrix*mv; }',
  fragmentShader: 'uniform vec3 uColor; uniform float uOpacity; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.4); gl_FragColor = vec4(uColor, f*uOpacity); }',
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
})
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

/**
 * Shared motion for every sprite: breathing, idle sway, look-at-pointer, tick bounce (spring + squash),
 * stage-up spin with a pop, a happy dance, and mood slump. `ctl` hands live values to the sprite parts.
 */
export default function PetRig({ stage, mood, fx = {}, reduced, position = [0, 0, 0], scale = 1, motion, children }) {
  const body = useRef(), halo = useRef()
  const ctl = useRef({ droop: 0, grey: 0, stage: 0 })
  const s = useRef({ y: 0, vy: 0, sc: STAGE_SCALE[stage] * 0.8, evolve: -1, dance: -1 })
  const haloMat = useRef()
  const aura = useRef(), light = useRef(), ring = useRef(), ringMat = useRef(), wave = useRef(), waveMat = useRef(), orbs = useRef([])
  const auraMat = useRef(null)
  if (!auraMat.current) auraMat.current = auraMaterial()
  const pw = useRef({ left: 0, p: 0, wave: -1 }) // power-up: seconds left, eased 0..1 strength, shockwave clock

  useChanged(fx.bounce, () => { if (!reduced) s.current.vy = 4.2 })
  useChanged(fx.evolve, () => { s.current.evolve = reduced ? 1.5 : 0 })
  useChanged(fx.power, () => {
    pw.current.left = Math.max(pw.current.left, fx.powerSecs ?? 5)
    pw.current.wave = 0
  })
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

    // walking: quick hop-bob with a side-to-side waddle, scaled by how fast the pet is moving
    const walk = reduced || !motion ? 0 : Math.min(1, motion.current.speed / 1.1) * (1 - pw.current.p)
    if (walk > 0.02) {
      const gait = motion.current.phase ?? 0
      hop += Math.abs(Math.sin(gait)) * 0.13 * walk
      rotZ += Math.sin(gait) * 0.07 * walk
    }
    const P = pw.current
    P.left = Math.max(0, P.left - dt)
    P.p = damp(P.p, P.left > 0 ? 1 : 0, P.left > 0 ? 4 : 2, dt)
    const pwr = P.p
    // floating: rise off the ground and bob; walking hops fade out while airborne
    hop += pwr * (0.7 + (reduced ? 0 : Math.sin(t * 2.4) * 0.09))
    rotZ += reduced ? 0 : Math.sin(t * 1.7) * 0.05 * pwr
    const breathe = reduced ? 0 : Math.sin(t * 1.7) * 0.022
    const target = STAGE_SCALE[stage] * 0.8 * scale
    st.sc = damp(st.sc, target, 5, dt)
    const slump = 1 - c.droop * 0.07
    const squash = st.vy * 0.022
    const g = body.current
    g.scale.set(st.sc * pop * (1 - breathe * 0.5 - squash * 0.6 + c.droop * 0.02), st.sc * pop * (1 + breathe + squash) * slump, st.sc * pop * (1 - breathe * 0.5))
    g.position.y = Math.max(0, st.y) + hop
    g.rotation.set(c.droop * 0.1, rotY, rotZ)

    // power-up visuals: green emissive body, fresnel aura, orbiting motes, ground ring, shockwave, green light
    ctl.current.glow = pwr
    if (pwr > 0.01 || P.lit) {
      P.lit = pwr > 0.01
      g.traverse((o) => {
        const m = o.material
        if (!m || !m.emissive || m.userData.noGlow) return
        m.userData.base ??= { c: m.emissive.clone(), i: m.emissiveIntensity }
        m.emissive.copy(m.userData.base.c).lerp(GLOW, pwr)
        m.emissiveIntensity = m.userData.base.i + pwr * 0.42 * (0.85 + (reduced ? 0 : Math.sin(t * 6) * 0.15))
      })
    }
    const pulse = reduced ? 1 : 0.85 + Math.sin(t * 5) * 0.15
    auraMat.current.uniforms.uOpacity.value = pwr * 0.85 * pulse
    aura.current.visible = pwr > 0.01
    aura.current.scale.setScalar(1 + (reduced ? 0 : Math.sin(t * 3) * 0.03))
    light.current.intensity = pwr * 7 * pulse
    ring.current.visible = pwr > 0.01
    ringMat.current.opacity = pwr * 0.5
    ring.current.scale.setScalar(st.sc * (1 + (reduced ? 0 : Math.sin(t * 3) * 0.08)))
    ring.current.rotation.z = t * 0.8
    orbs.current.forEach((o, i) => {
      if (!o) return
      o.visible = pwr > 0.02
      const a = (reduced ? 0 : t * 1.8) + (i / ORBS) * 6.283
      const rise = (((reduced ? 0 : t * 0.45) + i * 0.37) % 1)
      const r = (1.05 - rise * 0.35) * st.sc
      o.position.set(Math.cos(a) * r, (0.1 + rise * 2.0) * st.sc + hop * 0.5, Math.sin(a) * r)
      o.scale.setScalar(pwr * (1 - rise) * 0.09 * (0.7 + st.sc))
    })
    if (P.wave >= 0) {
      P.wave += dt
      const k = Math.min(1, P.wave / 0.9)
      wave.current.visible = true
      wave.current.scale.setScalar(0.4 + k * 4.2)
      waveMat.current.opacity = (1 - k) * 0.8
      if (k >= 1) { P.wave = -1; wave.current.visible = false }
    }

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
      <group ref={body}>
        {children(ctl)}
        <mesh ref={aura} position={[0, 1, 0]} visible={false} material={auraMat.current}><sphereGeometry args={[1.35, 40, 28]} /></mesh>
        <pointLight ref={light} color="#5dff8a" position={[0, 1.1, 0.6]} intensity={0} distance={7} decay={1.6} />
      </group>
      {Array.from({ length: ORBS }, (_, i) => (
        <mesh key={i} ref={(el) => (orbs.current[i] = el)} visible={false}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color={i % 2 ? '#b9ffcf' : '#46ff86'} toneMapped={false} />
        </mesh>
      ))}
      <mesh ref={ring} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.93, 1.02, 64]} />
        <meshBasicMaterial ref={ringMat} color="#46ff86" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={wave} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.9, 1.0, 64]} />
        <meshBasicMaterial ref={waveMat} color="#9dffc0" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={halo} position={[0, 1.2, -0.6]} visible={false}>
        <ringGeometry args={[0.8, 1.0, 64]} />
        <meshBasicMaterial ref={haloMat} color="#fff2a8" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
