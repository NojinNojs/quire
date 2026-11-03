# Quire

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users and purpose

Quire is a personal reading companion: a private catalogue, one active book, a daily reading
habit, and an honest record of the year. Readers collect editions, find books on their own
shelves, log pages, keep a private review, set an annual goal, and review their journal and
yearly summary. It is not a social network, a feed, or an admin tool. Existing product truth
is recorded in docs/product/PRD.md and docs/product/APP_FLOW.md.

## Stack

React, TypeScript, Vite, and Supabase. Hash routes open Today by default and cover Collection,
Add book, Book detail, Journal, Reading year, and Settings. Journal and Reading year open from
the dashboard. The interactive demo works without an account or Supabase and saves changes on
the device.

## Capabilities and constraints

Today greets the reader, shows the one active book with page logging and undo, a yearly summary
against the current annual goal, recent activity, and links to the journal and reading year.
A book carries one status (want to read, reading, finished, wishlist); only one book can be
reading at a time, and changing a finished book's status removes its finish date after a
confirmation while keeping page logs. Reviews are a private rating and notes per book, never
public content.

Reading history is aggregated per day, not per timed session. Journal and Reading year filter
by year; Reading year also filters by language using current book metadata and shows a
twelve-month calendar, totals, and a language breakdown. The annual goal applies to the
current year only, because past years do not store a historical goal.

Settings holds the profile name used in the greeting, the annual goal (1–500 books or blank),
the read-only account email, password change, and sign out. Password reset links open a
new-password screen before the app.

Preserve real cover artwork, one shared missing-cover image, edition identity, the light theme,
and the working authentication flow. Label sample activity. Do not imply that the demo signs
users in or synchronizes changes to an account; the demo mirrors the same screens and rules
locally, including profile, reviews, status, journal, and reading year.

## Current user direction

The user requested a complete personal reading companion in a warm editorial light style,
with a useful dashboard and no social or admin surface. Book covers must remain actual
published artwork, with one placeholder for missing covers.

## Accessibility

Support keyboard operation, visible focus, narrow screens, reduced motion, and the light theme.
The tour can be skipped and replayed without blocking normal app use.
