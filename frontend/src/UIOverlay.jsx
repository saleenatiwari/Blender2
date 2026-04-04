import { useNavigate } from 'react-router-dom'
import styles from './UIOverlay.module.css'

const projects = [
  { id: '1', label: 'Project 1' },
  { id: '2', label: 'Project 2' },
  { id: '3', label: 'Project 3' },
]

export default function UIOverlay({
  menuOpen,
  onToggleMenu,
  onSelectProject,
  activeProjectId,
  onBack,
  onNext,
}) {
  const navigate = useNavigate()

  return (
    <div className={styles.overlay}>
      <button
        type="button"
        className={styles.hamburger}
        onClick={onToggleMenu}
        aria-expanded={menuOpen}
        aria-label="Open menu"
      >
        <span className={styles.hamburgerLine} />
        <span className={styles.hamburgerLine} />
        <span className={styles.hamburgerLine} />
      </button>

      <div
        className={`${styles.scrim} ${menuOpen ? styles.scrimVisible : ''}`}
        onClick={onToggleMenu}
        aria-hidden={!menuOpen}
      />

      <aside
        className={`${styles.panel} ${menuOpen ? styles.panelOpen : ''}`}
        aria-hidden={!menuOpen}
      >
        <p className={styles.panelTitle}>Menu</p>
        <button
          type="button"
          className={`${styles.panelItem} ${styles.panelHome}`}
          onClick={() => {
            onToggleMenu()
            navigate('/')
          }}
        >
          Home
        </button>
        <ul className={styles.list}>
          {projects.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={`${styles.panelItem} ${
                  Number(activeProjectId) === Number(p.id) ? styles.panelItemActive : ''
                }`}
                onClick={() => {
                  onSelectProject?.(Number(p.id))
                }}
              >
                {p.label}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className={styles.bottomBar}>
        <button type="button" className={styles.glassBtn} onClick={onBack}>
          Back
        </button>
        <button type="button" className={styles.glassBtn} onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  )
}
