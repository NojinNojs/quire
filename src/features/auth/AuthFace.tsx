import type { RefObject } from "react";
import { AuthFields } from "./AuthFields";
import type { AuthMode } from "./auth-mode";

export function AuthFace({
  auth,
  heading,
}: {
  auth: AuthMode;
  heading: RefObject<HTMLHeadingElement | null>;
}) {
  const { mode, busy, message, failed, mismatch, submit, sendReset, switchMode } = auth;
  return (
    <div className="auth-face" data-mode={mode}>
      <h1 className="auth-mode-title" id="auth-title" ref={heading} tabIndex={-1}>
        {mode === "signin" ? "Sign in" : "Create an account"}
      </h1>
      <form
        onSubmit={submit}
        className="auth-form"
        aria-busy={busy}
        aria-describedby={message ? "auth-message" : undefined}
      >
        <AuthFields auth={auth} />
        {message ? (
          <p
            id="auth-message"
            className={failed ? "auth-field-error" : "auth-message"}
            role={failed ? "alert" : "status"}
          >
            {message}
          </p>
        ) : null}
        <button type="submit" className="primary" disabled={busy || mismatch}>
          {busy
            ? "Issuing card"
            : failed
              ? "Try again"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          {busy ? <span className="auth-issuing" aria-hidden="true" /> : null}
        </button>
      </form>
      <footer className="auth-footer">
        <div className="auth-account-links">
          {mode === "signin" ? (
            <button type="button" className="auth-forgot" disabled={busy} onClick={sendReset}>
              Forgot your password?
            </button>
          ) : null}
          <button
            type="button"
            className="auth-switch"
            aria-label={
              mode === "signin" ? "No account yet? Create one" : "Already have an account? Sign in"
            }
            disabled={busy}
            onClick={switchMode}
          >
            <span className="auth-switch-ask">
              {mode === "signin" ? "No account yet?" : "Already have an account?"}
            </span>{" "}
            <span className="auth-switch-action">
              {mode === "signin" ? "Create one" : "Sign in"}
            </span>
          </button>
        </div>
        <p className="auth-demo">
          Or look around first:{" "}
          <a className="auth-demo-link" href="?demo=1#/shelf" aria-label="Try the interactive demo">
            try the interactive demo.
          </a>
        </p>
      </footer>
    </div>
  );
}
