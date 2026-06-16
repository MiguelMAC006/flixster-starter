import './MovieCard.css'

const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500'
const FALLBACK_POSTER = '/movie.png'

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
)

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5c-5 0-9.27 3.11-11 7.5C2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5zm0 12.5a5 5 0 110-10 5 5 0 010 10z" />
    <circle cx="12" cy="12.5" r="2.5" />
  </svg>
)

const MovieCard = ({
  movie,
  onClick = () => {},
  isFavorite = false,
  isWatched = false,
  onToggleFavorite = () => {},
  onToggleWatched = () => {},
}) => {
  const posterUrl = movie.poster_path
    ? `${POSTER_BASE_URL}${movie.poster_path}`
    : FALLBACK_POSTER

  // Pass the whole movie up so favorites/watched views can render saved cards
  // even when they're not in the current feed.
  const handleFavorite = (e) => {
    e.stopPropagation()
    onToggleFavorite(movie)
  }

  const handleWatched = (e) => {
    e.stopPropagation()
    onToggleWatched(movie)
  }

  return (
    <article className="movie-card" onClick={() => onClick(movie.id)}>
      <div className="movie-card__poster-wrap">
        <img
          className="movie-card__poster"
          src={posterUrl}
          alt={movie.title}
          loading="lazy"
        />
        <div className="movie-card__actions movie-card__actions--left">
          <button
            type="button"
            className={`movie-card__icon-btn movie-card__icon-btn--fav${
              isFavorite ? ' is-active' : ''
            }`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={isFavorite}
            onClick={handleFavorite}
          >
            <HeartIcon />
          </button>
        </div>
        <div className="movie-card__actions movie-card__actions--right">
          <button
            type="button"
            className={`movie-card__icon-btn movie-card__icon-btn--watched${
              isWatched ? ' is-active' : ''
            }`}
            aria-label={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
            aria-pressed={isWatched}
            onClick={handleWatched}
          >
            <EyeIcon />
          </button>
        </div>
      </div>
      <div className="movie-card__info">
        <h3 className="movie-card__title">{movie.title}</h3>
        <span className="movie-card__rating">
          ★ {movie.vote_average?.toFixed(1) ?? 'N/A'}
        </span>
      </div>
    </article>
  )
}

export default MovieCard
