import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { canvasTexture, damp, gummy, makeLeafGeometry, radialTexture, rng } from './shared.js'

export const ISLAND = 3.4 // pet wander radius

const rand = rng(11)
const tmp = new THREE.Object3D()
const col = new THREE.Color()

/* ---------- ground: soft mossy disc fading into the mist ---------- */
function Ground({ onGo }) {
  const [map, alpha] = useMemo(() => {
    const m = canvasTexture(512, (ctx, n) => {
      const g = ctx.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2)
      g.addColorStop(0, '#4d9c58'); g.addColorStop(0.55, '#3f8a4f'); g.addColorStop(1, '#2f6e45')
      ctx.fillStyle = g; ctx.fillRect(0, 0, n, n)
      const r = rng(5)
      for (let i = 0; i < 520; i++) {
        ctx.fillStyle = r() > 0.5 ? 'rgba(20,80,40,0.14)' : 'rgba(150,220,110,0.07)'
        ctx.beginPath(); ctx.arc(r() * n, r() * n, 4 + r() * 22, 0, 7); ctx.fill()
      }
    })
    const a = radialTexture([[0, '#fff'], [0.62, '#fff'], [1, '#000']], 256)
    return [m, a]
  }, [])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} onClick={(e) => { if (e.delta < 6) { e.stopPropagation(); onGo(e.point.x, e.point.z) } }}>
      <circleGeometry args={[7.5, 96]} />
      <meshStandardMaterial map={map} alphaMap={alpha} transparent roughness={1} depthWrite={false} />
    </mesh>
  )
}

