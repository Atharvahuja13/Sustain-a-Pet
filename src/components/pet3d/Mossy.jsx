import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Face from './Face.jsx'
import { damp } from './shared.js'

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra })

// Moss bumps scattered over the top of the body (deterministic so renders never jump).
const BUMPS = Array.from({ length: 18 }, (_, i) => {
  const a = i * 2.399963 // golden angle
  const r = 0.18 + 0.62 * Math.sqrt((i + 0.5) / 18)
  return { x: Math.cos(a) * r * 0.95, z: Math.sin(a) * r * 0.8 - 0.15, s: 0.1 + ((i * 37) % 7) * 0.012 }
})
const MUSHROOMS = [
  { x: -0.38, z: -0.2, h: 0.34, r: 0.3, from: 0, tilt: 0.25 },
  { x: 0.42, z: -0.32, h: 0.26, r: 0.24, from: 1, tilt: -0.3 },
  { x: 0.05, z: -0.55, h: 0.42, r: 0.34, from: 2, tilt: 0.1 },
]
const FLOWERS = Array.from({ length: 6 }, (_, i) => ({ a: (i / 6) * Math.PI * 2 }))

function Mushroom({ m, show, mats, ctl }) {
  const g = useRef(), cap = useRef(), cur = useRef(0)
  useFrame((_, dt) => {
    cur.current = damp(cur.current, show ? 1 : 0, 6, dt)
    g.current.scale.setScalar(Math.max(0.0001, cur.current))
    g.current.visible = cur.current > 0.01
    cap.current.rotation.z = m.tilt * (0.3 + ctl.current.droop * 1.6)
  })
  return (
    <group ref={g} position={[m.x, 1.42, m.z]}>
      <mesh material={mats.stem} position={[0, m.h / 2, 0]} castShadow><cylinderGeometry args={[0.07, 0.09, m.h, 20]} /></mesh>
      <group ref={cap} position={[0, m.h, 0]}>
        <mesh material={mats.cap} scale={[1, 0.62, 1]} castShadow><sphereGeometry args={[m.r, 36, 20, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        {[[0.1, 0.2, 0.06], [-0.12, 0.17, 0.1], [0.02, 0.1, -0.16], [0.18, 0.1, -0.1]].map((d, i) => (
          <mesh key={i} material={mats.dot} position={[d[0] * (m.r / 0.3), d[1] * (m.r / 0.3) * 0.9, d[2] * (m.r / 0.3)]}>
            <sphereGeometry args={[0.04 * (m.r / 0.3), 12, 10]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export default function Mossy({ ctl, stage, mood, reduced }) {
  const mats = useMemo(() => ({
    body: std('#7fc47a', { roughness: 0.8 }), moss: std('#4f9a55', { roughness: 0.95 }), belly: std('#cfeab0'),
    stem: std('#f4ead2'), cap: std('#e8604c', { roughness: 0.4 }), dot: std('#fff7ea', { roughness: 0.5 }),
    flower: std('#fff7ea', { roughness: 0.5 }), core: std('#ffcf4a', { roughness: 0.4 }),
  }), [])
  const base = useMemo(() => ({ body: new THREE.Color('#7fc47a'), moss: new THREE.Color('#4f9a55'), cap: new THREE.Color('#e8604c') }), [])
  const grey = useMemo(() => ({ body: new THREE.Color('#9ba68c'), moss: new THREE.Color('#7b8a6c'), cap: new THREE.Color('#b7897f') }), [])
  useFrame(() => {
    for (const k of ['body', 'moss', 'cap']) mats[k].color.copy(base[k]).lerp(grey[k], ctl.current.grey)
  })
  const bumpCount = [6, 10, 14, 18][stage]

  return (
    <group>
      <mesh material={mats.body} position={[0, 0.72, 0]} scale={[1.12, 0.84, 0.98]} castShadow>
        <sphereGeometry args={[0.88, 64, 48]} />
      </mesh>
      <mesh material={mats.belly} position={[0, 0.5, 0.58]} scale={[0.86, 0.6, 0.45]}><sphereGeometry args={[0.55, 40, 28]} /></mesh>
      {BUMPS.slice(0, bumpCount).map((b, i) => (
        <mesh key={i} material={mats.moss} position={[b.x, 1.3 - (b.x * b.x * 0.18 + b.z * b.z * 0.28), b.z]} scale={[1.4, 0.8, 1.3]}>
          <sphereGeometry args={[b.s * 1.6, 18, 14]} />
        </mesh>
      ))}
      {[-1, 1].map((x) => (
        <mesh key={x} material={mats.body} position={[x * 0.42, 0.1, 0.4]} scale={[1.1, 0.6, 1.3]} castShadow><sphereGeometry args={[0.21, 24, 18]} /></mesh>
      ))}
      <Face mood={mood} y={0.8} z={0.84} size={1.1} spread={0.34} reduced={reduced} />
      {MUSHROOMS.map((m, i) => <Mushroom key={i} m={m} show={stage >= m.from} mats={mats} ctl={ctl} />)}
      {FLOWERS.map((f, i) => (
        <group key={i} position={[Math.sin(f.a) * 0.68, 1.12, Math.cos(f.a) * 0.55]} scale={stage >= 3 ? 1 : 0.0001} visible={stage >= 3}>
          {[0, 1, 2, 3, 4].map((p) => (
            <mesh key={p} material={mats.flower} position={[Math.cos((p / 5) * 6.283) * 0.07, Math.sin((p / 5) * 6.283) * 0.07 + 0.05, 0]}>
              <sphereGeometry args={[0.055, 12, 10]} />
            </mesh>
          ))}
          <mesh material={mats.core} position={[0, 0.05, 0.02]}><sphereGeometry args={[0.04, 12, 10]} /></mesh>
        </group>
      ))}
    </group>
  )
}
