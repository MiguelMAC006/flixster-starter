import { useState, useCallback } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import SearchBar from './components/SearchBar'
import SortControl from './components/SortControl'
import MovieList from './components/MovieList'
import Footer from './components/Footer'
import './App.css'

const App = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [mode, setMode] = useState('now_playing')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortOption, setSortOption] = useState('default')

  // Favorites/watched keyed by movie.id -> full movie object, so saved cards
  // render in their views even when not in the current feed. Session-only.
  const [favorites, setFavorites] = useState({})
  const [watched, setWatched] = useState({})
  const [view, setView] = useState('films')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleQueryChange = (value) => setSearchQuery(value)

  const handleSearch = () => {
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    setSubmittedQuery(trimmed)
    setMode('search')
    setPage(1)
  }

  const handleClear = () => {
    setSearchQuery('')
    setSubmittedQuery('')
    setMode('now_playing')
    setPage(1)
  }

  const handleLoadMore = () => setPage((prevPage) => prevPage + 1)

  const handleSortChange = (value) => setSortOption(value)

  // Toggle membership, storing/removing the whole movie object.
  const toggleFavorite = useCallback((movie) => {
    setFavorites((prev) => {
      const next = { ...prev }
      if (next[movie.id]) delete next[movie.id]
      else next[movie.id] = movie
      return next
    })
  }, [])

  const toggleWatched = useCallback((movie) => {
    setWatched((prev) => {
      const next = { ...prev }
      if (next[movie.id]) delete next[movie.id]
      else next[movie.id] = movie
      return next
    })
  }, [])

  const handleSelectView = (nextView) => {
    setView(nextView)
    setIsSidebarOpen(false)
  }

  // Stable so it doesn't re-trigger MovieList's fetch effect on every render.
  const handleTotalPages = useCallback((total) => setTotalPages(total), [])

  // Load More only applies to the paged Films feed; favorites/watched are
  // local lists with nothing more to fetch.
  const hasMore = view === 'films' && page < totalPages

  const sectionTitle =
    view === 'favorites'
      ? 'Favorites'
      : view === 'watched'
        ? 'Watched'
        : mode === 'search'
          ? `Results for “${submittedQuery}”`
          : 'Now Playing'

  return (
    <div className="app">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <Sidebar
        isOpen={isSidebarOpen}
        view={view}
        onSelectView={handleSelectView}
        onClose={() => setIsSidebarOpen(false)}
        favoriteCount={Object.keys(favorites).length}
        watchedCount={Object.keys(watched).length}
      />
      <main className="app__main">
        <div className="filter-bar">
          <SortControl sortOption={sortOption} onSortChange={handleSortChange} />
          <SearchBar
            query={searchQuery}
            onQueryChange={handleQueryChange}
            onSearch={handleSearch}
            onClear={handleClear}
          />
        </div>
        <h2 className="section-title">{sectionTitle}</h2>
        <MovieList
          mode={mode}
          query={submittedQuery}
          page={page}
          sortOption={sortOption}
          onTotalPages={handleTotalPages}
          view={view}
          favorites={favorites}
          watched={watched}
          onToggleFavorite={toggleFavorite}
          onToggleWatched={toggleWatched}
        />
        {hasMore && (
          <div className="load-more">
            <button
              type="button"
              className="load-more__btn"
              onClick={handleLoadMore}
            >
              Load More
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default App
