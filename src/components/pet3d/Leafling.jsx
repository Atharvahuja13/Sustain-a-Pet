import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Face from './Face.jsx'
import Leaf from './Leaf.jsx'
import { makeLeafGeometry, mix, gummy } from './shared.js'

const std = (color, extra = {}) => gummy(color, extra)

// Head leaves: [angle(rad), size, show-from-stage]. Seed 1, Sprout 2, Sapling 3 (Guardian keeps 3 and adds a crown).
const HEAD_LEAVES = [
  { a: 0, s: 0.9, from: 0, side: 0 },
  { a: -0.62, s: 0.78, from: 1, side: -1 },
  { a: 0.62, s: 0.78, from: 2, side: 1 },
]
const CROWN = Array.from({ length: 7 }, (_, i) => ({ a: (i / 7) * Math.PI * 2 }))

export default function Leafling({ ctl, stage, mood, reduced }) {
  const geo = useMemo(makeLeafGeometry, [])
  const mats = useMemo(() => ({
    body: std('#78d96e', { roughness: 0.5 }),
    belly: std('#d9f7b8', { roughness: 0.7 }),
    leaf: std('#2fb35e', { roughness: 0.45 }),
    crown: std('#ffd34e', { roughness: 0.35, metalness: 0.2 }),
  }), [])
  const base = useMemo(() => ({ body: new THREE.Color('#78d96e'), leaf: new THREE.Color('#2fb35e'), belly: new THREE.Color('#d9f7b8') }), [])
  const grey = useMemo(() => ({ body: new THREE.Color('#a4b08f'), leaf: new THREE.Color('#7e8c6b'), belly: new THREE.Color('#cbd0b8') }), [])

  useFrame(() => {
    const k = ctl.current.grey
    for (const key of ['body', 'leaf', 'belly']) mats[key].color.copy(base[key]).lerp(grey[key], k)
  })

  return (
    <group>
      {/* body: soft egg */}
      <mesh material={mats.body} position={[0, 0.82, 0]} scale={[1.08, 1, 0.97]} castShadow>
        <sphereGeometry args={[0.8, 96, 72]} />
      </mesh>
      <mesh material={mats.belly} position={[0, 0.6, 0.55]} scale={[0.86, 0.8, 0.46]}>
        <sphereGeometry args={[0.52, 48, 36]} />
      </mesh>
      {/* feet and arms */}
      {[-1, 1].map((x) => (
        <group key={x}>
          <mesh material={mats.body} position={[x * 0.34, 0.1, 0.32]} scale={[1, 0.6, 1.25]} castShadow><sphereGeometry args={[0.2, 24, 18]} /></mesh>
          <mesh material={mats.body} position={[x * 0.8, 0.7, 0.12]} rotation={[0, 0, -x * 0.5]} scale={[0.7, 1, 0.7]} castShadow><sphereGeometry args={[0.17, 24, 18]} /></mesh>
        </group>
      ))}
      <Face mood={mood} y={0.96} z={0.73} size={1.12} spread={0.36} reduced={reduced} />

      {/* head leaves */}
      {HEAD_LEAVES.map((l, i) => (
        <Leaf key={i} geometry={geo} material={mats.leaf} show={stage >= l.from} scale={0.78 * l.s * 1.4}
          position={[l.side * 0.1, 1.62, 0]} rotation={[0, 0, -l.a]} droop={['z', l.side === 0 ? 0 : l.side * -1.15]} ctl={ctl} />
      ))}
      {/* the centre leaf droops forward instead, handled by the rig's slump */}

      {/* Guardian crown: ring of small leaves around the head */}
      {CROWN.map((c, i) => (
        <Leaf key={i} geometry={geo} material={mats.crown} show={stage >= 3} scale={0.5}
          position={[Math.sin(c.a) * 0.5, 1.5, Math.cos(c.a) * 0.42 - 0.12]} rotation={[Math.cos(c.a) * 0.5, c.a, -Math.sin(c.a) * 0.5]} />
      ))}
    </group>
  )
}
