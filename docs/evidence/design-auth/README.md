# Borrower's card evidence

Branch: `feat/design-auth`.

The PNGs show the rendered application at 390 × 844 using system Chromium and local Supabase. Both faces are captured in shelf-light and municipal-dark. Additional captures show repeat-field mismatch in both themes and an inline authentication error in shelf-light. The error response is intercepted by Playwright for a deterministic screenshot; registration and sign-out use local Supabase.

`gate-output.txt` records a passing `npm run gate`: 153 unit tests, database smoke checks, build, typecheck, and all 8 end-to-end tests. Biome reports one existing warning in `src/styles/shelf.css`, outside this task's ownership. The Impeccable detector returned no findings for the changed interface.

The browser checks also cover 420px overflow, reduced motion, pending submission, mode persistence, and text contrast of at least 7:1 in all six theme modes. The original sign-up and sign-out smoke test is unchanged.

## Compatibility choices

- The mode switch retains its existing button role and accessible name for shared test hooks. It is rendered as a plain underlined text control.
- Repeat is optional to preserve the existing two-field registration flow. When populated, it blocks submission on mismatch and supplies an associated text error. Strength is advisory and does not change password requirements.
- `?auth=signup` preserves the registration face on reload without changing the hash or other query parameters. Successful authentication clears this parameter so sign-out returns to sign in.
- The pending label stays in place until the existing session listener mounts the shell.
- Button fill uses `--ink` with `--surface-raised` text. The existing accent pairs do not all reach 7:1. Class colour remains on the top rule and input focus rule.
- Local `--danger` aliases `--ink` so error text reaches 7:1 across all six themes. The message and left rule identify errors without relying on colour.

## Local component tokens

These tokens live only in `src/styles/auth.css`; shared tokens and themes are unchanged.

| Token | Purpose |
| --- | --- |
| `--auth-width` | Maximum card width, 360px |
| `--auth-mark-size` | QUIRE imprint size, 10px |
| `--auth-tracking` | Imprint letter spacing |
| `--auth-slide-time` | Face transition duration, 160ms |
| `--auth-slide-offset` | Direction and distance of the face transition |
| `--auth-issue-time` | Period of the pending submission rule |
| `--danger` | Accessible inline error ink |

The hairline frame, punched hole, mono imprint, and stamp button follow the supplied library-card brief. The single slide signals a change of face; the moving rule indicates a pending account request. Both animations stop under reduced motion.
