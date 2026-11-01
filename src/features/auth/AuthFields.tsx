import type { AuthMode } from "./auth-mode";

export function AuthFields({ auth }: { auth: AuthMode }) {
  const {
    mode,
    email,
    setEmail,
    password,
    setPassword,
    reveal,
    setReveal,
    busy,
    strength,
    repeat,
    setRepeat,
    mismatch,
  } = auth;
  return (
    <>
      <label className="auth-field">
        <span className="label">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="name@example.com"
          required
          disabled={busy}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <div className="auth-field">
        <span className="label" aria-hidden="true">
          Password
        </span>
        <input
          type={reveal ? "text" : "password"}
          name="password"
          placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
          minLength={8}
          disabled={busy}
          aria-describedby={mode === "signup" ? "auth-strength" : undefined}
          aria-label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button
          type="button"
          className="auth-reveal"
          aria-pressed={reveal}
          aria-label={reveal ? "Hide" : "Show"}
          disabled={busy}
          onClick={() => setReveal((value) => !value)}
        >
          {reveal ? "Hide" : "Show"}
        </button>
      </div>
      {mode === "signup" ? (
        <>
          <div id="auth-strength" className="auth-strength" data-strength={strength}>
            <span aria-live="polite">Password strength: {strength}</span>
            <span className="auth-strength-track" aria-hidden="true">
              <span />
            </span>
          </div>
          <label className="auth-field">
            <span className="label">Repeat</span>
            <input
              type="password"
              name="repeat"
              autoComplete="new-password"
              placeholder="Type it again"
              disabled={busy}
              value={repeat}
              aria-invalid={mismatch}
              aria-describedby={mismatch ? "auth-mismatch" : "auth-repeat-help"}
              onChange={(event) => setRepeat(event.target.value)}
            />
          </label>
          {mismatch ? (
            <p id="auth-mismatch" className="auth-field-error" role="alert">
              Passwords do not match.
            </p>
          ) : (
            <p id="auth-repeat-help" className="auth-help">
              Optional. Repeat your password to check it.
            </p>
          )}
        </>
      ) : null}
    </>
  );
}
