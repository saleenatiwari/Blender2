import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, Center } from '@react-three/drei'
import gsap from 'gsap'
import mugUrl from './assets/Mug1_self.glb'
import pinBoardUrl from './assets/PinBoard1.glb'

// ── Camera entrance (unchanged) ───────────────────────────────────────
function CameraEntrance({ onComplete }) {
  const { camera } = useThree()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    const end = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    }
    camera.position.set(end.x + 0.55, end.y - 0.35, end.z + 1.05)

    gsap.to(camera.position, {
      x: end.x,
      y: end.y,
      z: end.z,
      duration: 2.4,
      ease: 'power3.out',
      onComplete: () => onComplete?.(),
    })
  }, [camera, onComplete])

  return null
}

// ── Project 1 — Mug ──────────────────────────────────────────────────
function MugScene() {
  const { scene } = useGLTF(mugUrl)
  const groupRef = useRef()

  // Slow auto-rotation so the viewer sees all sides
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.22
  })

  return (
    <>
      {/* Base ambient — keeps shadows from going pitch black */}
      <ambientLight intensity={0.3} />

      {/* Key light — front-above-right, warm, main illumination */}
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.45}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={30}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />

      {/* Fill light — opposite side, soft, prevents harsh shadow */}
      <directionalLight position={[-3, 2, -1]} intensity={0.5} />

      {/* Rim / back light — gives depth and edge separation */}
      <directionalLight position={[0, 3, -5]} intensity={0.4} color="#ffe4ff" />

      <group ref={groupRef}>
        <Center>
          <primitive object={scene} scale={2} />
        </Center>
      </group>
    </>
  )
}

// ── Project 2 — Pin Board ────────────────────────────────────────────
function PinBoardScene() {
  const { scene } = useGLTF(pinBoardUrl)
  const groupRef = useRef()

  // Gentle sway so it feels alive
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.28) * 0.07
    }
  })

  return (
    <>
      {/* Warm ambient — gives the cork its natural tone */}
      <ambientLight intensity={0.25} color="#fff5e0" />

      {/* Gallery spotlight — focused on the cork/pictures face */}
      <spotLight
        position={[0, 6, 4]}
        intensity={1.8}
        angle={0.38}
        penumbra={0.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Secondary directional — 30-45° side angle for cork texture */}
      <directionalLight position={[-3, 4, 2]} intensity={0.5} />

      {/* Subtle back fill so the board doesn't disappear behind */}
      <directionalLight position={[0, 2, -4]} intensity={0.2} color="#fff8f0" />

      <group ref={groupRef}>
        <Center>
          <primitive object={scene} scale={2} />
        </Center>
      </group>
    </>
  )
}

// ── Root scene component ─────────────────────────────────────────────
export default function Scene({ projectId = 1 }) {
  const [orbitEnabled, setOrbitEnabled] = useState(false)

  return (
    <>
      <color attach="background" args={['#050508']} />

      {/* Shared floor — receives shadows */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#0a0a0f" roughness={0.85} metalness={0.15} />
      </mesh>

      {projectId === 1 && <MugScene />}
      {projectId === 2 && <PinBoardScene />}

      <CameraEntrance onComplete={() => setOrbitEnabled(true)} />

      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        minDistance={2.5}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2 - 0.08}
        enabled={orbitEnabled}
      />
    </>
  )
}

// Eager-load both models so they're ready before user navigates to them
useGLTF.preload(mugUrl)
useGLTF.preload(pinBoardUrl)
