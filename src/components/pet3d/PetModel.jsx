import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import PetRig from './PetRig.jsx'
import Burst from './Burst.jsx'
import Leafling from './Leafling.jsx'
import Mossy from './Mossy.jsx'
import Sunbud from './Sunbud.jsx'
import { ISLAND } from './World.jsx'

const BODIES = { leafling: Leafling, mossy: Mossy, sunbud: Sunbud }
const SPEED = { Thriving: 1.1, Okay: 0.8, Wilting: 0.45, Sick: 0 }

/**
 * Moves the pet around its world. It wanders to random spots, walks where you tap, and turns to
 * face the camera when idle. Position is shared through `ctl.current.pos` so the camera can follow.
 */
function Wanderer({ ctl, mood, reduced, motion, children }) {
  const g = useRef()
  const st = useRef({ x: 0, z: 0.4, heading: 0, goal: null, idle: 2.5, speed: 0, hold: 0 })
  const { camera } = useThree()

  useEffect(() => {
    const c = ctl.current
    c.goTo = (x, z) => { if (SPEED[mood] > 0) { st.current.goal = { x, z }; st.current.hold = 0 } }
    c.hold = (s) => { st.current.goal = null; st.current.hold = s }
  }, [ctl, mood])

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05)
    const s = st.current, max = SPEED[mood]
    if (s.hold > 0) s.hold -= dt
    if (!s.goal && s.hold <= 0 && max > 0 && !reduced) {
      s.idle -= dt
      if (s.idle <= 0) {
        const a = Math.random() * 6.283, d = 1 + Math.random() * (ISLAND - 1.2)
        s.goal = { x: Math.cos(a) * d, z: Math.sin(a) * d }
      }
    }
    let target = s.heading
    if (s.goal) {
      const dx = s.goal.x - s.x, dz = s.goal.z - s.z, dist = Math.hypot(dx, dz)
      if (dist < 0.1) { s.goal = null; s.idle = 2 + Math.random() * 4; s.speed = 0 }
      else {
        target = Math.atan2(dx, dz)
        const want = max * Math.min(1, dist / 0.6 + 0.35)
        s.speed = damp(s.speed, want, 6, dt)
        s.x += (dx / dist) * s.speed * dt
        s.z += (dz / dist) * s.speed * dt
      }
    } else {
      s.speed = damp(s.speed, 0, 8, dt)
      target = Math.atan2(camera.position.x - s.x, camera.position.z - s.z) // face the viewer when idle
    }
    const diff = ((target - s.heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI
    s.heading += diff * Math.min(1, dt * 6)
    g.current.position.set(s.x, 0, s.z)
    g.current.rotation.y = s.heading
    motion.current.speed = s.speed
    ctl.current.pos.set(s.x, 0, s.z)
  })
  return <group ref={g}>{children}</group>
}
const damp = THREE.MathUtils.damp

/** One pet (no canvas): sprite model, shared motion rig and reward bursts. With `ctl` it roams the world. */
export default function PetModel({ sprite = 'leafling', stage = 0, mood = 'Thriving', fx = {}, reduced = false, position, scale, ctl, onPat }) {
  const Body = BODIES[sprite] ?? Leafling
  const motion = useRef({ speed: 0 })
  const inner = (
    <>
      <group
        onClick={onPat ? (e) => { if (e.delta < 6) { e.stopPropagation(); onPat() } } : undefined}
        onPointerOver={onPat ? () => (document.body.style.cursor = 'pointer') : undefined}
        onPointerOut={onPat ? () => (document.body.style.cursor = '') : undefined}
      >
        <PetRig stage={stage} mood={mood} fx={fx} reduced={reduced} scale={scale} motion={motion}>
          {(c) => <Body ctl={c} stage={stage} mood={mood} reduced={reduced} />}
        </PetRig>
      </group>
      <Burst kind="leaves" burstKey={fx.leaves} reduced={reduced} origin={[0, 1.4, 0.4]} />
      <Burst kind="confetti" burstKey={fx.confetti} reduced={reduced} origin={[0, 1.2, 0.5]} />
      <Burst kind="sparkle" burstKey={fx.sparkle} reduced={reduced} origin={[0, 1.4, 0.4]} />
    </>
  )
  return (
    <group position={position}>
      {ctl ? <Wanderer ctl={ctl} mood={mood} reduced={reduced} motion={motion}>{inner}</Wanderer> : inner}
    </group>
  )
}
