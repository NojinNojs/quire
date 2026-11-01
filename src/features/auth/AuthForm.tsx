import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { AuthCover, shouldShowCover } from "./AuthCover";
import { AuthFace } from "./AuthFace";
import { AuthReadingRecord } from "./AuthReadingRecord";
import { useAuthMode } from "./auth-mode";
import "../../styles/auth.css";

export function AuthForm({ client }: { client: SupabaseClient }) {
  const [covered, setCovered] = useState(shouldShowCover);
  const auth = useAuthMode(client);
  const { mode, busy, switched } = auth;
  const heading = useRef<HTMLHeadingElement>(null);
  const focusAfterCover = useRef(false);
  const openBook = useCallback((keyboard: boolean) => {
    focusAfterCover.current = keyboard;
    setCovered(false);
  }, []);

  useEffect(() => {
    if (!covered && focusAfterCover.current) {
      heading.current?.focus({ preventScroll: true });
      focusAfterCover.current = false;
    }
  }, [covered]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: The keyed face mounts a new heading on each mode change.
  useEffect(() => {
    if (switched) heading.current?.focus({ preventScroll: true });
  }, [mode, switched]);

  return (
    <main
      className="auth-page"
      aria-label={covered ? "Quire, a personal library" : undefined}
      aria-labelledby={covered ? undefined : "auth-title"}
      data-busy={busy}
      data-covered={covered}
    >
      <div className="auth-book">
        {covered ? <AuthCover onOpen={openBook} /> : null}
        <div className="auth-sheets" inert={covered} aria-hidden={covered ? true : undefined}>
          <span className="auth-bookmark" aria-hidden="true" />
          <section className="auth-verso" aria-label="Borrower card">
            <header className="auth-running-head">
              <span>QUIRE</span>
              <span>BORROWER CARD</span>
            </header>
            <p className="auth-intro">A home for your reading life.</p>
            <AuthFace key={mode} auth={auth} heading={heading} />
            <footer className="auth-page-foot">
              <p className="auth-footnote">Your shelf is private. One account, one library.</p>
              <p className="auth-folio">16</p>
            </footer>
          </section>
          <AuthReadingRecord />
        </div>
      </div>
    </main>
  );
}