/* ---------- grass: short lawn near the pet, taller toward the rim ---------- */
function Grass({ reduced }) {
  const ref = useRef()
  const N = 2600
  const blades = useMemo(() => {
    const r = rng(21)
    return Array.from({ length: N }, () => {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 7
      const edge = THREE.MathUtils.smoothstep(d, 2.6, 6.5)
      return { x: Math.cos(a) * d, z: Math.sin(a) * d, h: (0.07 + r() * 0.09) + edge * (0.2 + r() * 0.5), ph: r() * 6.28, ry: r() * 3.14, lean: (r() - 0.5) * 0.3, tone: r() }
    })
  }, [])
  const geo = useMemo(() => { const g = new THREE.ConeGeometry(0.022, 1, 3, 1); g.translate(0, 0.5, 0); return g }, [])
  useEffect(() => {
    blades.forEach((b, i) => ref.current.setColorAt(i, col.set('#4fae55').lerp(new THREE.Color('#b9ea7c'), b.tone)))
    ref.current.instanceColor.needsUpdate = true
  }, [blades])
  useFrame((s) => {
    const t = reduced ? 0 : s.clock.elapsedTime
    blades.forEach((b, i) => {
      tmp.position.set(b.x, 0, b.z)
      tmp.rotation.set(Math.sin(t * 1.3 + b.ph) * 0.1, b.ry, b.lean + Math.cos(t * 1.1 + b.ph) * 0.1)
      tmp.scale.set(1, b.h, 1)
      tmp.updateMatrix()
      ref.current.setMatrixAt(i, tmp.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[geo, undefined, N]} frustumCulled={false}>
      <meshStandardMaterial roughness={0.7} />
    </instancedMesh>
  )
}

/* ---------- ferns / saplings around the rim ---------- */
function Ferns() {
  const ref = useRef()
  const leaf = useMemo(makeLeafGeometry, [])
  const items = useMemo(() => {
    const r = rng(33), out = []
    for (let c = 0; c < 16; c++) {
      const a = r() * Math.PI * 2, d = 3.9 + r() * 2.4
      for (let k = 0; k < 5; k++) out.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, s: 0.3 + r() * 0.35, ry: (k / 5) * 6.28 + r(), tilt: 1.0 + r() * 0.4, tone: r() })
    }
    return out
  }, [])
  useEffect(() => {
    items.forEach((it, i) => ref.current.setColorAt(i, col.set('#4aa95e').lerp(new THREE.Color('#a4e585'), it.tone)))
    ref.current.instanceColor.needsUpdate = true
    items.forEach((it, i) => {
      tmp.position.set(it.x, 0, it.z); tmp.rotation.set(it.tilt, it.ry, 0, 'YXZ'); tmp.scale.setScalar(it.s); tmp.updateMatrix(); ref.current.setMatrixAt(i, tmp.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [items])
  return (
    <instancedMesh ref={ref} args={[leaf, undefined, items.length]} frustumCulled={false}>
      <meshStandardMaterial roughness={0.5} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

/* ---------- interactive flowers (the garden grows with your ticks) ---------- */
const FLOWER_SPOTS = (() => {
  const r = rng(77)
  return Array.from({ length: 15 }, (_, i) => {
    const a = (i / 15) * Math.PI * 2 + r() * 0.6, d = 1.7 + r() * 2.1
    return { x: Math.cos(a) * d, z: Math.sin(a) * d, color: ['#ff8fb1', '#ffd34e', '#ffffff', '#b99bff', '#ff9f6b'][i % 5], s: 0.8 + r() * 0.5 }
  })
})()

function Flower({ spot, show, onPick, reduced }) {
  const g = useRef(), head = useRef(), cur = useRef(0), wob = useRef({ a: 0, v: 0 })
  const stem = useMemo(() => gummy('#3f9c4f', { roughness: 0.6 }), [])
  const petal = useMemo(() => gummy(spot.color, { roughness: 0.4 }), [spot.color])
  const core = useMemo(() => gummy('#ffcf33', { roughness: 0.4 }), [])
  useFrame((s, dt) => {
    cur.current = damp(cur.current, show ? 1 : 0, 4, dt)
    g.current.scale.setScalar(Math.max(0.0001, cur.current) * spot.s)
    g.current.visible = cur.current > 0.01
    const w = wob.current
    w.v += (-60 * w.a - 4 * w.v) * dt
    w.a += w.v * dt
    g.current.rotation.z = w.a + (reduced ? 0 : Math.sin(s.clock.elapsedTime * 1.4 + spot.x) * 0.05)
    head.current.rotation.y += dt * 0.4
  })
  return (
    <group position={[spot.x, 0, spot.z]}>
      <group ref={g} onClick={(e) => { if (e.delta < 6) { e.stopPropagation(); wob.current.v = 7; onPick(spot) } }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
        <mesh material={stem} position={[0, 0.3, 0]}><cylinderGeometry args={[0.018, 0.028, 0.6, 8]} /></mesh>
        <mesh material={stem} position={[0.07, 0.2, 0]} rotation={[0, 0, -0.9]} scale={[1, 1.2, 0.4]}><sphereGeometry args={[0.07, 12, 10]} /></mesh>
        <group ref={head} position={[0, 0.62, 0]} rotation={[0.25, 0, 0]}>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} material={petal} position={[Math.cos((i / 6) * 6.283) * 0.12, Math.sin((i / 6) * 6.283) * 0.12, 0]} scale={[1, 1, 0.45]}>
              <sphereGeometry args={[0.095, 16, 12]} />
            </mesh>
          ))}
          <mesh material={core} scale={[1, 1, 0.8]}><sphereGeometry args={[0.075, 16, 12]} /></mesh>
        </group>
      </group>
    </group>
  )
}

/* ---------- mushrooms that boing ---------- */
const SHROOMS = [{ x: -2.9, z: -1.5, s: 1.1 }, { x: 2.7, z: -2.4, s: 0.85 }, { x: -1.4, z: 3.2, s: 0.7 }]
function Mushroom({ spot, onPick }) {
  const g = useRef(), sp = useRef({ y: 0, v: 0 })
  const cap = useMemo(() => gummy('#e8604c', { roughness: 0.35 }), [])
  const stem = useMemo(() => gummy('#f6ecd6', { roughness: 0.55 }), [])
  const dot = useMemo(() => gummy('#fff8ec', { roughness: 0.5 }), [])
  useFrame((_, dt) => {
    const s = sp.current
    s.v += (-90 * s.y - 5 * s.v) * dt
    s.y += s.v * dt
    g.current.scale.set(spot.s * (1 + s.y * 0.7), spot.s * (1 - s.y), spot.s * (1 + s.y * 0.7))
  })
  return (
    <group position={[spot.x, 0, spot.z]}>
      <group ref={g} onClick={(e) => { if (e.delta < 6) { e.stopPropagation(); sp.current.v = -6; onPick(spot) } }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
        <mesh material={stem} position={[0, 0.2, 0]}><cylinderGeometry args={[0.1, 0.14, 0.4, 20]} /></mesh>
        <mesh material={cap} position={[0, 0.38, 0]} scale={[1, 0.62, 1]}><sphereGeometry args={[0.38, 36, 20, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        {[[0.12, 0.6, 0.18], [-0.15, 0.56, 0.12], [0.02, 0.62, -0.17], [0.22, 0.5, -0.06], [-0.2, 0.5, -0.12]].map((d, i) => (
          <mesh key={i} material={dot} position={d}><sphereGeometry args={[0.045, 12, 10]} /></mesh>
        ))}
      </group>
    </group>
  )
}

/* ---------- mossy rocks ---------- */
function Rocks() {
  const rocks = useMemo(() => [[-3.6, 0.8, 0.8], [3.8, -1.2, 0.6], [1.2, -3.8, 0.95], [-0.5, 4.2, 0.55]], [])
  const stone = useMemo(() => gummy('#9aa59a', { roughness: 0.85, clearcoat: 0.1 }), [])
  const moss = useMemo(() => gummy('#5fae55', { roughness: 0.9, clearcoat: 0.1 }), [])
  return rocks.map(([x, z, s], i) => (
    <group key={i} position={[x, 0, z]} scale={s} rotation={[0, i * 1.7, 0]}>
      <mesh material={stone} position={[0, 0.22, 0]} scale={[1.2, 0.8, 1]}><icosahedronGeometry args={[0.4, 3]} /></mesh>
      <mesh material={moss} position={[0, 0.46, 0]} scale={[0.95, 0.35, 0.8]}><sphereGeometry args={[0.32, 20, 14]} /></mesh>
    </group>
  ))
}

/* ---------- atmosphere: hazy trees, bokeh, sun shafts, fireflies ---------- */
function Atmosphere({ reduced }) {
  const blob = useMemo(() => radialTexture([[0, 'rgba(255,255,255,1)'], [0.45, 'rgba(255,255,255,0.55)'], [1, 'rgba(255,255,255,0)']], 128), [])
  const ray = useMemo(() => canvasTexture(128, (ctx, n) => {
    const g = ctx.createLinearGradient(0, 0, 0, n)
    g.addColorStop(0, 'rgba(255,248,200,0.9)'); g.addColorStop(1, 'rgba(255,248,200,0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, n, n)
    const h = ctx.createLinearGradient(0, 0, n, 0)
    h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = h; ctx.fillRect(0, 0, n, n)
  }), [])
  const trees = useMemo(() => {
    const r = rng(9)
    return Array.from({ length: 11 }, (_, i) => { const a = (i / 11) * Math.PI * 2 + r() * 0.4, d = 10 + r() * 3; return { x: Math.cos(a) * d, z: Math.sin(a) * d, y: 2.5 + r() * 2.5, s: 5 + r() * 4, c: ['#4d7f55', '#5f9460', '#3f6e4b', '#6da568'][i % 4], o: 0.35 + r() * 0.25 } })
  }, [])
  const bokeh = useMemo(() => {
    const r = rng(14)
    return Array.from({ length: 22 }, () => { const a = r() * Math.PI * 2, d = 4.5 + r() * 3.5; return { x: Math.cos(a) * d, z: Math.sin(a) * d, y: 0.5 + r() * 3.6, s: 0.3 + r() * 0.8, o: 0.18 + r() * 0.3, ph: r() * 6, c: r() > 0.4 ? '#fff3b0' : '#d8ffc2' } })
  }, [])
  const rays = useRef(), bk = useRef([]), { camera } = useThree()
  useFrame((s) => {
    const t = reduced ? 0 : s.clock.elapsedTime
    // keep sun shafts facing the camera around the vertical axis
    rays.current.rotation.y = Math.atan2(camera.position.x, camera.position.z)
    rays.current.children.forEach((m, i) => { m.material.opacity = 0.16 + Math.sin(t * 0.5 + i * 1.7) * 0.06 })
    bk.current.forEach((sp, i) => { if (sp) sp.position.y = bokeh[i].y + Math.sin(t * 0.4 + bokeh[i].ph) * 0.15 })
  })
  return (
    <>
      {trees.map((t, i) => (
        <sprite key={i} position={[t.x, t.y, t.z]} scale={[t.s, t.s * 1.5, 1]}>
          <spriteMaterial map={blob} color={t.c} transparent opacity={t.o} depthWrite={false} />
        </sprite>
      ))}
      <group ref={rays} position={[2.5, 4.2, -2]}>
        {[-1.6, 0, 1.7].map((x, i) => (
          <mesh key={i} position={[x, 0, -i * 0.3]} rotation={[0, 0, 0.5 + i * 0.07]} scale={[1.4 + i * 0.4, 9, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={ray} transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        ))}
      </group>
      {bokeh.map((b, i) => (
        <sprite key={i} ref={(el) => (bk.current[i] = el)} position={[b.x, b.y, b.z]} scale={[b.s, b.s, 1]}>
          <spriteMaterial map={blob} color={b.c} transparent opacity={b.o} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </sprite>
      ))}
      {!reduced && <Sparkles count={34} scale={[9, 2.8, 9]} position={[0, 1.5, 0]} size={4.5} speed={0.3} opacity={0.95} color="#fff7a8" />}
    </>
  )
}

/** The pet's world. Interactive: tap ground to send the pet there, tap flowers and mushrooms. */
export default function World({ ctl, garden = 3, reduced, onFlower, onShroom }) {
  const go = (x, z) => {
    const r = Math.hypot(x, z)
    const k = r > ISLAND ? ISLAND / r : 1
    ctl.current.goTo?.(x * k, z * k)
  }
  return (
    <>
      <Atmosphere reduced={reduced} />
      <Ground onGo={go} />
      <Grass reduced={reduced} />
      <Ferns />
      <Rocks />
      {FLOWER_SPOTS.map((f, i) => (
        <Flower key={i} spot={f} show={i < garden} reduced={reduced} onPick={(s) => { go(s.x * 0.82, s.z * 0.82); onFlower?.(s) }} />
      ))}
      {SHROOMS.map((m, i) => <Mushroom key={i} spot={m} onPick={(s) => { go(s.x * 0.8, s.z * 0.8); onShroom?.(s) }} />)}
    </>
  )
}
