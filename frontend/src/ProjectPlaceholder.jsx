import styles from './ProjectPlaceholder.module.css'

export default function ProjectPlaceholder({ number }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.badge}>Project {number}</div>
        <h2 className={styles.title}>3D Animation</h2>
        <p className={styles.sub}>Coming soon</p>
        <div className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="16" width="48" height="32" rx="4" stroke="currentColor" strokeWidth="2"/>
            <polygon points="26,24 26,40 42,32" fill="currentColor" opacity="0.7"/>
            <rect x="20" y="52" width="24" height="2" rx="1" fill="currentColor" opacity="0.35"/>
            <rect x="30" y="48" width="4" height="4" rx="1" fill="currentColor" opacity="0.35"/>
          </svg>
        </div>
        <p className={styles.hint}>
          Blender animation will play here.<br/>
          Scrub the timeline to explore.
        </p>
      </div>
    </div>
  )
}
