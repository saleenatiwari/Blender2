import { useEffect, useRef, useState } from 'react'
import styles from './RareBeautyHero.module.css'

const TOTAL_FRAMES = 120
const FRAME_BASE = '/frames/project4/frame_'

function frameSrc(n) {
  return `${FRAME_BASE}${String(n).padStart(4, '0')}.png`
}

export default function RareBeautyHero() {
  const canvasRef = useRef(null)
  const scrollParentRef = useRef(null)
  const imagesRef = useRef([])
  const rafRef = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const images = []
    let loadedCount = 0

    console.log('[RareBeautyHero] first frame URL:', frameSrc(1))

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image()
      img.src = frameSrc(i)
      img.onload = () => {
        loadedCount++
        if (loadedCount === TOTAL_FRAMES) {
          imagesRef.current = images
          setLoaded(true)
          drawFrame(0)
        }
      }
      img.onerror = () => {
        loadedCount++
        if (loadedCount === TOTAL_FRAMES) {
          imagesRef.current = images
          setLoaded(true)
          drawFrame(0)
        }
      }
      images.push(img)
    }

    function drawFrame(index) {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      const img = imagesRef.current[index]
      if (!img || !img.complete || img.naturalWidth === 0) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }

    function onScroll() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const section = scrollParentRef.current
        if (!section) return

        const rect = section.getBoundingClientRect()
        const scrollable = section.offsetHeight - window.innerHeight
        const scrolled = -rect.top

        let progress = scrolled / scrollable
        progress = Math.max(0, Math.min(1, progress))

        const frameIndex = Math.round(progress * (TOTAL_FRAMES - 1))
        drawFrame(frameIndex)
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div ref={scrollParentRef} className={styles.scrollParent}>
      <div className={styles.sticky}>
        {!loaded && (
          <div className={styles.loader}>
            <span className={styles.loaderText}>Loading…</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className={styles.canvas}
          style={{ opacity: loaded ? 1 : 0 }}
        />
      </div>
    </div>
  )
}
