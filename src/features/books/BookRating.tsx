import { useId } from "react";

export function BookRating({
  rating,
  onChange,
}: {
  rating: number | null;
  onChange: (rating: number | null) => void;
}) {
  const name = useId();
  return (
    <fieldset className="book-rating">
      <legend>Your rating</legend>
      <div className="book-rating-controls">
        {[1, 2, 3, 4, 5].map((value) => (
          <label key={value} className="book-rating-star" title={`${value} out of 5`}>
            <input
              type="radio"
              name={name}
              value={value}
              aria-label={`${value} out of 5`}
              checked={rating === value}
              onChange={() => onChange(value)}
            />
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              aria-hidden="true"
              fill={rating !== null && value <= rating ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="miter"
            >
              <path d="m12 3 2.8 5.7 6.3.9-4.5 4.4 1.1 6.2-5.7-3-5.7 3 1.1-6.2L3.2 9.6l6.3-.9Z" />
            </svg>
          </label>
        ))}
        {rating !== null && (
          <button className="demo-link" type="button" onClick={() => onChange(null)}>
            Clear rating
          </button>
        )}
      </div>
      <p role="status">{rating === null ? "Not rated yet" : `${rating} out of 5`}</p>
    </fieldset>
  );
}
