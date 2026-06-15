import { useEffect } from 'react'
import PropTypes from 'prop-types'
import './MovieModal.css'

const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w780'

// "128" -> "2h 8m"; guards a missing/zero runtime.
const formatRuntime = (runtime) => {
  if (!runtime) return null
  const hours = Math.floor(runtime / 60)
  const minutes = runtime % 60
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

const MovieModal = ({ details, isLoading, error, onClose }) => {
  // Close on Escape, regardless of focus. Listener lives only while open.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Only a click on the backdrop itself (not a bubbled click from the card) closes.
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const backdropUrl = details?.backdrop_path
    ? `${BACKDROP_BASE_URL}${details.backdrop_path}`
    : null
  const runtime = formatRuntime(details?.runtime)
  const genres = details?.genres?.map((genre) => genre.name).join(', ')

  return (
    <div className="movie-modal__overlay" onClick={handleBackdropClick}>
      <div
        className="movie-modal"
        role="dialog"
        aria-modal="true"
        aria-label={details?.title ?? 'Movie details'}
      >
        <button
          type="button"
          className="movie-modal__close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        {isLoading && (
          <p className="movie-modal__status">Loading details…</p>
        )}

        {!isLoading && error && (
          <p className="movie-modal__status movie-modal__status--error">
            Couldn&apos;t load movie details. Please try again.
          </p>
        )}

        {!isLoading && !error && details && (
          <>
            {backdropUrl && (
              <img
                className="movie-modal__backdrop"
                src={backdropUrl}
                alt={`${details.title} backdrop`}
              />
            )}
            <div className="movie-modal__body">
              <h2 className="movie-modal__title">{details.title}</h2>
              <div className="movie-modal__meta">
                {runtime && <span>{runtime}</span>}
                {details.release_date && <span>{details.release_date}</span>}
              </div>
              {genres && <p className="movie-modal__genres">{genres}</p>}
              {details.overview && (
                <p className="movie-modal__overview">{details.overview}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

MovieModal.propTypes = {
  details: PropTypes.object,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onClose: PropTypes.func.isRequired,
}

export default MovieModal
