# Auth polish #62 evidence

Screenshots show the running local app in system Chromium. Both sign-in and registration were captured; the phone viewport crops additionally prove that the sign-in action fits at 320x640.

| Width | Shelf light | Oxford dark |
| --- | --- | --- |
| 320 | [Sign in](shelf-light-signin-320.png), [Register](shelf-light-signup-320.png), [Viewport](shelf-light-signin-320-viewport.png) | [Sign in](oxford-dark-signin-320.png), [Register](oxford-dark-signup-320.png), [Viewport](oxford-dark-signin-320-viewport.png) |
| 390 | [Sign in](shelf-light-signin-390.png), [Register](shelf-light-signup-390.png) | [Sign in](oxford-dark-signin-390.png), [Register](oxford-dark-signup-390.png) |
| 768 | [Sign in](shelf-light-signin-768.png), [Register](shelf-light-signup-768.png) | [Sign in](oxford-dark-signin-768.png), [Register](oxford-dark-signup-768.png) |
| 1280 | [Sign in](shelf-light-signin-1280.png), [Register](shelf-light-signup-1280.png), [Focus](shelf-light-focus-1280.png) | [Sign in](oxford-dark-signin-1280.png), [Register](oxford-dark-signup-1280.png), [Focus](oxford-dark-focus-1280.png) |

- [Design Read, Delivery Gate and acceptance blocker](PR_BODY.md)
- [Full repository gate output](gate-output.txt): 222 unit pass; 20 e2e pass; one old phone-sliver assertion fails.
- [Layout measurements](layout-checks.json), [interaction results](interaction-checks.json), [breakpoint checks](breakpoint-checks.json)
- [Six-theme contrast report](contrast.txt): 144 groups; minimum 9.109:1.
- [Mechanical design detector](design-detector.json)
- [Capture/verification script](verify.mjs), [successful output](verification-output.txt)

To repeat captures, run the app on port 5173, then `node docs/evidence/auth-polish2/verify.mjs`. Override its URL with `AUTH_EVIDENCE_URL` if needed. The repository gate uses its own local Supabase-backed server on port 5174.
