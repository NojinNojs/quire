import { SearchIcon } from "../../components/icons";

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
          className="control-input"
          type="search"
          placeholder="Title, author or ISBN"
          autoComplete="off"
          spellCheck={false}
          value={query}
          required
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <button
        className="primary"
        type="submit"
        aria-busy={searching}
        disabled={searching || !query.trim()}
      >
        <SearchIcon />
        {searching ? "Searching" : "Search"}
      </button>
    </form>
  );
}
