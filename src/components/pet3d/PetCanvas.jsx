import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils } from 'three'
import { ContactShadows, Environment, Lightformer } from '@react-three/drei'

/** Canvas with soft clay-style lighting. Offline: reflections come from Lightformers, not a downloaded HDR. */
/** Eases the camera toward `fit` = { dist, y } so the pet stays framed as it grows. */
function CameraFit({ fit, target }) {
  const look = useRef(fit.look)
  useFrame(({ camera }, dt) => {
    camera.position.z = MathUtils.damp(camera.position.z, fit.dist, 3, dt)
    camera.position.y = MathUtils.damp(camera.position.y, fit.y, 3, dt)
    look.current = MathUtils.damp(look.current, fit.look, 3, dt)
    camera.lookAt(target[0], look.current, target[2])
  })
  return null
}

export default function PetCanvas({ children, camera = { position: [0, 1.7, 7.2], fov: 34 }, target = [0, 1.35, 0], fit, className, ...rest }) {
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
      <hemisphereLight args={['#fff7e8', '#8fbf8a', 0.9]} />
      <directionalLight position={[3, 5, 4]} intensity={1.7} color="#fff1d6" />
      <directionalLight position={[-4, 2.5, -3]} intensity={1.1} color="#9fe7ff" />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.2} position={[0, 5, 3]} scale={[8, 3, 1]} color="#fff6e0" />
        <Lightformer form="rect" intensity={1.2} position={[-5, 1, 2]} scale={[3, 5, 1]} color="#bfe9ff" />
        <Lightformer form="rect" intensity={1} position={[5, 2, -2]} scale={[3, 5, 1]} color="#ffe0f0" />
      </Environment>
      {fit && <CameraFit fit={fit} target={target} />}
      {children}
      <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={9} blur={2.4} far={2.2} resolution={256} color="#1f3d2b" />
    </Canvas>
  )
}
