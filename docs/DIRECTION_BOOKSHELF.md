# Direction: the shelf is furniture

The app looks like a catalogue on paper. That is right for records, and wrong for the moment a reader
opens the app to find a book. The next direction keeps the paper but gives the books a **place to
stand**: jackets rest on a shelf line, the class lives on the shelf's edge, and the reading record is
stamped rather than drawn as a chart.

This is not a Goodreads clone. There are no rounded cards, no warm gradients, no ratings out of five
floating in empty space. The identity comes from the furniture metaphor, which no mainstream reading
app uses.

## The three moves

1. **The shelf line.** Every group of jackets sits on a 1px horizontal rule in `--rule`, with 8px of
   shadowless gap beneath the jackets. Jackets stand on that line, aligned by their bottom edge, and
   shorter editions get a small card-stock plinth so all bottoms meet the shelf. A group header is a
   thin vertical spine label at the left margin, rotated 90 degrees, in the class colour, carrying the
   class number and name.

2. **The bookmark strip.** Progress is a vertical strip of the class colour on the jacket's inner edge,
   filling from the bottom, with the page number printed sideways in mono at its edge. In a grid the
   strip is 4px; on Today it is 10px. A reader can see how far they are without reading a number.

3. **The stamp.** The streak is not a bar chart. Each day is a small stamped mark in `--ink` at 40%
   opacity, with today at full ink, and the number printed beside it in Newsreader italic. A missed day
   is an empty square; a restored day carries a diagonal line. It reads like a due-date slip, and it is
   honest at a glance.

## Rules that do not change

Type scale, spacing scale, the six theme modes, class colours, the icon set, the 120ms motion budget,
contrast floors, English copy, no em dash, radius at most 3.

## What this replaces

- The ruled list on the shelf becomes a grid of standing jackets by default, with the list kept as a
  toggle for scanning titles.
- The Today card stops being a card and becomes a jacket plus its bookmark strip.
- The seven filled squares of the streak become stamps.

## Why it is unique

Every competitor shows covers in rounded cards with soft shadows and colour everywhere. Quire shows
covers standing on a printed shelf with the classification on the shelf edge and the reading record
stamped beside them. Swap the logo of any competitor and the screen still looks like theirs; swap
Quire's and the shelf gives it away.
