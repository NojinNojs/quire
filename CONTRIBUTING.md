# Contributing to Quire

Quire is one person's library, built in public. Contributions are welcome; the bar is the process in
[docs/ENGINEERING.md](docs/ENGINEERING.md).

```bash
nix develop
NODE_OPTIONS=--dns-result-order=ipv4first npm install
supabase start
npm run dev
npm run gate          # must be green before you open a pull request
bash scripts/install-hooks.sh
```

Rules that will get a change sent back: a commit message that does not follow the convention, a PR
without gate output, a raw value where a token exists, an em dash, or a "fixed" claim with no evidence.
