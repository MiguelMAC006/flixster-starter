import { useState, useEffect, useMemo } from 'react'
import MovieCard from './MovieCard'
import MovieModal from './MovieModal'
import { fetchNowPlaying, searchMovies, fetchMovieDetails } from '../services/tmdb'
import './MovieList.css'

const MovieList = ({
  mode,
  query,
  page,
  sortOption,
  onTotalPages,
  view = 'films',
  favorites = {},
  watched = {},
  onToggleFavorite = () => {},
  onToggleWatched = () => {},
}) => {
  const [movies, setMovies] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Modal: the clicked movie's id drives a separate details fetch.
  const [selectedMovieId, setSelectedMovieId] = useState(null)
  const [details, setDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState(null)

  useEffect(() => {
    // Don't fetch a search with no query (e.g. right after clearing).
    if (mode === 'search' && !query) {
      return
    }

    let ignore = false

    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data =
          mode === 'search'
            ? await searchMovies(query, page)
            : await fetchNowPlaying(page)

        if (ignore) return

        const results = data.results ?? []
        // Page 1 replaces the list (initial load, new search, toggle);
        // later pages append (Load More).
        setMovies((prevMovies) =>
          page === 1 ? results : [...prevMovies, ...results]
        )
        onTotalPages(data.total_pages ?? 1)
      } catch (err) {
        if (ignore) return
        setError(err.message ?? 'Failed to load movies.')
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    load()

    // Discard this fetch's result if mode/query/page changed before it landed.
    return () => {
      ignore = true
    }
  }, [mode, query, page, onTotalPages])

  // Fetch full details whenever a movie is selected; skip when none is.
  useEffect(() => {
    if (selectedMovieId === null) return

    let ignore = false

    const load = async () => {
      setDetailsLoading(true)
      setDetailsError(null)
      try {
        const data = await fetchMovieDetails(selectedMovieId)
        if (ignore) return
        setDetails(data)
      } catch (err) {
        if (ignore) return
        setDetailsError(err.message ?? 'Failed to load movie details.')
      } finally {
        if (!ignore) setDetailsLoading(false)
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [selectedMovieId])

  const handleCardClick = (id) => setSelectedMovieId(id)

  // Clear details too so reopening a card never flashes the previous movie.
  const handleCloseModal = () => {
    setSelectedMovieId(null)
    setDetails(null)
    setDetailsError(null)
  }

  // The feed shows fetched movies; the favorites/watched views show the saved
  // movie objects instead so they render even when not in the current feed.
  const baseMovies = useMemo(() => {
    if (view === 'favorites') return Object.values(favorites)
    if (view === 'watched') return Object.values(watched)
    return movies
  }, [view, favorites, watched, movies])

  // Sorting is a render-time transform: copy the list (never mutate it) and
  // reorder by the selected option. "default" keeps the source order.
  const sortedMovies = useMemo(() => {
    const copy = [...baseMovies]
    switch (sortOption) {
      case 'title':
        return copy.sort((a, b) => a.title.localeCompare(b.title))
      case 'release_date':
        return copy.sort(
          (a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0)
        )
      case 'vote_average':
        return copy.sort((a, b) => b.vote_average - a.vote_average)
      default:
        return copy
    }
  }, [baseMovies, sortOption])

  // The favorites/watched views are local — skip the feed's loading/error/empty
  // states (which only describe the fetched feed) and show their own empty text.
  if (view === 'favorites' || view === 'watched') {
    if (sortedMovies.length === 0) {
      return (
        <p className="movie-list__status">
          {view === 'favorites' ? 'No favorites yet.' : 'No watched movies yet.'}
        </p>
      )
    }
  } else {
    // Full-screen loading only on a fresh list (page 1); appends keep the grid.
    if (isLoading && page === 1) {
      return <p className="movie-list__status">Loading movies…</p>
    }

    if (error) {
      return (
        <p className="movie-list__status movie-list__status--error">{error}</p>
      )
    }

    if (movies.length === 0) {
      return <p className="movie-list__status">No movies found.</p>
    }
  }

  return (
    <div className="movie-list">
      {sortedMovies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          onClick={handleCardClick}
          isFavorite={!!favorites[movie.id]}
          isWatched={!!watched[movie.id]}
          onToggleFavorite={onToggleFavorite}
          onToggleWatched={onToggleWatched}
        />
      ))}
      {selectedMovieId !== null && (
        <MovieModal
          details={details}
          isLoading={detailsLoading}
          error={detailsError}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

export default MovieList
