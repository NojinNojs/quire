# Shelf furniture evidence

Captured at 390px wide in shelf-light and oxford-dark from the running application against local Supabase. The capture creates a temporary account, saves three books, and logs 68 pages of The Waves (272 pages). It navigates from Shelf to Today and removes the temporary account afterward. Jackets show the honest no-cover fallback because these saved books have no uploaded images.

The viewport height expands to fit each screen before capture, keeping the fixed navigation below the content. These are rendered states reached through the application, with no screenshot compositing or hidden UI.

- `grid-*-390.png`: grid shelf with rotated class labels and bookmark strips.
- `list-*-390.png`: list shelf with sideways page numbers.
- `today-*-390.png`: saved active book, 25% bookmark, and stamps. Logs on October 25, 27, and 29 produce a restored October 26, a missed October 28, and a full-ink October 29.
- `checks.json`: measured text and class-ink contrast ratios in every theme mode. All are at least 7:1. The brief explicitly specifies 40% opacity for past stamps; stamps are accompanied by accessible date/state labels.
- `gate-output.txt`: complete `npm run gate` output, including database checks and browser smoke tests.

Reproduce from the project root with local Supabase running:

```sh
node src/features/shelf/evidence/capture-furniture.mjs
npm run gate > docs/evidence/design-shelf/gate-output.txt 2>&1
```

The capture also asserts two columns at 390 and 420, three at 421 and 768, no overflow and contained spine labels in all six modes, 25% bookmark arithmetic, list persistence after reload, 120ms jacket settling, 160ms bookmark transitions, reduced motion, stamp opacity, 10px Today bookmarks, and restoration after reload. Unit tests cover unavailable page totals, progress clamping, blocked storage, stamp states, restoration quota, and spine label text, alongside existing loading, empty, error, filtering and page logging checks.
