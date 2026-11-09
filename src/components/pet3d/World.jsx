import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, Sparkles, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import QuizCard from '../QuizCard.jsx'
import { canvasTexture, damp, gummy, makeLeafGeometry, radialTexture, rng } from './shared.js'

export const ISLAND = 3.4 // pet wander radius

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

/* ---------- a dense, irregular carpet of autumn leaves ---------- */
function AutumnLeaves() {
  const atlas = useTexture('/textures/dry-leaves-atlas.png')
  atlas.colorSpace = THREE.SRGBColorSpace
  const refs = useRef([])
  const batches = useMemo(() => {
    const r = rng(21)
    const clusters = Array.from({ length: 28 }, () => {
      const a = r() * Math.PI * 2, d = Math.pow(r(), 0.74) * 7
      return { x: Math.cos(a) * d, z: Math.sin(a) * d, spread: 0.24 + r() * 0.48 }
    })
    const out = Array.from({ length: 4 }, () => [])
    for (let i = 0; i < 1700; i++) {
      let x, z
      if (i < 1300) {
        // Broad coverage through the walkable center, with leaf litter extending to the edges.
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 4.75
        x = Math.cos(a) * d; z = Math.sin(a) * d
      } else {
        const cluster = clusters[Math.floor(r() * clusters.length)]
        // Looser, irregular drifts gather around the outside of the main scatter.
        x = cluster.x + ((r() + r() + r() + r()) - 2) * cluster.spread
        z = cluster.z + ((r() + r() + r() + r()) - 2) * cluster.spread
      }
      const variant = Math.floor(r() * 4)
      out[variant].push({ x, z, y: 0.025 + r() * 0.025,
        sx: 0.28 + r() * 0.27, sz: 0.27 + r() * 0.27,
        yaw: r() * Math.PI * 2, curl: (r() - 0.5) * 0.16, lean: (r() - 0.5) * 0.12 })
    }
    return out
  }, [])
  const geometries = useMemo(() => Array.from({ length: 4 }, (_, variant) => {
    const g = new THREE.PlaneGeometry(1, 1)
    const uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) {
      const u = uv.getX(i), v = uv.getY(i)
      uv.setXY(i, u * 0.5 + (variant % 2) * 0.5, v * 0.5 + (variant < 2 ? 0.5 : 0))
    }
    uv.needsUpdate = true
    return g
  }), [])
  const attachRefs = useMemo(() => batches.map((leaves, variant) => (mesh) => {
    refs.current[variant] = mesh
    if (!mesh) return
    leaves.forEach((b, i) => {
      tmp.position.set(b.x, b.y, b.z)
      tmp.rotation.set(-Math.PI / 2 + b.curl, b.yaw, b.lean, 'YXZ')
      tmp.scale.set(b.sx, b.sz, 1)
      tmp.updateMatrix()
      mesh.setMatrixAt(i, tmp.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }), [batches])
  return (
    <group>
      {batches.map((leaves, i) => <instancedMesh key={i} ref={attachRefs[i]} args={[geometries[i], undefined, leaves.length]} frustumCulled={false}>
        <meshStandardMaterial map={atlas} transparent alphaTest={0.3} depthWrite={false} side={THREE.DoubleSide} roughness={1} />
      </instancedMesh>)}
    </group>
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

/* ---------- habit mushrooms: each one holds a daily action ---------- */
const SHROOMS = [
  { x: -3.8, z: -2.0, s: 1.05 }, { x: 2.3, z: -3.5, s: 0.9 },
  { x: 4.0, z: 1.5, s: 0.88 }, { x: 1.0, z: 3.4, s: 0.82 },
  { x: -2.6, z: 2.6, s: 0.9 }, { x: -3.4, z: 0.2, s: 0.8 },
  { x: -1.2, z: -1.4, s: 0.95 }, { x: 1.5, z: 0.7, s: 0.78 },
]
function Mushroom({ spot, habit, done, quizResult, today, petPos, reduced, selected, onComplete, onQuizAnswer, onPick }) {
  const g = useRef(), sp = useRef({ y: 0, v: 0 })
  const [near, setNear] = useState(false)
  const isQuiz = habit.id === 'quiz'
  const cap = useMemo(() => gummy(isQuiz ? '#e8a92f' : done ? '#6bb76a' : '#e8604c', { roughness: 0.35, emissive: isQuiz ? '#8c4f08' : done ? '#184f23' : '#43120d', emissiveIntensity: isQuiz ? 0.48 : done ? 0.22 : 0.04 }), [done, isQuiz])
  const stem = useMemo(() => gummy('#f6ecd6', { roughness: 0.55 }), [])
  const dot = useMemo(() => gummy('#fff8ec', { roughness: 0.5 }), [])
  useFrame((_, dt) => {
    const distance = Math.hypot(petPos.x - spot.x, petPos.z - spot.z)
    const nextNear = near ? distance < 1.8 : distance < 1.3
    if (nextNear !== near) setNear(nextNear)
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
      {near && selected && <Html position={[0, 1.02, 0]} center zIndexRange={[20, 0]}>
        <div className="mushroom-prompt" onPointerDown={(e) => e.stopPropagation()}>
          {isQuiz ? (
            <div className="mushroom-quiz-card"><span className="mushroom-kicker">GOLDEN QUEST · +{habit.xp} XP</span><QuizCard today={today} result={quizResult} onAnswer={onQuizAnswer} /></div>
          ) : (
            <label className={`mushroom-habit ${done ? 'is-done' : ''}`}>
              <input type="checkbox" checked={done} disabled={done} onChange={onComplete} aria-label={`Complete: ${habit.label}`} />
              <span className="mushroom-check" aria-hidden="true">{done ? '✓' : ''}</span>
              <span className="mushroom-copy"><span className="mushroom-kicker">{done ? 'GREAT WORK' : 'DAILY QUEST'}</span><strong>{habit.label}</strong><small>{done ? 'Completed today' : `Tap to complete · +${habit.xp} XP`}</small></span>
            </label>
          )}
        </div>
      </Html>}
      {isQuiz && <>
        <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[0.52, 0.025, 10, 48]} /><meshBasicMaterial color="#ffd76a" toneMapped={false} /></mesh>
        <pointLight position={[0, 0.9, 0]} color="#ffd05a" intensity={1.8} distance={3.4} decay={2} />
        {!reduced && <Sparkles count={9} scale={[1.5, 1.25, 1.5]} position={[0, 0.8, 0]} size={2.4} speed={0.45} color="#ffe49a" />}
      </>}
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

/** The pet's world. Tap the ground to walk; a habit card rises when the pet reaches its mushroom. */
export default function World({ ctl, garden = 3, reduced, habits = [], done = [], today, quizResult, onHabit, onQuizAnswer, onFlower, onShroom }) {
  const [selectedId, setSelectedId] = useState(null)
  const go = (x, z) => {
    const r = Math.hypot(x, z)
    const k = r > ISLAND ? ISLAND / r : 1
    ctl.current.goTo?.(x * k, z * k)
  }
  return (
    <>
      <Atmosphere reduced={reduced} />
      <Ground onGo={(x, z) => { setSelectedId(null); go(x, z) }} />
      <AutumnLeaves />
      <Ferns />
      <Rocks />
      {FLOWER_SPOTS.map((f, i) => (
        <Flower key={i} spot={f} show={i < garden} reduced={reduced} onPick={(s) => { setSelectedId(null); go(s.x * 0.82, s.z * 0.82); onFlower?.(s) }} />
      ))}
      {SHROOMS.map((m, i) => {
        const habit = habits[i]
        if (!habit) return null
        return <Mushroom key={habit.id} spot={m} habit={habit} done={done.includes(habit.id)} quizResult={quizResult} today={today} reduced={reduced} petPos={ctl.current.pos} selected={selectedId === habit.id}
          onComplete={() => onHabit?.(habit.id)} onQuizAnswer={onQuizAnswer}
          onPick={(s) => { setSelectedId(habit.id); go(s.x * 0.8, s.z * 0.8); onShroom?.(s) }} />
      })}
    </>
  )
}
