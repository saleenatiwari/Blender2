import { useNavigate } from 'react-router-dom'
import styles from './Landing.module.css'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.stars} aria-hidden />
      <div className={styles.vignette} aria-hidden />

      <main className={styles.content}>
        <h1 className={styles.title}>
          <span className={styles.scriptLine}>Welcome to</span>
          <span className={styles.scriptLine}>Saleena&rsquo;s 3D Exhibition</span>
          <span className={styles.scriptLine}>with Blender</span>
        </h1>

        <button
          type="button"
          className={styles.cta}
          onClick={() => navigate('/exhibition')}
        >
          Start Experience
        </button>

        <p className={styles.note}>
          Note: Please use Chrome on desktop for the best experience. This is a 3D interactive site
          and may lag on low-performance devices.
        </p>
      </main>
    </div>
  )
}
