import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Face from './Face.jsx'
import Leaf from './Leaf.jsx'
import { damp, makeLeafGeometry, gummy } from './shared.js'

const std = (color, extra = {}) => gummy(color, extra)
const PETALS = [8, 10, 12, 14]
const HEAD_Y = 1.3

function Petals({ stage, mat, ctl }) {
  const group = useRef()
  const items = useRef([])
  const count = PETALS[stage]
  const vis = useRef(new Array(14).fill(0))
  useFrame((_, dt) => {
    items.current.forEach((m, i) => {
      if (!m) return
      vis.current[i] = damp(vis.current[i], i < count ? 1 : 0, 6, dt)
      const k = Math.max(0.0001, vis.current[i])
      // petals fold back and shrink as health falls
      const fold = 1 - ctl.current.droop * 0.45
      m.scale.set(0.2 * k * fold, 0.38 * k * fold, 0.09 * k)
      m.visible = vis.current[i] > 0.01
    })
  })
  return (
    <group ref={group} position={[0, HEAD_Y, -0.12]}>
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / count) * Math.PI * 2
        return (
          <group key={i} rotation={[0, 0, -a]}>
            <mesh ref={(el) => (items.current[i] = el)} material={mat} position={[0, 0.9, 0]} castShadow>
              <sphereGeometry args={[1, 24, 18]} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

export default function Sunbud({ ctl, stage, mood, reduced }) {
  const leaf = useMemo(makeLeafGeometry, [])
  const mats = useMemo(() => ({
    face: std('#ffd45e', { roughness: 0.45 }), petal: std('#ff9f43', { roughness: 0.45 }),
    body: std('#5fc96f'), leaf: std('#2fb35e'), halo: std('#ffe27a', { emissive: '#ffcf33', emissiveIntensity: 0.7, roughness: 0.3 }),
  }), [])
  const base = useMemo(() => ({ face: new THREE.Color('#ffd45e'), petal: new THREE.Color('#ff9f43'), body: new THREE.Color('#5fc96f'), leaf: new THREE.Color('#2fb35e') }), [])
  const grey = useMemo(() => ({ face: new THREE.Color('#cfc49a'), petal: new THREE.Color('#b8a27d'), body: new THREE.Color('#8fa384'), leaf: new THREE.Color('#7b8c6e') }), [])
  const haloRef = useRef(), haloCur = useRef(0)
  useFrame((state, dt) => {
    for (const k of ['face', 'petal', 'body', 'leaf']) mats[k].color.copy(base[k]).lerp(grey[k], ctl.current.grey)
    haloCur.current = damp(haloCur.current, stage >= 3 ? 1 : 0, 5, dt)
    haloRef.current.scale.setScalar(Math.max(0.0001, haloCur.current))
    haloRef.current.visible = haloCur.current > 0.01
    haloRef.current.position.y = HEAD_Y + 1.05 + (reduced ? 0 : Math.sin(state.clock.elapsedTime * 2) * 0.04)
    haloRef.current.rotation.z = reduced ? 0 : state.clock.elapsedTime * 0.8
  })

  return (
    <group>
      {/* small green body + leaf arms + feet */}
      <mesh material={mats.body} position={[0, 0.45, 0]} scale={[1, 0.95, 0.9]} castShadow><sphereGeometry args={[0.42, 40, 32]} /></mesh>
      {[-1, 1].map((x) => (
        <group key={x}>
          <mesh material={mats.body} position={[x * 0.2, 0.06, 0.18]} scale={[1, 0.6, 1.3]} castShadow><sphereGeometry args={[0.15, 20, 16]} /></mesh>
          <Leaf geometry={leaf} material={mats.leaf} scale={0.5} position={[x * 0.36, 0.55, 0.05]} rotation={[0, 0, -x * 1.25]} droop={['z', x * -0.7]} ctl={ctl} />
        </group>
      ))}
      <Petals stage={stage} mat={mats.petal} ctl={ctl} />
      {/* face disc */}
      <mesh material={mats.face} position={[0, HEAD_Y, 0]} scale={[1, 1, 0.78]} castShadow><sphereGeometry args={[0.8, 64, 48]} /></mesh>
      <Face mood={mood} y={HEAD_Y + 0.02} z={0.62} size={1.1} spread={0.33} reduced={reduced} />
      {/* top leaf sprout */}
      <Leaf geometry={leaf} material={mats.leaf} scale={0.5} position={[0.02, HEAD_Y + 0.78, 0.1]} rotation={[0, 0, -0.15]} droop={['z', -0.8]} ctl={ctl} />
      {/* Guardian halo */}
      <mesh ref={haloRef} material={mats.halo} rotation={[Math.PI / 2.6, 0, 0]} visible={false}>
        <torusGeometry args={[0.55, 0.045, 16, 64]} />
      </mesh>
    </group>
  )
}
