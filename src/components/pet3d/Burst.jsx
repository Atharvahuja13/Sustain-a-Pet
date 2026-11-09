import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { makeLeafGeometry } from './shared.js'

const KINDS = {
  leaves: { n: 22, life: 1.5, speed: [2.2, 4.2], up: 3.2, size: 0.22, spin: 6, g: 5, colors: ['#4cc36b', '#7ddf74', '#2fa35a', '#a6e87a'] },
  confetti: { n: 48, life: 2.2, speed: [2.5, 6], up: 5.2, size: 0.12, spin: 10, g: 7, colors: ['#ff5d73', '#ffd23f', '#3ddc97', '#4cc9f0', '#b388ff', '#ff9f43'] },
  sparkle: { n: 34, life: 1.8, speed: [1.2, 3.4], up: 2.4, size: 0.1, spin: 4, g: -0.4, colors: ['#fff6a8', '#ffe066', '#ffffff', '#ffd1fb'] },
}

/** One-shot particle burst. Fires whenever `burstKey` changes (not on mount). Skipped for reduced motion. */
export default function Burst({ kind, burstKey, origin = [0, 1.2, 0.3], reduced }) {
  const cfg = KINDS[kind]
  const mesh = useRef()
  const prev = useRef(burstKey)
  const sim = useRef({ t: -1, p: [], v: [], r: [], w: [] })
  const geo = useMemo(() => {
    if (kind === 'leaves') { const g = makeLeafGeometry(); g.scale(0.5, 0.5, 0.5); return g }
    if (kind === 'sparkle') return new THREE.OctahedronGeometry(0.5, 0)
    return new THREE.PlaneGeometry(0.6, 1)
  }, [kind])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colors = useMemo(() => cfg.colors.map((c) => new THREE.Color(c)), [cfg])

  useEffect(() => { mesh.current.count = 0 }, [])

  useEffect(() => {
    if (prev.current === burstKey) return
    prev.current = burstKey
    if (reduced) return
    const st = sim.current
    st.t = 0
    mesh.current.count = cfg.n
    st.p = []; st.v = []; st.r = []; st.w = []
    for (let i = 0; i < cfg.n; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = cfg.speed[0] + Math.random() * (cfg.speed[1] - cfg.speed[0])
      st.p.push(new THREE.Vector3(...origin))
      st.v.push(new THREE.Vector3(Math.cos(a) * sp * 0.7, cfg.up * (0.5 + Math.random() * 0.7), Math.sin(a) * sp * 0.5 + 1))
      st.r.push(new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6))
      st.w.push(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(cfg.spin))
      mesh.current.setColorAt(i, colors[i % colors.length])
    }
    mesh.current.instanceColor.needsUpdate = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burstKey])

  useFrame((_, dt) => {
    const st = sim.current
    if (st.t < 0) return
    dt = Math.min(dt, 0.05)
    st.t += dt
    const k = st.t / cfg.life
    for (let i = 0; i < cfg.n; i++) {
      st.v[i].y -= cfg.g * dt
      st.v[i].multiplyScalar(1 - dt * 0.6)
      st.p[i].addScaledVector(st.v[i], dt)
      st.r[i].x += st.w[i].x * dt; st.r[i].y += st.w[i].y * dt; st.r[i].z += st.w[i].z * dt
      dummy.position.copy(st.p[i])
      dummy.rotation.copy(st.r[i])
      dummy.scale.setScalar(k >= 1 ? 0 : cfg.size * 2 * Math.min(1, (1 - k) * 3) * Math.min(1, st.t * 12))
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
    if (k >= 1) { st.t = -1; mesh.current.count = 0 }
  })

  return (
    <instancedMesh ref={mesh} args={[geo, undefined, cfg.n]} frustumCulled={false}>
      {kind === 'sparkle'
        ? <meshBasicMaterial toneMapped={false} />
        : <meshStandardMaterial roughness={0.5} side={THREE.DoubleSide} />}
    </instancedMesh>
  )
}
