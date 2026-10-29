# Add a book from the catalogue

Closes #3.

Search Google Books and Open Library, compare edition metadata in ruled rows, and save an edition
to the signed-in user's library. Open Library search resolves concrete edition records to avoid
mixing publishers, ISBNs and dates across editions. Failed sources leave available results usable.

Manual entry requires only a title. ISBNs are validated and stored as ISBN-13; duplicate checks
use `editionKey`, and ISBN conflicts display the database's original message. Successful saves
show Added and refresh the header count. Unknown metadata stays null; missing language defaults to id.

No new dependencies. No shelf milestone changes.

## Validation

- `npm run gate`: Biome, typecheck, 39 unit tests, build, and actual local database smoke all pass.
- Browser walkthrough covers real inserts, ownership, default language, duplicate errors, required
  title, invalid ISBN, empty and unavailable states, keyboard use, 200% zoom and six themes.
- Evidence: [NOTES.md](NOTES.md), `empty.png`, `results.png`, `saved.png`, plus live Open Library
  screenshots `live-results.png` and `live-saved.png`.

## Known gaps

- A live successful Google Books response could not be verified because the provider returned
  HTTP 429. Its normalisation and integration path are verified offline with fixtures. Live Open
  Library search and save succeeded, including displaying the Google availability warning.
- The two design verification Python scripts referenced in the design document are absent from
  this repository; the measured browser, contrast, detector and required gate checks are recorded
  in NOTES.md instead.
