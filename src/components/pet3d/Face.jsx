import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { damp, MOODS } from './shared.js'

const EYE_WHITE = new THREE.MeshStandardMaterial({ color: '#fffdf7', roughness: 0.25 })
const PUPIL = new THREE.MeshStandardMaterial({ color: '#1d2a22', roughness: 0.15, metalness: 0.1 })
const GLINT = new THREE.MeshBasicMaterial({ color: '#ffffff' })
const MOUTH = new THREE.MeshStandardMaterial({ color: '#2c3b30', roughness: 0.5 })

/**
 * Face that lives in the parent's local space, facing +Z.
 * Moods ease smoothly; eyes blink, follow the pointer and shut when the pet is sick.
 */
export default function Face({ mood, spread = 0.34, y = 0, z = 0.9, size = 1, reduced }) {
  const L = useRef(), R = useRef(), pupilL = useRef(), pupilR = useRef(), glintL = useRef(), glintR = useRef()
  const mouth = useRef(), cheekL = useRef(), cheekR = useRef()
  const cur = useRef({ eye: 1, mouth: 1, sparkle: 1, cheek: 0.9 })
  const blink = useRef({ next: 2.5, t: -1 })
  const cheekMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ff9fa8', roughness: 0.8, transparent: true, opacity: 0.8 }), [])
  const target = MOODS[mood]

  useFrame((state, dt) => {
    const c = cur.current
    c.eye = damp(c.eye, target.eye, 7, dt)
    c.mouth = damp(c.mouth, target.mouth, 7, dt)
    c.sparkle = damp(c.sparkle, target.sparkle, 8, dt)
    c.cheek = damp(c.cheek, target.cheek, 5, dt)

    // blink: quick close/open every few seconds (skipped for reduced motion)
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

    // pupils drift toward the pointer, clamped inside the eye
    const px = reduced ? 0 : state.pointer.x * 0.045 * size
    const py = reduced ? 0 : state.pointer.y * 0.035 * size
    for (const p of [pupilL.current, pupilR.current]) { p.position.x = damp(p.position.x, px, 10, dt); p.position.y = damp(p.position.y, py, 10, dt) }
    for (const g of [glintL.current, glintR.current]) g.scale.setScalar(Math.max(0.001, c.sparkle))

    mouth.current.scale.y = THREE.MathUtils.lerp(0.12, 1, Math.abs(c.mouth)) * Math.sign(c.mouth || 1)
    mouth.current.scale.x = 0.7 + 0.3 * Math.abs(c.mouth)
    cheekMat.opacity = c.cheek * 0.75
  })

  const r = 0.15 * size
  const eye = (side, ref, pRef, gRef) => (
    <group ref={ref} position={[side * spread * size, 0.1 * size, 0]}>
      <mesh material={EYE_WHITE} scale={[1, 1.15, 0.55]}><sphereGeometry args={[r, 32, 24]} /></mesh>
      <mesh ref={pRef} material={PUPIL} position={[0, 0, r * 0.38]} scale={[1, 1.1, 0.5]}><sphereGeometry args={[r * 0.62, 24, 20]} /></mesh>
      <mesh ref={gRef} material={GLINT} position={[r * 0.18, r * 0.28, r * 0.72]}><sphereGeometry args={[r * 0.2, 12, 10]} /></mesh>
    </group>
  )

  return (
    <group position={[0, y, z]}>
      {eye(-1, L, pupilL, glintL)}
      {eye(1, R, pupilR, glintR)}
      <group ref={mouth} position={[0, -0.14 * size, 0.06 * size]}>
        {/* half-torus arc opening upward = smile; scale.y < 0 flips it into a frown */}
        <mesh material={MOUTH} rotation={[0, 0, Math.PI]} position={[0, 0.08 * size, 0]}>
          <torusGeometry args={[0.13 * size, 0.022 * size, 12, 32, Math.PI]} />
        </mesh>
      </group>
      <mesh ref={cheekL} material={cheekMat} position={[-0.52 * size, -0.12 * size, -0.05]} scale={[1, 0.62, 0.3]}>
        <sphereGeometry args={[0.1 * size, 20, 16]} />
      </mesh>
      <mesh ref={cheekR} material={cheekMat} position={[0.52 * size, -0.12 * size, -0.05]} scale={[1, 0.62, 0.3]}>
        <sphereGeometry args={[0.1 * size, 20, 16]} />
      </mesh>
    </group>
  )
}
