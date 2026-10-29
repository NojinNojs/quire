export function PlaceholderScreen({ screen }: { screen: "today" | "shelf" }) {
  return (
    <main className="shell shell-placeholder">
      <h1>{screen === "today" ? "Today" : "Shelf"}</h1>
      <div className="shell-placeholder-copy">
        <p className="muted">
          {screen === "today"
            ? "Today arrives in milestone 4 with page logging, followed by streaks in milestone 5."
            : "Your grouped shelf and filters arrive in milestone 3: Shelf and classes."}
        </p>
        <a className="shell-catalogue-link" href="#/search">
          Add a book from the catalogue
        </a>
      </div>
    </main>
  );
}
