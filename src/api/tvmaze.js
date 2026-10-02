const API_ROOT = 'https://api.tvmaze.com/search/shows';

export async function searchShows(query, { signal } = {}) {
  const url = new URL(API_ROOT);
  url.search = new URLSearchParams({ q: query }).toString();
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Search failed (${response.status}). Try again later.`);
  }

  const results = await response.json();
  return results.map(({ show }) => ({
    id: show.id,
    title: show.name,
    firstAirDate: show.premiered ?? '',
    posterUrl: show.image?.medium ?? null,
  }));
}