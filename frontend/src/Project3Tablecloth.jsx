import { useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, useAnimations, Center } from '@react-three/drei'
import gsap from 'gsap'
import tableclothUrl from './assets/TableCloth_final.glb'
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
function TableclothModel({ scrubTime, playing, onDuration }) {
  const group = useRef()
  const { scene, animations } = useGLTF(tableclothUrl)
  const { actions, mixer } = useAnimations(animations, group)

  // Names of all clips in the GLB
  const clipNames = animations.map((a) => a.name)
  const hasAnim   = clipNames.length > 0

  // Report the real clip duration (in ms) to the parent once on load
  useEffect(() => {
    if (!hasAnim || !onDuration) return
    const action = actions[clipNames[0]]
    if (!action) return
    const durationSec = action.getClip().duration
    onDuration(durationSec * 1000)
  }, [hasAnim, actions, clipNames, onDuration])

  // Play / pause the first clip based on the `playing` prop
  useEffect(() => {
    if (!hasAnim) return
    const action = actions[clipNames[0]]
    if (!action) return
    if (playing) {
      action.paused = false
      action.play()
    } else {
      action.play()
      action.paused = true
    }
  }, [playing, actions, clipNames, hasAnim])

  // Scrub: when not playing, seek to the scrubTime position (0–1)
  useEffect(() => {
    if (playing || !hasAnim) return
    const action = actions[clipNames[0]]
    if (!action) return
    const duration = action.getClip().duration
    action.time = scrubTime * duration
    mixer.update(0)   // force pose update at the seeked frame
  }, [scrubTime, playing, actions, clipNames, hasAnim, mixer])

  return (
    <>
      {/* Warm ambient base */}
      <ambientLight intensity={0.28} color="#fff6ee" />

      {/* Key light — front-left, slightly above, warm */}
      <directionalLight position={[-3, 5, 6]} intensity={1.4} color="#ffe8cc" castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />

      {/* Fill — front-right, soft */}
      <directionalLight position={[4, 2, 5]} intensity={0.5} color="#ddeeff" />

      {/* Rim — behind, separates model from bg */}
      <directionalLight position={[0, 3, -5]} intensity={0.25} color="#ffd0ff" />

      <group ref={group}>
        <Center>
          <primitive object={scene} scale={2} />
        </Center>
      </group>
    </>
  )
}

// ── Root component (owns Canvas + scrubber UI) ────────────────────────
export default function Project3Tablecloth() {
  const [playing, setPlaying]     = useState(false)
  const [scrubTime, setScrubTime] = useState(0)

  // Keep scrubTime in sync while playing
  const rafRef    = useRef(null)
  const startRef  = useRef(null)  // wall-clock time when play began
  const startScrub = useRef(0)    // scrubTime value when play began
  const durationMs = useRef(0)    // total clip duration in ms (filled after load)

  // Try to get the clip duration from the GLB metadata so the timer is accurate
  useEffect(() => {
    useGLTF.preload(tableclothUrl)
  }, [])

  const handlePlayPause = () => {
    if (!playing) {
      // Start playing from wherever the scrubber is
      startRef.current   = performance.now()
      startScrub.current = scrubTime

      const tick = (now) => {
        if (!durationMs.current) {
          // Duration not yet known — advance by real time (assume 5s clip initially)
          const elapsed = (now - startRef.current) / 5000
          const next = startScrub.current + elapsed
          if (next >= 1) {
            setScrubTime(1)
            setPlaying(false)
            return
          }
          setScrubTime(next)
          rafRef.current = requestAnimationFrame(tick)
          return
        }
        const elapsed = (now - startRef.current) / durationMs.current
        const next = startScrub.current + elapsed
        if (next >= 1) {
          setScrubTime(1)
          setPlaying(false)
          return
        }
        setScrubTime(next)
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } else {
      cancelAnimationFrame(rafRef.current)
    }
    setPlaying((v) => !v)
  }

  const handleScrub = (e) => {
    const val = Number(e.target.value) / 1000
    setScrubTime(val)
    if (playing) {
      // Re-anchor the play timer to the new position
      startRef.current   = performance.now()
      startScrub.current = val
    }
  }

  const handleReplay = () => {
    setScrubTime(0)
    startRef.current   = performance.now()
    startScrub.current = 0
    setPlaying(true)
    cancelAnimationFrame(rafRef.current)
    const tick = (now) => {
      const elapsed = (now - startRef.current) / (durationMs.current || 5000)
      const next = startScrub.current + elapsed
      if (next >= 1) { setScrubTime(1); setPlaying(false); return }
      setScrubTime(next)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

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
          onDuration={(ms) => { durationMs.current = ms }}
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

      {/* ── Timeline bar ─────────────────────────────────────────── */}
      <div className={styles.timeline}>
        <button
          type="button"
          className={styles.playBtn}
          onClick={scrubTime >= 1 ? handleReplay : handlePlayPause}
          aria-label={scrubTime >= 1 ? 'Replay' : playing ? 'Pause' : 'Play'}
        >
          {scrubTime >= 1 ? (
            // Replay icon
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 3a7 7 0 1 0 7 7h-2a5 5 0 1 1-1.5-3.5L12 8h4V4l-1.5 1.5A7 7 0 0 0 10 3z"/>
            </svg>
          ) : playing ? (
            // Pause icon
            <svg viewBox="0 0 20 20" fill="currentColor">
              <rect x="5" y="3" width="4" height="14" rx="1"/>
              <rect x="11" y="3" width="4" height="14" rx="1"/>
            </svg>
          ) : (
            // Play icon
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
