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
npm run gate         # lint, typecheck, tests, build, docs check
bash scripts/install-hooks.sh   # gate runs on every push
```

If `npm install` stalls, run it as `NODE_OPTIONS=--dns-result-order=ipv4first npm install`.
The same flag matters for any Node tool that talks to the network on this machine.

No GitHub Actions. The gate runs locally so CI mail stays quiet.

## Licence

MIT
