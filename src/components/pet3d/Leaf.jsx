import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { damp } from './shared.js'

/** A leaf that grows in when `show` turns true and shrinks away when false. Pivot is the leaf base. */
export default function Leaf({ geometry, material, show = true, scale = 1, position = [0, 0, 0], rotation = [0, 0, 0], droop = null, ctl }) {
  const g = useRef(), pivot = useRef(), cur = useRef(0)
  useFrame((_, dt) => {
    cur.current = damp(cur.current, show ? 1 : 0, 6, dt)
    g.current.scale.setScalar(Math.max(0.0001, cur.current) * scale)
    g.current.visible = cur.current > 0.01
    if (droop && ctl) {
      // droop = [axis, amount]: rotate the leaf outward/down as the pet gets unhealthy
      const [axis, amt] = droop
      pivot.current.rotation[axis] = rotation[axis === 'z' ? 2 : 0] + amt * ctl.current.droop
    }
  })
  return (
    <group ref={pivot} position={position} rotation={rotation}>
      <mesh ref={g} geometry={geometry} material={material} castShadow />
    </group>
  )
}
