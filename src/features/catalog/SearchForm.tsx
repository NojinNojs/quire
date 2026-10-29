export function SearchForm({
  query,
  setQuery,
  searching,
  search,
}: {
  query: string;
  setQuery: (query: string) => void;
  searching: boolean;
  search: (event: React.FormEvent) => void;
}) {
  return (
    <form className="catalog-form" onSubmit={search}>
      <label>
        <span className="label">Title, author or ISBN</span>
        <input
          type="search"
          value={query}
          required
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <button className="primary" type="submit" disabled={searching || !query.trim()}>
        {searching ? "Searching" : "Search"}
      </button>
    </form>
  );
}
