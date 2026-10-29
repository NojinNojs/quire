# Quire

A personal library that behaves like a catalogue: every edition recorded, classified the way a
librarian would, and one active book waiting on the first screen each day.

## Status

Milestone 0. The shell builds. No features yet.

## Documents

The product and design are decided before code, in this order:

| Document | What it decides |
|---|---|
| [PRD](docs/PRD.md) | what the product is, and what it refuses to be |
| [TRD](docs/TRD.md) | stack, hosting, and the reasons |
| [App Flow](docs/APP_FLOW.md) | the journeys, including the awkward states |
| [Design Brief](docs/DESIGN_BRIEF.md) | the visual direction |
| [Design System](docs/DESIGN_SYSTEM.md) | tokens, themes, component contracts |
| [Schema](docs/SCHEMA.md) | tables, policies, streak rules |
| [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) | the thirteen steps, in order |

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

Try logging pages and Undo, filtering the Shelf, opening a book to save notes or a rating,
choosing another active book, and adding a sample or manual entry from Search. All six themes
are available in Settings. **Reset demo** restores the sample library; **Leave demo** returns
to the account app. See [the demo walkthrough](docs/DEMO.md).

Use **Guide** in the app header to replay the five-step product tour, or open
`http://localhost:5173/?demo=1&tour=1#/today` to launch it directly. Sign-in and registration
also offer a tour link. The tour highlights real controls and supports Back, Next, Skip, and
Escape. Reading shortcuts and keyboard-accessible star ratings operate on the demo data.

## Tests

Unit tests live next to the code (`src/lib/*.test.ts`) and cover the rules the database cannot:
streak increment, break and monthly restore; DDC grouping; page progress with an unknown page count;
edition identity and deterministic jacket colour.

```bash
npx vitest run          # 25 tests
npx vitest             # watch mode
```

## Licence

MIT
