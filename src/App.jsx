import { useEffect, useState } from 'react';
import SearchBar from './components/SearchBar.jsx';
import SearchResults from './components/SearchResults.jsx';
import TopNine from './components/TopNine.jsx';
import { searchShows } from './api/tvmaze.js';
import { useDebounce } from './hooks/useDebounce.js';

const STORAGE_KEY = 'top-nine-shows';
const TOP_NINE_LIMIT = 9;

function getSavedShows() {
  try {
    const savedShows = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(savedShows)) return [];

    return savedShows
      .filter((show) => show && Number.isInteger(show.id) && typeof show.title === 'string')
      .slice(0, TOP_NINE_LIMIT);
  } catch {
    return [];
  }
}

export default function App() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 400);
  const [shows, setShows] = useState([]);
  const [topNine, setTopNine] = useState(getSavedShows);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(topNine));
    } catch {
      // Keep the current session usable if browser storage is unavailable.
    }
  }, [topNine]);

  function addShow(show) {
    setTopNine((current) => {
      if (current.length >= TOP_NINE_LIMIT || current.some((item) => item.id === show.id)) return current;
      return [...current, show];
    });
  }

  function removeShow(showId) {
    setTopNine((current) => current.filter((show) => show.id !== showId));
  }

  function moveShow(index, direction) {
    setTopNine((current) => {
      const destination = index + direction;
      if (destination < 0 || destination >= current.length) return current;

      const reordered = [...current];
      [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
      return reordered;
    });
  }

  useEffect(() => {
    if (!debouncedQuery) {
      setShows([]);
      setError('');
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    setError('');

    searchShows(debouncedQuery, { signal: controller.signal })
      .then(setShows)
      .catch((searchError) => {
        if (searchError.name !== 'AbortError') {
          setShows([]);
          setError(searchError.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Top 9 shows home">
          Top 9 shows
        </a>
      </header>

      <section className="search-panel" aria-labelledby="page-title">
        <h1 id="page-title">Find TV shows</h1>

        <div className="search-wrap">
          <SearchBar value={query} onChange={setQuery} />
          <SearchResults
            shows={shows}
            loading={loading}
            error={error}
            query={debouncedQuery}
            topNine={topNine}
            onAdd={addShow}
          />
        </div>
      </section>

      <TopNine shows={topNine} onRemove={removeShow} onMove={moveShow} />
    </main>
  );
}
