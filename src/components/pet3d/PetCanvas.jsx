import { useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

const { damp } = THREE.MathUtils
const DEFAULT_DIST = (stage) => 10.2 + stage * 0.35

/**
 * Orbit camera that follows the pet. Drag to look around, wheel/pinch to zoom.
 * `api` receives { zoom(factor), rotate(radians), reset() } for buttons and keyboard.
 */
function CameraRig({ api, follow, stage }) {
  const controls = useRef()
  const imp = useRef({ zoom: 0, rot: 0, fit: 0, reset: 0 })
  const stageRef = useRef(stage)

  useEffect(() => {
    api.current = {
      zoom: (f) => { imp.current.zoom += Math.log(f) * 5 },
      rotate: (a) => { imp.current.rot += a * 5 },
      reset: () => { imp.current.reset = 1.2 },
    }
  }, [api])
  useEffect(() => { stageRef.current = stage; imp.current.fit = 1.4 }, [stage])

  useFrame(({ camera, size }, dt) => {
    // Keep a generous horizontal view on phones without wasting vertical space on wide displays.
    const fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(27 * Math.PI / 180) / (size.width / size.height)))
    const fittedFov = THREE.MathUtils.clamp(fov, 36, 80)
    if (Math.abs(camera.fov - fittedFov) > 0.1) { camera.fov = fittedFov; camera.updateProjectionMatrix() }
    const c = controls.current
    if (!c) return
    dt = Math.min(dt, 0.05)
    const i = imp.current, p = follow.current
    // follow the pet: move target and camera together so the view stays put relative to the pet
    const tx = damp(c.target.x, p.x, 3, dt), tz = damp(c.target.z, p.z, 3, dt)
    const ty = damp(c.target.y, 0.7 + stageRef.current * 0.1, 3, dt)
    camera.position.x += tx - c.target.x; camera.position.z += tz - c.target.z; camera.position.y += ty - c.target.y
    c.target.set(tx, ty, tz)

    const v = camera.position.clone().sub(c.target)
    let len = v.length()
    let az = Math.atan2(v.x, v.z)
    const horiz = Math.hypot(v.x, v.z), pol = Math.atan2(horiz, v.y)
    if (i.zoom) { len *= Math.exp(-i.zoom * dt); i.zoom *= Math.exp(-5 * dt); if (Math.abs(i.zoom) < 0.01) i.zoom = 0 }
    if (i.rot) { az += i.rot * dt; i.rot *= Math.exp(-5 * dt); if (Math.abs(i.rot) < 0.01) i.rot = 0 }
    if (i.fit > 0 || i.reset > 0) {
      len = damp(len, DEFAULT_DIST(stageRef.current), 3, dt)
      if (i.reset > 0) az = damp(az, 0, 3.5, dt)
      i.fit -= dt; i.reset -= dt
    }
    len = THREE.MathUtils.clamp(len, 2.8, 12)
    const h = len * Math.sin(pol)
    camera.position.set(c.target.x + Math.sin(az) * h, c.target.y + len * Math.cos(pol), c.target.z + Math.cos(az) * h)
    c.update()
  })
  return (
    <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping dampingFactor={0.09}
      minDistance={5.5} maxDistance={14} minPolarAngle={0.55} maxPolarAngle={1.5} rotateSpeed={0.65} zoomSpeed={0.7} />
  )
}

/** Canvas with soft clay-style lighting. Offline: reflections come from Lightformers, not a downloaded HDR. */
export default function PetCanvas({ children, camera = { position: [0, 1.7, 7.2], fov: 34 }, target = [0, 1.35, 0], orbit, api, follow, stage = 0, className, ...rest }) {
  return (
    <Canvas
      className={className}
      dpr={[1, 2]}
      shadows={false}
      camera={camera}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      onCreated={({ camera: c }) => c.lookAt(...target)}
      {...rest}
    >
      <hemisphereLight args={['#fffbe8', '#7fb97a', 0.95]} />
      <directionalLight position={[4, 5, 3]} intensity={1.8} color="#fff1cf" />
      <directionalLight position={[-4, 2.5, -3]} intensity={1.0} color="#a9e7d0" />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.2} position={[0, 5, 3]} scale={[8, 3, 1]} color="#fff6e0" />
        <Lightformer form="rect" intensity={1.2} position={[-5, 1, 2]} scale={[3, 5, 1]} color="#cdeed8" />
        <Lightformer form="rect" intensity={1.4} position={[5, 3, -2]} scale={[3, 5, 1]} color="#fff0c0" />
      </Environment>
      {orbit && <fog attach="fog" args={['#9cc79d', 10, 21]} />}
      {orbit && <CameraRig api={api} follow={follow} stage={stage} />}
      {children}
      <ContactShadows position={[0, 0.01, 0]} opacity={0.45} scale={10} blur={2.2} far={2} resolution={256} color="#173a22" />
    </Canvas>
  )
}
