function captureAuthCallback() {
  if (typeof window === "undefined") return { recovery: false, error: null };
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.slice(1));
  const error = hash.get("error_description") ?? hash.get("error_code") ?? hash.get("error");
  const recovery = hash.get("type") === "recovery" || url.searchParams.get("auth") === "recovery";
  if (hash.get("type") === "recovery") {
    url.searchParams.set("auth", "recovery");
    window.history.replaceState(null, "", url);
  }
  return { recovery, error };
}

export const authCallback = captureAuthCallback();

/** Drops the non-secret reload marker without touching the route or the session. */
export function dropAuthMarker() {
  const current = new URL(window.location.href);
  if (!current.searchParams.has("auth")) return;
  current.searchParams.delete("auth");
  window.history.replaceState(null, "", current);
}

export function clearAuthCallback() {
  const current = new URL(window.location.href);
  current.searchParams.delete("auth");
  current.hash = "/today";
  window.history.replaceState(null, "", current);
  window.dispatchEvent(new window.Event("hashchange"));
}
