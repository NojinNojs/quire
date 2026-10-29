export function SkeletonRows({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} aria-busy="true">
      <ul className="catalog-results skeleton-rows" aria-hidden="true">
        {[0, 1, 2].map((row) => (
          <li className="catalog-row" key={row}>
            <div className="catalog-cover" />
            <div className="catalog-copy">
              <div className="skeleton-title" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-action" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
