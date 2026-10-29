export function isDemoMode() {
  return (
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1"
  );
}
