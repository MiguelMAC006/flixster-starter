# Component Architecture:
### App
- Responsibility: Root component; owns the app-level orchestration state (search, mode, pagination, sort) and wires every child together. The actual fetch (Now Playing or Search) and the modal/details state both live in MovieList, driven by props from App.
- Renders: The entire page — Header, SearchBar, SortControl, MovieList, Footer, and the "Load More" button.
- Props: none (root).
- States: searchQuery, submittedQuery, mode, page, totalPages, sortOption (see State Architecture). The `movies` array and the `isLoading`/`error` flags — plus all modal/details state (`selectedMovieId`, `details`, `detailsLoading`, `detailsError`) — are owned by MovieList.
- Children: Header, SearchBar, SortControl, MovieList, Footer

### Header
- Responsibility: Display the app logo/title and banner.
- Renders: Logo image and heading text.
- Props: none.
- States: None
- Children: None

### SearchBar
- Responsibility: Let the user type a query and search, submit, or clear results.
- Renders: A form with a text input, a Submit/Search button, and a Clear button.
- Props: query (string), onQueryChange (fn), onSearch (fn), onClear (fn).
- States: None (controlled by App via props).
- Children: None

### SortControl (Browse)
- Responsibility: Sort the current movie list by title, release date, or vote average using a dropdown.
- Renders: A `<select>` dropdown with sort options.
- Props: sortOption (string), onSortChange (fn).
- States: None (controlled by App via props).
- Children: None

