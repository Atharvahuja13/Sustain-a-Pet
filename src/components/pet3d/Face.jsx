import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { damp, MOODS } from './shared.js'

const IRIS = new THREE.MeshPhysicalMaterial({ color: '#07100c', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03, metalness: 0.1 })
const SHINE = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false })
const MOUTH = new THREE.MeshStandardMaterial({ color: '#17261d', roughness: 0.45 })

/**
 * Face in the parent's local space, facing +Z. Big glossy black eyes with two highlights.
 * Moods ease smoothly; eyes blink, follow the pointer and shut when the pet is sick.
 */
export default function Face({ mood, spread = 0.34, y = 0, z = 0.9, size = 1, reduced }) {
  const L = useRef(), R = useRef(), irisL = useRef(), irisR = useRef(), shineL = useRef(), shineR = useRef(), shine2L = useRef(), shine2R = useRef()
  const mouth = useRef()
  const cur = useRef({ eye: 1, mouth: 1, sparkle: 1, cheek: 0.9 })
  const blink = useRef({ next: 2.5, t: -1 })
  const cheekMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ff9f9a', roughness: 0.8, transparent: true, opacity: 0.8 }), [])
  const target = MOODS[mood]

  useFrame((state, dt) => {
    const c = cur.current
    c.eye = damp(c.eye, target.eye, 7, dt)
    c.mouth = damp(c.mouth, target.mouth, 7, dt)
    c.sparkle = damp(c.sparkle, target.sparkle, 8, dt)
    c.cheek = damp(c.cheek, target.cheek, 5, dt)

    const b = blink.current
    let lid = 1
    if (!reduced) {
      if (b.t < 0 && state.clock.elapsedTime > b.next) b.t = 0
      if (b.t >= 0) {
        b.t += dt
        lid = 1 - Math.sin(Math.min(b.t / 0.16, 1) * Math.PI)
        if (b.t > 0.16) { b.t = -1; b.next = state.clock.elapsedTime + 2 + Math.random() * 3 }
      }
    }
    const open = Math.max(0.06, c.eye * lid)
    for (const e of [L.current, R.current]) e.scale.set(1, open, 1)

    const px = reduced ? 0 : state.pointer.x * 0.04 * size
    const py = reduced ? 0 : state.pointer.y * 0.03 * size
    for (const p of [irisL.current, irisR.current]) { p.position.x = damp(p.position.x, px, 10, dt); p.position.y = damp(p.position.y, py, 10, dt) }
    for (const g of [shineL.current, shineR.current]) g.scale.setScalar(Math.max(0.001, 0.55 + c.sparkle * 0.45))
    for (const g of [shine2L.current, shine2R.current]) g.scale.setScalar(Math.max(0.001, 0.6 + c.sparkle * 0.4))

    mouth.current.scale.y = THREE.MathUtils.lerp(0.12, 1, Math.abs(c.mouth)) * Math.sign(c.mouth || 1)
    mouth.current.scale.x = 0.7 + 0.3 * Math.abs(c.mouth)
    cheekMat.opacity = c.cheek * 0.7
  })

  const r = 0.155 * size
  const eye = (side, ref, iRef, sRef, s2Ref) => (
    <group ref={ref} position={[side * spread * size, 0.1 * size, 0]}>
      <mesh ref={iRef} material={IRIS} scale={[1, 1.12, 0.6]}><sphereGeometry args={[r, 40, 32]} /></mesh>
      <mesh ref={sRef} material={SHINE} position={[-r * 0.3, r * 0.42, r * 0.5]} scale={[1, 1.1, 0.5]}><sphereGeometry args={[r * 0.3, 20, 16]} /></mesh>
      <mesh ref={s2Ref} material={SHINE} position={[r * 0.34, -r * 0.34, r * 0.5]}><sphereGeometry args={[r * 0.12, 14, 12]} /></mesh>
    </group>
  )
  const cheek = (side) => (
    <mesh material={cheekMat} position={[side * spread * 1.62 * size, -0.12 * size, -0.05]} scale={[1, 0.62, 0.3]}>
      <sphereGeometry args={[0.11 * size, 24, 16]} />
    </mesh>
  )

  return (
    <group position={[0, y, z]}>
      {eye(-1, L, irisL, shineL, shine2L)}
      {eye(1, R, irisR, shineR, shine2R)}
      <group ref={mouth} position={[0, -0.17 * size, 0.06 * size]}>
        <mesh material={MOUTH} rotation={[0, 0, Math.PI]} position={[0, 0.08 * size, 0]}>
          <torusGeometry args={[0.1 * size, 0.02 * size, 14, 36, Math.PI]} />
        </mesh>
      </group>
      {cheek(-1)}
      {cheek(1)}
    </group>
  )
}
