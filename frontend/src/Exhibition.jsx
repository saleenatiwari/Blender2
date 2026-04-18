import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import gsap from 'gsap'
import { useNavigate } from 'react-router-dom'
import Scene from './Scene'
import UIOverlay from './UIOverlay'
import ProjectPlaceholder from './ProjectPlaceholder'
import Project3Tablecloth from './Project3Tablecloth'
import RareBeautyHero from './components/RareBeautyHero'
import styles from './Exhibition.module.css'

const TOTAL_PROJECTS = 4

export default function Exhibition() {
  const navigate = useNavigate()
  const rootRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState(1)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    gsap.fromTo(
      el,
      { opacity: 0 },
      { opacity: 1, duration: 1.1, ease: 'power2.out' },
    )
  }, [])

  // Scroll to top whenever the active project changes so Project 4 always
  // starts at frame 1, and other projects don't inherit a scrolled position.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [activeProjectId])

  return (
    <div ref={rootRef} className={styles.root}>
      <div
        className={`${styles.contentHost} ${menuOpen ? styles.contentHostBlurred : ''} ${activeProjectId === 4 ? styles.contentHostScrollable : ''}`}
      >
        {/* Projects 1 & 2 — shared 3D canvas */}
        {(activeProjectId === 1 || activeProjectId === 2) && (
          <Canvas
            shadows
            camera={{ position: [0, 1.5, 4.5], fov: 48, near: 0.1, far: 100 }}
            gl={{ antialias: true, alpha: false }}
          >
            <Scene projectId={activeProjectId} />
          </Canvas>
        )}

        {/* Project 3 — tablecloth animation with scrubber */}
        {activeProjectId === 3 && <Project3Tablecloth />}

        {/* Project 4 — Rare Beauty ad */}
        {activeProjectId === 4 && <RareBeautyHero />}
      </div>

      <UIOverlay
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((v) => !v)}
        activeProjectId={activeProjectId}
        onSelectProject={(id) => {
          setMenuOpen(false)
          setActiveProjectId(id)
        }}
        onBack={() => {
          setMenuOpen(false)
          setActiveProjectId((curr) => {
            if (curr <= 1) {
              navigate('/')
              return 1
            }
            return curr - 1
          })
        }}
        onNext={() => {
          setMenuOpen(false)
          setActiveProjectId((curr) => Math.min(TOTAL_PROJECTS, curr + 1))
        }}
      />
    </div>
  )
}
