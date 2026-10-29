import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { lookupCover } from "../src/lib/coverLookup.ts";

export async function backfillCovers(
  client,
  { dryRun = false, owner, findCover = lookupCover, log = console.log } = {},
) {
  let cursor;
  let found = 0;
  let saved = 0;
  for (;;) {
    let query = client
      .from("books")
      .select("id,title,author,isbn")
      .is("cover_url", null)
      .is("cover_path", null)
      .order("id")
      .limit(100);
    if (owner) query = query.eq("owner", owner);
    if (cursor) query = query.gt("id", cursor);
    const { data, error } = await query;
    if (error) throw error;
    for (const book of data) {
      const url = await findCover(book);
      log(`${book.title} -> ${url ?? "none"}`);
      if (url) {
        found++;
        if (!dryRun) {
          // Recheck both fields atomically in case an upload finished during lookup.
          const { data: updated, error } = await client
            .from("books")
            .update({ cover_url: url })
            .eq("id", book.id)
            .is("cover_url", null)
            .is("cover_path", null)
            .select("id");
          if (error) throw error;
          saved += updated.length;
        }
      }
    }
    if (data.length < 100) break;
    cursor = data.at(-1).id;
  }
  log(`${dryRun ? "Dry run" : "Backfill"}: ${found} found, ${saved} saved`);
  return { found, saved };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    const args = process.argv.slice(2);
    if (args.some((arg) => arg !== "--dry-run")) throw new Error("Usage: backfill-covers.mjs [--dry-run]");
    await backfillCovers(
      createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }),
      { dryRun: args.includes("--dry-run"), owner: process.env.BACKFILL_OWNER },
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
