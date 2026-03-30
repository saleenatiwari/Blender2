import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import styles from './Project3Ascii.module.css'
import asciiArt3Url from './assets/ascii-art-3.txt?url'

// ── Cursor trail config ───────────────────────────────────────────────
const FLAIR_COUNT = 8
const LERP        = [0.30, 0.22, 0.17, 0.13, 0.11, 0.09, 0.08, 0.07]
const SIZES       = [14, 12, 11, 10, 9, 8, 7, 6]
const ALPHAS      = [0.88, 0.72, 0.58, 0.46, 0.35, 0.25, 0.17, 0.10]

// ── Glow config ───────────────────────────────────────────────────────
const GLOW_R   = 80    // px radius of the soft-light circle
const DECAY_MS = 850   // how long a lit char takes to fade back to white

// ── Helpers ───────────────────────────────────────────────────────────
const smoothstep = (t) => t * t * (3 - 2 * t)  // t already 0-1

// Build text-shadow string for a given glow intensity (0–1)
function glowShadow(intensity) {
  const a1 = (0.90 * intensity).toFixed(3)
  const a2 = (0.55 * intensity).toFixed(3)
  const a3 = (0.22 * intensity).toFixed(3)
  const r1 = (3  + 5  * intensity).toFixed(1)
  const r2 = (6  + 10 * intensity).toFixed(1)
  const r3 = (12 + 18 * intensity).toFixed(1)
  return `0 0 ${r1}px rgba(255,77,248,${a1}),0 0 ${r2}px rgba(255,77,248,${a2}),0 0 ${r3}px rgba(255,77,248,${a3})`
}

// Pink #ff4df8 → white #ffffff interpolation
function glowColor(intensity) {
  const g = Math.round(77  + (255 - 77)  * (1 - intensity))   // 255→77
  const b = Math.round(248 + (255 - 248) * (1 - intensity))   // 255→248
  return `rgb(255,${g},${b})`
}

