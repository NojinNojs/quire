# Running-app click-through

Run: `npm run gate`, system Chromium (Brave), local Vite app and local Supabase. All 21 browser tests passed, including 13 auth tests. Tests live in `tests/e2e/auth.spec.ts`.

| Control exercised | Action and result |
| --- | --- |
| Email | Typed real local test-account email for signup and subsequent login. Values reached Supabase successfully. Submitting the empty form focused Email and exposed native required validation. |
| Password | Entered password for signup and login. Input stayed masked until Show. Registration updated Weak, Fair, and Strong labels. |
| Show / Hide | Tabbed to Show and activated with Enter twice. Input switched password to text and back. Busy signup disables the toggle. |
| Sign in | Signed in to the created local account after sign-out. The expected shelf/search route returned. A simulated invalid-credentials response printed the original inline error. |
| Try again | Clicked after simulated invalid credentials. Pending disabled the action and displayed Issuing card; releasing the response restored retry. |
| Forgot your password? | Clicked with no email and received email guidance. Clicked with email against an injected 503 and received retry guidance. Clicked again against an injected successful recovery response and received Reset link sent. No real external reset email was sent. |
| No account yet? Create one | Clicked and keyboard-activated. The form switched to registration, focused its heading, and preserved source query/hash. Reload retained `auth=signup`. |
| Repeat | Typed a different password. The field acquired `aria-invalid` and its linked mismatch alert; signup was disabled. Typed the matching password and the alert cleared. |
| Create account | Submitted a generated local account through real Supabase signup; the first-run tour appeared. A held injected signup response demonstrated disabled fields/actions and a working rule without moving the spread. An injected confirmation-required response printed the existing email-confirmation message. |
| Already have an account? Sign in | Clicked after registration reload at all six screenshot cases. Sign in heading received focus, `auth=signup` was removed, and unrelated source query/hash state remained. |
| Try the interactive demo | Activated with Enter from registration. The demo opened Today and its product tour. Clicked again after saving demo reading activity and confirmed the saved count persisted. |
| Tour Next | Clicked; the next real tour step appeared. |
| Tour Skip | Clicked after local signup and on demo entry; the dialog closed and the app became usable. |
| Tour Escape | Pressed Escape in a reopened/advanced tour; the dialog closed. |
| Sign out | Clicked after real signup; auth returned, the protected heading disappeared, and subsequent login restored the saved route. |
| Guide | Clicked after login; the existing first-run tour reopened and Escape dismissed it. |
| Demo Pages read | Entered 12 in the running demo. |
| Demo Log 12 pages | Clicked. Today's visible record showed 12 pages. Navigated back to auth: the recto showed 12 and today's filled stamp. Reentered the demo: 12 pages remained. |

Every auth control above is exercised in the running browser. Recovery failures/success, invalid credentials, held pending requests, and confirmation-required signup use Playwright response injection to make those states deterministic; the successful account round trip uses real local Supabase.

Keyboard order is asserted as email, password, show, submit, reset, create, demo. Every stop has an asserted 2px outline in the exact active accent. Native signup adds Repeat between Show and Submit.

Failure checks also block the cover request and deny browser storage: the shared placeholder appears and the form remains usable. Screenshot cases report no page errors or console errors. The intentional failed-request case is separate.
