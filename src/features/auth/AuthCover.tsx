import { useEffect, useRef, useState } from "react";

const seenKey = "quire:cover-seen";

export function shouldShowCover() {
  if (new URLSearchParams(window.location.search).get("demo") === "1") return false;
  try {
    return window.localStorage.getItem(seenKey) === null;
  } catch {
    return false;
  }
}

export function AuthCover({ onOpen }: { onOpen: (keyboard: boolean) => void }) {
  const [opening, setOpening] = useState(false);
  const cover = useRef<HTMLButtonElement>(null);
  const keyboard = useRef(false);

  useEffect(() => {
    const enter = (event: KeyboardEvent) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      cover.current?.click();
    };
    window.addEventListener("keydown", enter);
    return () => window.removeEventListener("keydown", enter);
  }, []);

  useEffect(() => {
    if (!opening) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Finish even if an animation is cancelled by a change in motion preferences.
    const timer = window.setTimeout(() => onOpen(keyboard.current), reduced ? 120 : 480);
    return () => window.clearTimeout(timer);
  }, [opening, onOpen]);

  function open(event: React.MouseEvent<HTMLButtonElement>) {
    if (opening) return;
    keyboard.current = event.detail === 0;
    try {
      window.localStorage.setItem(seenKey, "true");
    } catch {
      // Opening remains available when the browser denies storage writes.
    }
    setOpening(true);
  }

  return (
    <div className="auth-cover-stage" data-opening={opening}>
      <button
        ref={cover}
        type="button"
        className="auth-cover"
        aria-label="Open Quire"
        onClick={open}
      >
        <span className="auth-cover-title">QUIRE</span>
        <span className="auth-cover-subtitle">A personal library</span>
        <span className="auth-cover-prompt">Tap to open</span>
      </button>
    </div>
  );
}