export default function Project3Ascii({ active = true }) {
  const [asciiText, setAsciiText] = useState('')

  // ── Refs: trail ───────────────────────────────────────────────────
  const flairRefs = useRef([])
  const trailTick = useRef(null)

  // ── Refs: glow ────────────────────────────────────────────────────
  const preRef      = useRef(null)
  const lineRefs    = useRef([])      // 268 line-div refs
  const metrics     = useRef(null)    // { charW, lineOffsets, padLeft }
  // glowMap: span el → { state:'glow'|'decay', intensity, decayStart, startIntensity }
  const glowMap     = useRef(new Map())
  const mousePos    = useRef({ x: -1e6, y: -1e6 })
  const glowTick    = useRef(null)

  // ── Load ascii-art-3.txt ─────────────────────────────────────────
  useEffect(() => {
    if (!active) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(asciiArt3Url)
        if (res.ok && !cancelled) setAsciiText(await res.text())
      } catch {/* ignore */}
    })()
    return () => { cancelled = true }
  }, [active])

  // ── Measure font metrics once the DOM is painted ─────────────────
  useLayoutEffect(() => {
    if (!asciiText) return
    const id = requestAnimationFrame(() => {
      const pre = preRef.current
      if (!pre) return

      const firstLine = lineRefs.current.find(Boolean)
      if (!firstLine || !firstLine.children[0]) return

      const spanRect = firstLine.children[0].getBoundingClientRect()
      const padLeft  = parseFloat(getComputedStyle(pre).paddingLeft) || 0

      // Store offsetTop+halfHeight for each line (relative to pre, scroll-stable)
      const lineOffsets = lineRefs.current.map(div =>
        div ? div.offsetTop + div.offsetHeight / 2 : 0
      )

      metrics.current = { charW: spanRect.width, lineOffsets, padLeft }
    })
    return () => cancelAnimationFrame(id)
  }, [asciiText])

  // ── Glow ticker ──────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return

    const tick = () => {
      const m = metrics.current
      if (!m) return

      const pre = preRef.current
      if (!pre) return

      const preRect = pre.getBoundingClientRect()
      const mx = mousePos.current.x
      const my = mousePos.current.y
      const now = performance.now()

      const { charW, lineOffsets, padLeft } = m
      const lineStartX = preRect.left + padLeft

      // ── 1. Find chars in glow radius and light them ────────────────
      const nowGlowing = new Set()

      for (let li = 0; li < lineOffsets.length; li++) {
        const lineAbsY = preRect.top + lineOffsets[li]
        if (Math.abs(lineAbsY - my) > GLOW_R) continue

        const lineDiv = lineRefs.current[li]
        if (!lineDiv) continue
        const numChars = lineDiv.children.length

        for (let ci = 0; ci < numChars; ci++) {
          const charAbsX = lineStartX + ci * charW + charW * 0.5
          const dist = Math.hypot(charAbsX - mx, lineAbsY - my)

          if (dist < GLOW_R) {
            // Distance-based intensity: bright at center, fades at edge
            const raw       = 1 - dist / GLOW_R
            const intensity = raw * raw   // quadratic falloff — more natural light feel

            const span = lineDiv.children[ci]
            // Kill any running decay so the span stays fully lit
            glowMap.current.set(span, { state: 'glow', intensity })
            span.style.color      = glowColor(intensity)
            span.style.textShadow = glowShadow(intensity)
            nowGlowing.add(span)
          }
        }
      }

      // ── 2. Start decay for spans that just left the radius ─────────
      for (const [span, data] of glowMap.current) {
        if (data.state === 'glow' && !nowGlowing.has(span)) {
          glowMap.current.set(span, {
            state         : 'decay',
            startTime     : now,
            startIntensity: data.intensity,
          })
        }
      }

      // ── 3. Advance all decaying spans ──────────────────────────────
      const done = []
      for (const [span, data] of glowMap.current) {
        if (data.state !== 'decay') continue
        const t = Math.min(1, (now - data.startTime) / DECAY_MS)
        const intensity = data.startIntensity * (1 - smoothstep(t))

        if (t >= 1) {
          span.style.color      = ''
          span.style.textShadow = ''
          done.push(span)
        } else {
          span.style.color      = glowColor(intensity)
          span.style.textShadow = glowShadow(intensity)
        }
      }
      for (const span of done) glowMap.current.delete(span)
    }

    glowTick.current = tick
    gsap.ticker.add(tick)

    return () => {
      gsap.ticker.remove(tick)
      // Reset any lingering styles
      for (const [span] of glowMap.current) {
        span.style.color      = ''
        span.style.textShadow = ''
      }
      glowMap.current.clear()
    }
  }, [active])

  // ── Cursor trail ticker ──────────────────────────────────────────
  useEffect(() => {
    if (!active) return

    const flairs = flairRefs.current.filter(Boolean)
    if (!flairs.length) return

    gsap.set(flairs, { xPercent: -50, yPercent: -50, x: -300, y: -300 })

    const xSet = flairs.map(el => gsap.quickSetter(el, 'x', 'px'))
    const ySet = flairs.map(el => gsap.quickSetter(el, 'y', 'px'))
    const pos  = Array.from({ length: FLAIR_COUNT }, () => ({ x: -300, y: -300 }))
    const trailMouse = { x: -300, y: -300 }
    let idleTimer = null

    const onMove = (e) => {
      trailMouse.x = e.clientX
      trailMouse.y = e.clientY
      gsap.to(flairs, {
        opacity   : (i) => ALPHAS[i],
        duration  : 0.25,
        stagger   : 0.02,
        overwrite : true,
      })
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() =>
        gsap.to(flairs, { opacity: 0, duration: 0.7, stagger: 0.05, overwrite: true }),
        1400,
      )
    }

    window.addEventListener('mousemove', onMove)

    const tick = () => {
      pos[0].x += (trailMouse.x - pos[0].x) * LERP[0]
      pos[0].y += (trailMouse.y - pos[0].y) * LERP[0]
      xSet[0](pos[0].x); ySet[0](pos[0].y)

      for (let i = 1; i < flairs.length; i++) {
        pos[i].x += (pos[i - 1].x - pos[i].x) * LERP[i]
        pos[i].y += (pos[i - 1].y - pos[i].y) * LERP[i]
        xSet[i](pos[i].x); ySet[i](pos[i].y)
      }
    }

    trailTick.current = tick
    gsap.ticker.add(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      clearTimeout(idleTimer)
      gsap.ticker.remove(tick)
    }
  }, [active])

  // ── Mouse tracking ───────────────────────────────────────────────
  const handleMouseMove = (e) => {
    mousePos.current = { x: e.clientX, y: e.clientY }
  }
  const handleMouseLeave = () => {
    mousePos.current = { x: -1e6, y: -1e6 }
  }

  // ── Memoised character grid ───────────────────────────────────────
  const lines = useMemo(() => (asciiText ? asciiText.split('\n') : []), [asciiText])

  if (!active || !asciiText) return null

  return (
    <>
      {/* Fixed-position trail dots */}
      {Array.from({ length: FLAIR_COUNT }, (_, i) => (
        <div
          key={i}
          ref={el => { flairRefs.current[i] = el }}
          className={styles.flair}
          style={{ width: SIZES[i], height: SIZES[i], opacity: 0 }}
        />
      ))}

      <div
        className={styles.container}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <pre ref={preRef} className={styles.pre}>
          {lines.map((line, li) => (
            <div
              key={li}
              ref={el => { lineRefs.current[li] = el }}
              className={styles.line}
            >
              {line.split('').map((char, ci) => (
                <span key={`${li}-${ci}`} className={styles.char}>
                  {char === ' ' ? '\u00a0' : char}
                </span>
              ))}
            </div>
          ))}
        </pre>
      </div>
    </>
  )
}
