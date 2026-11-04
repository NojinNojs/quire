# Quire

A personal library that behaves like a catalogue: every edition recorded, classified the way a
librarian would, and one active book waiting on the first screen each day.

## Status

Quire is a working personal reading companion. Readers collect editions, open one active book,
log pages with a five-second undo, keep a private rating and review per book, and see their
year in a journal and a yearly summary against an annual goal. Every reader has an account;
nothing is shared or social.

## Documents

The product and design are decided before code, in this order:

| Document | What it decides |
|---|---|
| [PRD](docs/product/PRD.md) | what the product is, and what it refuses to be |
| [TRD](docs/engineering/TRD.md) | stack, hosting, and the reasons |
| [App Flow](docs/product/APP_FLOW.md) | the journeys, including the awkward states |
| [Design Brief](docs/design/DESIGN_BRIEF.md) | the visual direction |
| [Design System](docs/design/DESIGN_SYSTEM.md) | tokens, theme, component contracts |
| [Schema](docs/engineering/SCHEMA.md) | tables, policies, streak rules |
| [Implementation Plan](docs/engineering/IMPLEMENTATION_PLAN.md) | the thirteen steps, in order |

The full index, including briefs, decisions, and evidence, is [docs/README.md](docs/README.md).

## Screens

Hash routes open Today by default, including for an empty or unknown hash:
`#/today` (dashboard), `#/shelf` (collection), `#/search`/`#catalogue` (add a book),
`#/book/<id>` (detail, review and reading status), `#/journal` (yearly reading history),
`#/stats` (reading year), and `#/settings` (profile, annual goal, password, sign out).
Above 1024px a rail lists every destination; narrower screens use a header and a three-item
bottom bar. Today, Journal, and Reading year open from the dashboard and return to it.

Settings holds the profile name used in the greeting, an annual goal from 1 to 500 books (or
blank), a read-only account email, password change, and sign out. Password reset links open a
new-password screen before the app. Quire has a single light theme.

## Development

```bash
nix develop          # node, biome
npm install          # bun install hangs on this box: IPv6 resolves but cannot connect
npm run dev
npm run ci           # lint, typecheck, tests, build, docs check
npm run release 0.2.0   # verify, build, tag, push
bash scripts/install-hooks.sh   # pre-commit: biome + tests, pre-push: full gate
```

If `npm install` stalls, run it as `NODE_OPTIONS=--dns-result-order=ipv4first npm install`.
The same flag matters for any Node tool that talks to the network on this machine.

No GitHub Actions and no hosted runner: CI is the gate, CD is `scripts/release.sh`. Both run on
this machine, so there is no card on file and no CI mail in the inbox.

## Interactive demo

Run `npm run dev`, then open `http://localhost:5173/?demo=1#/today`.
The sign-in screen also has a **Try the interactive demo** link. No account or Supabase
configuration is needed. Demo books and reading activity are illustrative; changes are saved
under a separate browser storage key and never sent to Supabase.

Try logging pages and Undo, filtering the Shelf, opening a book to save a private review or
change its reading status, choosing another active book, and adding a sample or manual entry
from Search. Settings saves a demo profile name and annual goal on this device, and Today,
Journal, and Reading year run on the same data as the account app. **Reset demo** restores the
sample library; **Leave demo** returns to the account app. Quire uses a single light theme. See
[the demo walkthrough](docs/product/DEMO.md).

Use **Guide** in the app header to replay the five-step product tour, or open
`http://localhost:5173/?demo=1&tour=1#/today` to launch it directly. Sign-in and registration
also offer a tour link. The tour highlights real controls and supports Back, Next, Skip, and
Escape. Reading shortcuts and keyboard-accessible star ratings operate on the demo data.

## Tests

Unit tests live next to the code (`src/lib/*.test.ts`) and cover the rules the database cannot:
streak increment, break and monthly restore; DDC grouping; page progress with an unknown page count;
edition identity and deterministic jacket colour; reading-status dates and the one-active-book rule;
pending page logs; yearly pages, finished books, active days, and language breakdown.

```bash
npx vitest run          # run once
npx vitest             # watch mode
```

## Licence

MIT
