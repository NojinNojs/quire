# Authentication and product tour

## Direction contract

THESIS: make entering Quire feel like entering a considered reading space, then teach the
product by highlighting its real controls. Preserve the catalogue's content and behavior.

OWN-WORLD: paper, ink, Plus Jakarta Sans, italic book titles, published cover imagery,
and DDC organization remain. Authentication places a borrower card in a physical open book
on a warm light desk. Ruled fields and an ink-colored action keep the form legible.

STORY: a reader can sign in, register, or try the sample library. The sample library offers
a five-step tour with real screen highlights. Skip and replay remain available.

FIRST VIEWPORT: desktop authentication pairs the form with a sample reading record across
a visible spine. Space above and below the book gives it room on the desk. On narrow screens
the form takes priority; controls remain reachable without page scroll at supported sizes.
The tour uses one compact panel beside the highlighted task, with Back, Next, and Skip.

FORM: code-first surface extending the existing app. The introduction uses editorial type
to establish hierarchy, while the spine and page edges give the composition a physical book
structure. ENERGY 2 / RHYTHM 2 / MOTION 2. Shelf light is the only runtime theme.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Product behavior

The tour visits Today, logging pages, Shelf, Search, and Settings. It identifies the actual
target after each route renders, follows viewport changes, and avoids covering the target.
Escape and Skip close it. A persistent Guide control reopens it. First visits receive an
optional invitation, and completion or dismissal is remembered separately per demo/account.

Interaction refinements include page-count shortcuts and direct star rating. These operate
on existing data and keep the established validation and Undo behavior.
