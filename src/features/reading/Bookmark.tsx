import "../../styles/reading.css";
import { percent } from "../../lib/progress";

export function Bookmark({ current, total }: { current: number; total: number | null }) {
  const height = percent({ current, total });
  return (
    <span
      className="bookmark"
      role="img"
      aria-label={
        height === null ? `Page ${current}, total unknown` : `Page ${current} of ${total}`
      }
    >
      <span className="bookmark-track" aria-hidden="true">
        {height !== null && <span className="bookmark-fill" style={{ height: `${height}%` }} />}
      </span>
      <span className="bookmark-page" aria-hidden="true">
        {current}
      </span>
    </span>
  );
}
