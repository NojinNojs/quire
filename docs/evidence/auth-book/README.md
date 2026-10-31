# Auth book evidence

The repository gate passed with 222 unit tests, 21 browser tests, production build, type checking, and local database smoke. See [gate output](gate-output.txt), [rendered contrast samples](contrast.txt), [control click-through](CLICK_THROUGH.md), and the [PR body with the full Delivery Gate](PR_BODY.md).

The 144 contrast groups cover six themes, 390px and 1280px, and twelve states. Every visible text node, input, and placeholder is sampled, including the recto at desktop width. Final minimum: 9.063:1. Both modes have no horizontal overflow at 320, 390, 768, 960, 1024, and 1440px.

| Theme and width | Sign in | Sign up |
| --- | --- | --- |
| Shelf light, 390 | [View](shelf-light-signin-390.png) | [View](shelf-light-signup-390.png) |
| Shelf light, 768 | [View](shelf-light-signin-768.png) | [View](shelf-light-signup-768.png) |
| Shelf light, 1280 | [View](shelf-light-signin-1280.png) | [View](shelf-light-signup-1280.png) |
| Oxford dark, 390 | [View](oxford-dark-signin-390.png) | [View](oxford-dark-signup-390.png) |
| Oxford dark, 768 | [View](oxford-dark-signin-768.png) | [View](oxford-dark-signup-768.png) |
| Oxford dark, 1280 | [View](oxford-dark-signin-1280.png) | [View](oxford-dark-signup-1280.png) |

Also: [320px registration](shelf-light-signup-320.png), [email focus](shelf-light-focus-1280.png).

Independent visual review returned `ship`; all fourteen images were opened and validated. The documentation handoff preserved theme tokens, three font families, the shared CoverImage/fallback, and saved demo data. The owner's brief explicitly authorizes this local book treatment. `docs/DESIGN.md` is absent; root `DESIGN.md` was read. Its old auth-photo description and related PRODUCT.md wording remain recorded documentation drift outside this change's write boundary.
