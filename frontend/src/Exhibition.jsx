import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import gsap from 'gsap'
import { useNavigate } from 'react-router-dom'
import Scene from './Scene'
import UIOverlay from './UIOverlay'
import Project3Ascii from './Project3Ascii'
import styles from './Exhibition.module.css'

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

  return (
    <div ref={rootRef} className={styles.root}>
      <div
        className={`${styles.contentHost} ${menuOpen ? styles.contentHostBlurred : ''}`}
      >
        {activeProjectId !== 3 && (
          <Canvas
            shadows
            camera={{ position: [0, 1.5, 4.5], fov: 48, near: 0.1, far: 100 }}
            gl={{ antialias: true, alpha: false }}
          >
            <Scene projectId={activeProjectId} />
          </Canvas>
        )}

        {activeProjectId === 3 && <Project3Ascii active />}
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
          setActiveProjectId((curr) => Math.min(3, curr + 1))
        }}
      />
    </div>
  )
}