### MovieList
- Responsibility: Fetch the movie list (Now Playing or Search) from TMDb, lay out the grid of MovieCard components, and own the modal — including the per-movie details fetch.
- Renders: A responsive grid of MovieCards (plus loading and error states), and the MovieModal when a card is selected.
- Props: mode ("now_playing" | "search"), query (string, the submitted search text), page (number), sortOption (string — "default" | "title" | "release_date" | "vote_average"; selects the render-time sort), onTotalPages (fn — reports the response's `total_pages` up to App). It owns the card-click handler internally (`handleCardClick`) rather than receiving an `onCardClick` prop.
- States: movies (Array, init []), isLoading (Boolean, init false), error (String|null, init null). Modal/details state lives here too: selectedMovieId (Number|null, init null), details (Object|null, init null), detailsLoading (Boolean, init false), detailsError (String|null, init null). (`totalPages` is reported up to App, which owns it.)
- Triggers: (1) A useEffect keyed on `[mode, query, page, onTotalPages]` fetches the matching list endpoint — when `page === 1` the results **replace** `movies`, when `page > 1` they are **appended**; `total_pages` is reported up via `onTotalPages` so App can hide/disable "Load More". (2) A second useEffect keyed on `[selectedMovieId]` calls `fetchMovieDetails(id)` when a card is selected, storing the response in `details` (with an `ignore` flag to discard a stale response).
- Children: MovieCard, MovieModal

### MovieCard
- Responsibility: Display a movie's poster, title, and rating; on click open the MovieModal.
- Renders: A tile with a poster image, title, vote average, and favorite/watched toggle icons.
- Props: movie ({ id, title, poster_path, vote_average }), onClick (fn — called with `movie.id` when the card is clicked, opening the modal), isFavorite (bool), isWatched (bool), onToggleFavorite (fn), onToggleWatched (fn). The favorite/watched icon buttons `stopPropagation` so toggling them doesn't also open the modal.
- States: None.
- ⚠️ **As-built note:** The heart/eye toggle buttons are built and render on every card, but the favorites/watched props (`isFavorite`, `isWatched`, `onToggleFavorite`, `onToggleWatched`) currently **default to `false`/no-op** because MovieList does not yet pass them — no `favorites`/`watched` state is wired from a parent. So the toggles render with the correct UI but have no effect today. Wiring this state (in App or MovieList) is the planned next step — see State Architecture.
- Children: None

### MovieModal
- Responsibility: Display full details for the selected movie, plus an AI-generated watch recommendation (see AI Feature Spec).
- Renders: A centered, shadowed pop-up over a darkened (semi-transparent) backdrop showing backdrop image, title, runtime, release date, genres, overview, and a "Watch Recommendation" section with the AI take (or a loading indicator / fallback). Also renders loading and error states so a failed details fetch never leaves a broken modal.
- Props: details (object|null — the fetched Movie Details), isLoading (bool), error (string|null), onClose (fn). The AI insight is fetched and held in MovieModal's own state (`aiInsight`, `loadingInsight`) via a `useEffect` on `details` — it is not passed in as a prop.
- Open trigger: The user clicks a MovieCard; the card calls `onClick(movie.id)`, which is MovieList's `handleCardClick`. MovieList stores the id in `selectedMovieId`, fetches the details, and renders MovieModal once an id is set (passing `details`/`isLoading`/`error`/`onClose`).
- Close mechanisms (all call `onClose` — MovieList's `handleCloseModal`, which clears `selectedMovieId`, `details`, and `detailsError`): an `×` button, clicking the darkened backdrop (but not the modal card itself), and pressing the **Escape** key.
- States: aiInsight (String|null, init null), loadingInsight (Boolean, init false) — for the AI recommendation. Otherwise presentational for the TMDb details, which are driven by props.
- Children: None

### Footer
- Responsibility: Display copyright information and relevant links.
- Renders: Text and links.
- Props: none.
- States: None
- Children: None

### Hierarchy:
```
App
├── Header
├── SearchBar
├── SortControl (Browse)
├── MovieList
│   ├── MovieCard (×N)
│   └── MovieModal (conditional, when selectedMovieId !== null)
└── Footer
```


# API Contracts:
All TMDb calls go through a thin service layer in `src/services/tmdb.js` (no React) so components never build URLs or call `fetch` directly. The contract URLs below map 1:1 to its exported functions: `fetchNowPlaying(page)`, `searchMovies(query, page)` (and later `fetchMovieDetails(id)`).

### Now Playing
- URL: `GET https://api.themoviedb.org/3/movie/now_playing`
- Parameters: `api_key` (required), `language` (e.g. `en-US`), `page` (number, for "Load More")
- Response fields used: `results[]` → `id`, `title`, `poster_path`, `vote_average`; `page`; `total_pages`
- Error cases: non-200 status (bad/expired key), empty `results`, network failure, reaching `total_pages` (disable "Load More")

### Search
- URL: `GET https://api.themoviedb.org/3/search/movie`
- Parameters: `api_key` (required), `query` (required, the search text), `page` (number)
- Response fields used: same `results[]` shape as Now Playing (`id`, `title`, `poster_path`, `vote_average`)
- Error cases: empty query, zero results (show "no movies found"), non-200 status, network failure

### Movie Details
- URL: `GET https://api.themoviedb.org/3/movie/{movie_id}` (the movie id is a **path** parameter). Exposed as `fetchMovieDetails(id)` in the service layer.
- Parameters: `api_key` (required), `language` (e.g. `en-US`), `append_to_response=videos` (optional — for the stretch trailer feature)
- Response fields used: `title`, `runtime`, `release_date`, `genres[].name`, `overview`, `backdrop_path` (and `videos.results[]` for trailers if implemented)
- Error cases: **movie not found (404)** for an invalid `movie_id`; **bad/expired API key (401)**; **network failure**. All three throw in the service (`request()` rejects on non-2xx), surface via App's `detailsError`, and render as a friendly message in the modal rather than a broken modal. Additionally, missing `backdrop_path` or `runtime` are handled gracefully (those fields are simply omitted from the render).

Image transformation (not an endpoint): posters and backdrops are built from the base URL
`https://image.tmdb.org/t/p/w500{poster_path}` (use a larger size such as `w780`/`original` for the modal backdrop).


# State Architecture:
### movies
- Type: Array<Movie>
- Initial Value: []
- Component: MovieList
- Trigger: Fetch keyed on `[mode, query, page]`. Page 1 **replaces** the array (initial load, new search, mode switch); page > 1 **appends** ("Load More"). The array itself always stays in fetch order — sorting reorders a **derived copy at render time** (`useMemo` on `[movies, sortOption]`), never mutating `movies`.

### searchQuery
- Type: String
- Initial Value: ""
- Component: App
- Trigger: User types in the SearchBar input (onQueryChange) — this is the live, controlled input value; reset to "" on Clear / "Now Playing"

### submittedQuery
- Type: String
- Initial Value: ""
- Component: App
- Trigger: Set to the current `searchQuery` when the user submits the SearchBar (Enter or Search button). This is the value actually sent to the Search endpoint, kept separate from the live input so typing doesn't re-fetch on every keystroke. Reset to "" on Clear / "Now Playing".

### mode
- Type: String ("now_playing" | "search")
- Initial Value: "now_playing"
- Component: App
- Trigger: Set to "search" on a non-empty search submit; reset to "now_playing" on Clear / "Now Playing". Determines which endpoint MovieList fetches.

### page
- Type: Number
- Initial Value: 1
- Component: App
- Trigger: Incremented by the "Load More" button (triggers an append fetch). Reset to 1 whenever the mode or submitted query changes (new search, return to Now Playing).

### totalPages
- Type: Number
- Initial Value: 1
- Component: MovieList (reported up to App via onTotalPages)
- Trigger: Set from the API response's `total_pages` after each fetch. App compares it against `page` to hide/disable "Load More" once the last page is reached.

### selectedMovieId
- Type: Number | null
- Initial Value: null
- Component: MovieList
- Trigger: User clicks a MovieCard (set to that card's `movie.id` via `handleCardClick`); cleared to null on modal close. A non-null value both (a) drives the details fetch effect and (b) gates whether MovieModal renders.

### details
- Type: Object | null
- Initial Value: null
- Component: MovieList
- Trigger: Set to the Movie Details response when the details fetch (keyed on `selectedMovieId`) resolves; cleared to null on modal close so a reopened card never flashes the previous movie. Passed to MovieModal as `details`.

### detailsLoading
- Type: Boolean
- Initial Value: false
- Component: MovieList
- Trigger: Set true before the details fetch, false after it resolves/rejects. Passed to MovieModal as `isLoading` to drive the modal's loading state.

### detailsError
- Type: String | null
- Initial Value: null
- Component: MovieList
- Trigger: Set when the details fetch fails (404/401/network); cleared before the next fetch and on modal close. Passed to MovieModal as `error` to drive the friendly error message.

### sortOption
- Type: String
- Initial Value: "default"
- Component: App
- Trigger: User selects an option in the SortControl dropdown ("title" | "release_date" | "vote_average")

### isLoading
- Type: Boolean
- Initial Value: false
- Component: MovieList
- Trigger: Set true before the Now Playing fetch, false after it resolves/rejects

### error
- Type: String | null
- Initial Value: null
- Component: MovieList
- Trigger: Set when the Now Playing fetch fails; cleared on the next successful fetch

> ⚠️ **Not yet implemented.** The `favorites`/`watched` entries below describe the
> *planned* design. MovieCard already renders the heart/eye toggle buttons, but no
> parent owns this state or passes the toggle props yet, so the buttons are no-ops
> today. This is the intended next step.

### favorites (planned)
- Type: Array<number> (movie ids) or Set
- Initial Value: []
- Component: App (planned)
- Trigger: User clicks the heart icon on a MovieCard (onToggleFavorite). To be lifted to App so a Favorites page can read it.

### watched (planned)
- Type: Array<number> (movie ids) or Set
- Initial Value: []
- Component: App (planned)
- Trigger: User clicks the eye icon on a MovieCard (onToggleWatched). To be lifted to App so a Watched page can read it.

### isFavorite / isWatched (planned, derived per card)
- Type: Boolean
- Initial Value: false
- Component: MovieCard (would derive from App's `favorites`/`watched` via props)
- Trigger: Recomputed whenever favorites/watched change. Currently the props default to `false`, so cards always render the inactive state.

> The `ai*` state below is implemented as part of the AI Watch Recommendation milestone. It lives in **MovieModal** (not App), keyed on the `details` prop — see AI Feature Spec.

### aiInsight
- Type: String | null
- Initial Value: null
- Component: MovieModal
- Trigger: Set to the AI text when `getMovieInsight()` resolves after `details` loads. The service returns a friendly fallback string (rather than throwing) on any failure, so this holds either the recommendation or the fallback.

### loadingInsight
- Type: Boolean
- Initial Value: false
- Component: MovieModal
- Trigger: Set true while the AI recommendation is generating, false when done. Drives the `✨ Getting a recommendation…` indicator.


# Data Flow:
App owns the orchestration state (`mode`, `submittedQuery`, `page`, `totalPages`) and passes `mode`/`query`/`page` down to **MovieList** — but App itself does no network or data work. The actual fetching lives in the **`src/services/tmdb.js`** layer (`fetchNowPlaying(page)`, `searchMovies(query, page)`), which build the URL and return the raw JSON. MovieList runs a `useEffect` keyed on `[mode, query, page]`: it picks the matching service function, reads the `results[]` array, and stores it in its own `movies` state. When `page === 1` the results **replace** `movies` (initial load, a new search, or returning to Now Playing); when `page > 1` they are **appended** (Load More). MovieList reports `total_pages` back up to App via `onTotalPages` so App can show/hide the Load More button (`page < totalPages`). Each card only needs `id`, `title`, `poster_path`, and `vote_average`, and the `poster_path` is turned into a full URL (`https://image.tmdb.org/t/p/w500{poster_path}`) inside MovieCard at render time. MovieList maps over `movies` and renders one **MovieCard** per movie, passing each `movie` object and the click handler. (Passing `isFavorite`/`isWatched` flags derived from a `favorites`/`watched` store is planned but not yet wired — MovieCard's toggle props default to no-ops, so the heart/eye buttons render but don't persist anything yet.)

When a user clicks a MovieCard, the card calls `onClick(movie.id)`; MovieList passes its own `handleCardClick` as that `onClick`, so the clicked movie's **id is stored in MovieList's `selectedMovieId`**. MovieList owns a second `useEffect` keyed on `[selectedMovieId]` that — when the id is non-null — calls `fetchMovieDetails(id)` (the `/movie/{id}` service function), storing the response in `details` (with `detailsLoading`/`detailsError` alongside) using an `ignore` flag to discard a stale response if the selection changes. MovieList renders **MovieModal** (which fetches the AI insight but not the TMDb details) whenever `selectedMovieId !== null`, passing `details`, `detailsLoading` (as `isLoading`), and `detailsError` (as `error`). The details response is transformed for display inside the modal: `genres[]` is mapped to a comma-separated list of `name`s, `runtime` is formatted into hours/minutes, and `backdrop_path` is expanded into a full image URL (`w780`). Closing the modal (× button, backdrop click, or Escape) calls MovieList's `handleCloseModal`, clearing `selectedMovieId`, `details`, and `detailsError`. Sorting is a render-time transformation **inside MovieList** (the owner of that array): App holds `sortOption` and passes it down, and MovieList derives a sorted **copy** of `movies` via `useMemo` (title → A-Z, release date → newest first, vote average → highest first; "default" keeps API order) and maps over that copy. The source `movies` array is never reordered, so the pagination append logic is unaffected. Searching swaps the endpoint MovieList fetches — so the data path to MovieCard stays the same.


### AI Feature Spec:

**Where it lives.** The AI insight is displayed in **MovieModal**, alongside the movie details. The details/modal state ended up owned by **MovieList** (not App), and MovieModal already receives the fetched `details` object as a prop. So the AI state lives **inside MovieModal itself** (`aiInsight`, `loadingInsight`), keyed off the `details` it receives — this keeps the feature self-contained and avoids threading three more props through MovieList. The OpenRouter call is extracted into a thin service (`src/services/openrouter.js → getMovieInsight()`) so the component never calls `fetch` directly, matching the TMDb service-layer pattern.

**Provider / endpoint.** OpenRouter, `POST https://openrouter.ai/api/v1/chat/completions`. The request is made **directly from the client** (not through a backend), so it is visible in DevTools → Network. Key comes from `import.meta.env.VITE_OPENROUTER_API_KEY` (in `.env`, gitignored). Model: `openrouter/free` (a free-tier model).

#### Prompt Spec
- **Role (system):** An enthusiastic but honest film critic who gives quick, personal watch recommendations.
- **Task (user):** Write a 2–3 sentence "watch recommendation" telling the reader whether the movie is worth their evening and why.
- **Inputs:** `title`, `genres` (comma-separated list), and `overview` — passed in the user message.
- **Output format:** Plain text only. 2–3 sentences. No markdown, no lists, no headings. No spoilers. No first-person "I" statements.
- **Constraints:** No plot spoilers; no comparisons to other films unless genuinely helpful; avoid generic hype like "a must-see" or "instant classic"; base the take only on the supplied data; second-person/neutral voice (talk to the reader, not about yourself).
- **Failure behavior:** While in flight, the modal shows `✨ Getting a recommendation…` (driven by `loadingInsight`). On any failure (non-OK status, network error, empty response) the catch returns a friendly fallback string: **"We couldn't generate a recommendation for this one — check out the overview above!"** The rest of the modal still renders normally.

#### State / Trigger
- **State (in MovieModal):** `aiInsight` (string|null, init `null`) and `loadingInsight` (boolean, init `false`).
- **Trigger:** A `useEffect` keyed on the fetched `details` — once details are loaded (and not in a loading/error state), call `getMovieInsight(title, genres, overview)`. The effect uses an `ignore` flag so a stale response is discarded if the user switches movies.
- **Reset on close:** Because MovieModal unmounts when the modal closes (it's only rendered while `selectedMovieId !== null`) and `details` is cleared, the next movie starts fresh with `aiInsight = null` / `loadingInsight = false` automatically.

### AI Feature — Decisions Log
- **What the API returned initially:** With a bare prompt the model returned solid 2–3 sentence takes, but it leaned on generic hype ("an absolute must-see!", "you won't want to miss this") and occasionally slipped into first-person ("I loved…") and markdown bullet formatting.
- **What I changed in my prompt:** Tightened the system message to explicitly ban first-person "I" statements, generic hype phrases ("must-see"/"instant classic"), markdown, and spoilers, and to cap length at 2–3 sentences in a second-person voice. Moved the movie context (title / comma-separated genres / overview) into the user message so the system message stays a stable instruction block. Added `.trim()` on the returned text and a guard that treats an empty/whitespace response as a failure so the fallback kicks in.
- **What fallback behavior I implemented:** A single friendly fallback string returned from the service's `catch` (and on empty responses): "We couldn't generate a recommendation for this one — check out the overview above!" The modal renders it in the same Watch Recommendation slot, so a failed AI call never breaks the rest of the modal.
- **What I learned:** Putting the async AI state *next to the data it depends on* (in MovieModal, keyed on the `details` prop via `useEffect`) made reset-on-close free — the component unmounts and remounts per movie, so no manual cleanup of `aiInsight` is needed. On prompt engineering: negative constraints ("don't say X") only reliably land when they're specific and enumerated; vague instructions like "avoid clichés" didn't move the output much.


# Responsive / Breakpoints:
The movie grid (`.movie-list`) uses CSS Grid and is tuned at two breakpoints — **600px** and **1024px** — capped at a `1400px` max-width container. Target layout per viewport:

| Viewport      | Width range     | Cards/row | Card min     |
|---------------|-----------------|-----------|--------------|
| Wide desktop  | ≥ 1024px        | ~6        | 180px        |
| Tablet        | 600px – 1023px  | ~3–4      | 150px        |
| Mobile        | < 600px         | 2 (fixed) | 2-col layout |

Desktop and tablet use a fluid `repeat(auto-fill, minmax(<min>, 1fr))` grid; mobile switches to an explicit `repeat(2, 1fr)` so it always shows exactly two readable cards per row instead of collapsing to one oversized column. Gaps and padding tighten as the viewport narrows. Cards scale via `width: 100%` + `aspect-ratio: 2/3` on the poster, and the mobile breakpoint also reduces title/rating font size and action-icon size so the 2-up cells stay legible and uncluttered. (Implemented in `MovieList.css` and `MovieCard.css`.)
