import { useEffect, useRef, useState } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, useAnimations, Center } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import tableclothUrl from './assets/TableCloth_v4.glb'
import styles from './Project3Tablecloth.module.css'

// ── Camera entrance ───────────────────────────────────────────────────
function CameraEntrance() {
  const { camera } = useThree()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    const end = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
    camera.position.set(end.x + 0.6, end.y - 0.4, end.z + 1.2)
    gsap.to(camera.position, { x: end.x, y: end.y, z: end.z, duration: 2.4, ease: 'power3.out' })
  }, [camera])

  return null
}

// ── The 3D model + animation ──────────────────────────────────────────
function TableclothModel({ scrubTime, playing, onDuration, onTimeUpdate }) {
  const group = useRef()
  const { scene, animations } = useGLTF(tableclothUrl)
  const { actions, mixer } = useAnimations(animations, group)

  const actionRef = useRef(null)
  const clipDur   = useRef(0)
  const initialized = useRef(false)

  // Fix materials: DoubleSide on cloth mesh (detected via morph targets)
  useEffect(() => {
    scene.traverse((obj) => {
      if (!obj.isMesh) return
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      // Cloth mesh has morph targets — make it double-sided so it's never invisible
      const isCloth = obj.morphTargetInfluences && obj.morphTargetInfluences.length > 0
      mats.forEach((mat) => {
        if (!mat) return
        if (isCloth) mat.side = THREE.DoubleSide
        mat.needsUpdate = true
      })
      if (obj.morphTargetInfluences) {
        obj.morphTargetInfluences.fill(0)
      }
    })
  }, [scene])

  // Init animation — runs once when actions are ready
  useEffect(() => {
    if (initialized.current) return
    const clipNames = Object.keys(actions)
    if (clipNames.length === 0) return
    initialized.current = true

    const action = actions[clipNames[0]]
    actionRef.current  = action
    clipDur.current    = action.getClip().duration

    action.loop              = THREE.LoopOnce
    action.clampWhenFinished = true
    action.timeScale         = 0.4
    action.reset()
    action.play()
    action.paused = true
    action.time   = 0
    mixer.update(0)

    if (onDuration) onDuration(clipDur.current * 1000)
  }, [actions, mixer, onDuration])

  // Drive mixer every frame when playing
  useFrame((_, delta) => {
    if (!actionRef.current || !clipDur.current) return
    if (playing) {
      mixer.update(delta)
      if (onTimeUpdate) onTimeUpdate(actionRef.current.time / clipDur.current)
    }
  })

  // React to play / pause — if at the end, reset and replay from frame 0
  useEffect(() => {
    const action = actionRef.current
    if (!action) return
    if (playing) {
      if (clipDur.current > 0 && action.time >= clipDur.current) {
        action.reset()
        action.timeScale = 0.4
        action.play()
      }
      action.paused = false
    } else {
      action.paused = true
    }
  }, [playing])

  // Scrub when paused
  useEffect(() => {
    if (playing || !actionRef.current || !clipDur.current) return
    actionRef.current.time = scrubTime * clipDur.current
    mixer.update(0)
  }, [scrubTime, playing, mixer])

  return (
    <>
      {/* Ambient — enough to see all sides without washing out */}
      <ambientLight intensity={0.45} color="#fff4ee" />

      {/* Key light — front-left, above, warm */}
      <directionalLight position={[-3, 6, 5]} intensity={1.5} color="#ffe8cc"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />

      {/* Fill — front-right, neutral, lifts shadow side */}
      <directionalLight position={[4, 3, 4]} intensity={0.55} color="#e8eeff" />

      {/* Soft under-fill so cloth underside isn't black when draped */}
      <directionalLight position={[0, -2, 3]} intensity={0.25} color="#fff0e8" />

      <group ref={group}>
        <Center>
          <primitive object={scene} scale={2} />
        </Center>
      </group>
    </>
  )
}

// ── Root component ────────────────────────────────────────────────────
export default function Project3Tablecloth() {
  const [playing, setPlaying]     = useState(false)
  const [scrubTime, setScrubTime] = useState(0)

  const handlePlayPause = () => {
    setPlaying((v) => {
      if (!v && scrubTime >= 1) setScrubTime(0)
      return !v
    })
  }

  const handleReplay = () => {
    setScrubTime(0)
    setPlaying(true)
  }

  const handleScrub = (e) => {
    const val = Number(e.target.value) / 1000
    setScrubTime(val)
    if (playing) setPlaying(false)
  }

  const handleTimeUpdate = (t) => {
    setScrubTime(t)
    if (t >= 1) setPlaying(false)
  }

  return (
    <div className={styles.root}>
      <Canvas
        shadows
        camera={{ position: [0, 2, 6], fov: 46, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#050508']} />
        <TableclothModel
          scrubTime={scrubTime}
          playing={playing}
          onDuration={() => {}}
          onTimeUpdate={handleTimeUpdate}
        />
        <CameraEntrance />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          zoomSpeed={0.5}
          minDistance={2}
          maxDistance={14}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
      </Canvas>

      <div className={styles.timeline}>
        <button
          type="button"
          className={styles.playBtn}
          onClick={scrubTime >= 1 ? handleReplay : handlePlayPause}
          aria-label={scrubTime >= 1 ? 'Replay' : playing ? 'Pause' : 'Play'}
        >
          {scrubTime >= 1 ? (
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 3a7 7 0 1 0 7 7h-2a5 5 0 1 1-1.5-3.5L12 8h4V4l-1.5 1.5A7 7 0 0 0 10 3z"/>
            </svg>
          ) : playing ? (
            <svg viewBox="0 0 20 20" fill="currentColor">
              <rect x="5" y="3" width="4" height="14" rx="1"/>
              <rect x="11" y="3" width="4" height="14" rx="1"/>
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor">
              <polygon points="4,2 18,10 4,18"/>
            </svg>
          )}
        </button>

        <div className={styles.scrubberTrack}>
          <div
            className={styles.scrubberFill}
            style={{ width: `${scrubTime * 100}%` }}
          />
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(scrubTime * 1000)}
            className={styles.scrubberInput}
            onChange={handleScrub}
            aria-label="Animation timeline"
          />
        </div>
      </div>
    </div>
  )
}

useGLTF.preload(tableclothUrl)
