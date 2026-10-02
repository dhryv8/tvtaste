function formatYear(date) {
  return date ? date.slice(0, 4) : 'Year unknown';
}

export default function SearchResults({ shows, loading, error, query, topNine, onAdd }) {
  if (!query) {
    return <p className="search-state">Search for a show to add it.</p>;
  }

  if (loading) {
    return <p className="search-state" role="status">Searching TVMaze...</p>;
  }

  if (error) {
    const message = error === 'Failed to fetch'
      ? 'Could not reach TVMaze. Check your connection and try again.'
      : error;
    return <p className="search-error" role="alert">{message}</p>;
  }

  if (shows.length === 0) {
    return <p className="search-state">No shows match “{query}”. Try a different title.</p>;
  }

  return (
    <ul className="results-list" aria-label="TV show search results">
      {shows.map((show) => (
        <li className="result-row" key={show.id}>
          {show.posterUrl ? (
            <img className="result-poster" src={show.posterUrl} alt="" loading="lazy" />
          ) : (
            <span className="result-poster poster-missing" aria-hidden="true">No image</span>
          )}
          <span className="result-copy">
            <span className="result-title">{show.title}</span>
            <span className="result-meta">{formatYear(show.firstAirDate)}</span>
          </span>
          <button
            className="add-show"
            type="button"
            onClick={() => onAdd(show)}
            disabled={topNine.some((item) => item.id === show.id) || topNine.length >= 9}
            aria-label={topNine.some((item) => item.id === show.id) ? `${show.title} is already in your Top 9` : `Add ${show.title} to your Top 9`}
            title={topNine.some((item) => item.id === show.id) ? 'Already added' : 'Add to Top 9'}
          >
            {topNine.some((item) => item.id === show.id) ? 'Added' : 'Add'}
          </button>
        </li>
      ))}
    </ul>
  );
}
