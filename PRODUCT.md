# Quire

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users and purpose

Quire is a personal book catalogue and reading tracker. Readers collect editions, find books
on their own shelves, choose one active book, and record pages read. Existing product truth
is recorded in docs/PRD.md and docs/APP_FLOW.md.

## Stack

React, TypeScript, Vite, and Supabase. Hash routes cover Today, Shelf, Search, and Settings.
The interactive demo works without an account or Supabase and saves changes on the device.

## Capabilities and constraints

Preserve real cover artwork, one shared missing-cover image, edition identity, notes, ratings,
reading progress, theme choices, and the working authentication flow. Label sample activity.
Do not imply that the demo signs users in or synchronizes changes to an account.

## Current user direction

The user requested a more interactive experience, a skippable step-by-step screen tour, and
more modern sign-in and registration pages. Free sourced photography is permitted. Book
covers must remain actual published artwork, with one placeholder for missing covers.

## Accessibility

Support keyboard operation, visible focus, narrow screens, reduced motion, and all six themes.
The tour can be skipped and replayed without blocking normal app use.
