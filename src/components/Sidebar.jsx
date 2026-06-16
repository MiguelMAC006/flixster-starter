import { useEffect } from 'react'
import './Sidebar.css'

const SECTIONS = [
  { id: 'films', label: 'Films' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'watched', label: 'Watched' },
]

const Sidebar = ({
  isOpen,
  view,
  onSelectView,
  onClose,
  favoriteCount = 0,
  watchedCount = 0,
}) => {
  // Close on Escape while open (mirrors MovieModal's pattern).
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const counts = { favorites: favoriteCount, watched: watchedCount }

  return (
    <>
      <div
        className={`sidebar__overlay${isOpen ? ' is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`sidebar${isOpen ? ' is-open' : ''}`}
        aria-label="Sections"
        aria-hidden={!isOpen}
      >
        <nav className="sidebar__nav">
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`sidebar__link${view === id ? ' is-active' : ''}`}
              onClick={() => onSelectView(id)}
            >
              <span>{label}</span>
              {id in counts && (
                <span className="sidebar__count">{counts[id]}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
