export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-control">
      <label className="field-label" htmlFor="show-search">Search TV shows</label>
      <div className="search-field">
        <input
          id="show-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter a show title"
          autoComplete="off"
        />
        {value && (
          <button className="clear-search" type="button" onClick={() => onChange('')}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
