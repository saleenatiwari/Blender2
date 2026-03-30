import { useEffect, useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import styles from './AsciiExhibit.module.css'
import asciiArt3Url from './assets/ascii-art-3.txt?url'

const PADDING_PX = 20

async function fetchAsciiWithFallback() {
  const urls = [
    // Per requirement (primary)
    '/src/assets/ascii/oski.txt',
    // Fallbacks for the repo's current filename/location
    '/src/assets/ascii-art-3.txt',
    '/src/assets/ascii/ascii-art-3.txt',
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      return await res.text()
    } catch {
      // Try next URL
    }
  }

  // Fallback for Vite bundling/build reliability.
  try {
    const res = await fetch(asciiArt3Url)
    if (!res.ok) return ''
    return await res.text()
  } catch {
    return ''
  }
}

export default function AsciiExhibit({ active = true }) {
  const [ascii, setAscii] = useState('')
  const panelRef = useRef(null)
  const targetRef = useRef({ x: 0, y: 0 })
  const currentRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef(0)

  useEffect(() => {
    if (!active) return

    let cancelled = false
    ;(async () => {
      const txt = await fetchAsciiWithFallback()
      if (cancelled) return
      setAscii(txt || '')
    })()

    return () => {
      cancelled = true
    }
  }, [active])

  useEffect(() => {
    if (!active) return
    const el = panelRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const cx = rect.width / 2 - PADDING_PX
    const cy = rect.height / 2 - PADDING_PX

    targetRef.current.x = cx
    targetRef.current.y = cy
    currentRef.current.x = cx
    currentRef.current.y = cy

    const setVars = (x, y) => {
      el.style.setProperty('--mx', `${x}px`)
      el.style.setProperty('--my', `${y}px`)
    }
    setVars(cx, cy)

    let mounted = true
    const tick = () => {
      if (!mounted) return
      const t = targetRef.current
      const c = currentRef.current

      c.x += (t.x - c.x) * 0.14
      c.y += (t.y - c.y) * 0.14

      setVars(c.x, c.y)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      mounted = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [active])

  const handlePointerMove = (e) => {
    const el = panelRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left - PADDING_PX
    const y = e.clientY - rect.top - PADDING_PX

    targetRef.current.x = x
    targetRef.current.y = y
  }

  if (!active) return null

  return (
    <Html transform center position={[0, 1.08, 0]} occlude={false}>
      <div
        ref={panelRef}
        className={styles.panel}
        onPointerMove={handlePointerMove}
      >
        <div className={styles.layerDim}>
          <pre className={styles.pre}>{ascii}</pre>
        </div>
        <div className={styles.layerBright}>
          <pre className={styles.pre}>{ascii}</pre>
        </div>
      </div>
    </Html>
  )
}

