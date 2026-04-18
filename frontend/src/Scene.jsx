import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, Center } from '@react-three/drei'
import gsap from 'gsap'
import mugUrl from './assets/Mug1_self.glb'
import pinBoardUrl from './assets/PinBoard1.glb'

// ── Camera entrance (unchanged) ───────────────────────────────────────
function CameraEntrance({ target = null }) {
  const { camera } = useThree()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    const end = target ?? {
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
    })
  }, [camera])

  return null
}

// ── Project 1 — Mug ──────────────────────────────────────────────────
function MugScene() {
  const { scene } = useGLTF(mugUrl)

  return (
    <>
      {/* Dim ambient — dark side is shadowed but not pitch black */}
      <ambientLight intensity={0.18} color="#fff8f0" />

      {/* Key light — front-left, slightly above, warm window light */}
      <directionalLight position={[-2, 4, 5]} intensity={1.2} color="#ffe8c8" />

      {/* Fill — front-right, very soft, just lifts the shadow side */}
      <directionalLight position={[3, 1, 4]} intensity={0.35} color="#ddeeff" />

      <group>
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

  return (
    <>
      {/* Dim ambient — room has some bounce light, nothing is fully black */}
      <ambientLight intensity={0.22} color="#fff5e8" />

      {/* Key light — overhead and slightly forward, like a ceiling fixture */}
      <directionalLight position={[0, 5, 3]} intensity={1.1} color="#fff4e0" castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />

      {/* Soft fill — front-left, lifts the lower left without washing out */}
      <directionalLight position={[-2, 1, 4]} intensity={0.3} color="#ffffff" />

      <group rotation={[0, Math.PI, 0]}>
        <Center>
          <primitive object={scene} scale={2} />
        </Center>
      </group>
    </>
  )
}

// ── Root scene component ─────────────────────────────────────────────
export default function Scene({ projectId = 1 }) {
  return (
    <>
      <color attach="background" args={['#050508']} />

{projectId === 1 && <MugScene />}
      {projectId === 2 && <PinBoardScene />}

      <CameraEntrance target={projectId === 1 ? { x: 0, y: 1.5, z: 7 } : null} />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        zoomSpeed={0.5}
        minDistance={2.5}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2 - 0.08}
      />
    </>
  )
}

// Eager-load both models so they're ready before user navigates to them
useGLTF.preload(mugUrl)
useGLTF.preload(pinBoardUrl)
