const jackets = [
  ["upper-bumi", "bumi", "800"],
  ["upper-histories", "histories", "900"],
  ["upper-laut", "laut", "800"],
  ["upper-meditations", "meditations", "100"],
  ["middle-origin", "origin", "500"],
  ["middle-pride", "pride", "800"],
  ["middle-waves", "waves", "800"],
  ["middle-room", "room", "800"],
  ["lower-walden", "walden", "800"],
  ["lower-laut", "laut", "800"],
  ["lower-histories", "histories", "900"],
  ["lower-bumi", "bumi", "800"],
] as const;

export function CoverWall() {
  return (
    <div className="auth-cover-wall" aria-hidden="true">
      <div className="auth-shelves">
        {jackets.map(([id, cover, classification]) => (
          <div className="auth-cover" key={id}>
            <div className="auth-jacket" data-class={classification}>
              <img src={`/covers/${cover}.webp`} alt="" decoding="async" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
