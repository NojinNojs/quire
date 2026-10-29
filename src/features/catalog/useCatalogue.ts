import type { User } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { type Candidate, searchCatalog } from "../../lib/catalog";
import type { EditionIdentity as SavedEdition } from "../../lib/edition";
import { supabase } from "../../lib/supabase";
import { identity } from "./identity";
export function useCatalogue(user: User) {
  const [tab, setTab] = useState<"search" | "manual">("search");
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [count, setCount] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const saveLock = useRef(false);
  const request = useRef(0);
  useEffect(() => {
    let current = true;
    supabase
      ?.from("books")
      .select("id", { count: "exact", head: true })
      .eq("owner", user.id)
      .then(({ count, error }) => {
        if (!current) return;
        if (error) setMessage(error.message);
        else setCount(count ?? 0);
      });
    return () => {
      current = false;
    };
  }, [user.id]);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    const current = ++request.current;
    setSearching(true);
    setErrors([]);
    setCandidates([]);
    const result = await searchCatalog(query, (url) =>
      fetch(url, { signal: AbortSignal.timeout(15000) }),
    );
    if (current !== request.current) return;
    setCandidates(result.candidates);
    setErrors(result.errors);
    setSearched(true);
    setSearching(false);
  }

  async function save(candidate: Candidate): Promise<boolean> {
    if (!supabase || saveLock.current) return false;
    saveLock.current = true;
    const key = identity(candidate);
    setSaving(key);
    setMessage("");
    try {
      // Compare canonical edition identities, then let the unique index report ISBN duplicates.
      const existing: SavedEdition[] = [];
      for (let offset = 0; ; offset += 1000) {
        const page = await supabase
          .from("books")
          .select("title,publisher,year,isbn")
          .eq("owner", user.id)
          .order("id")
          .range(offset, offset + 999);
        if (page.error) throw page.error;
        existing.push(...(page.data as SavedEdition[]));
        if (page.data.length < 1000) break;
      }
      const duplicate = existing.find((book) => identity(book) === key);
      if (duplicate && !candidate.isbn) {
        setMessage("This edition is already in your library.");
        return false;
      }
      const { error } = await supabase.from("books").insert({
        owner: user.id,
        title: candidate.title,
        author: candidate.author,
        publisher: candidate.publisher,
        year: candidate.year,
        pages: candidate.pages,
        isbn: duplicate?.isbn ?? candidate.isbn,
        language: candidate.language || "id",
        cover_url: candidate.coverUrl,
      });
      if (error) throw error;
      setSaved((previous) => new Set([...previous, key]));
      setCount((previous) => (previous === null ? null : previous + 1));
      const total = await supabase
        .from("books")
        .select("id", { count: "exact", head: true })
        .eq("owner", user.id);
      if (!total.error) setCount(total.count ?? 0);
      else setMessage(total.error.message);
      setMessage((previous) => previous || `${candidate.title} added to your library.`);
      return true;
    } catch (error) {
      setMessage(
        error instanceof Error ||
          (typeof error === "object" && error !== null && "message" in error)
          ? String(error.message)
          : "Could not save the book. Try again.",
      );
      return false;
    } finally {
      saveLock.current = false;
      setSaving(null);
    }
  }

  function selectTab(next: "search" | "manual") {
    setTab(next);
    setMessage("");
  }

  return {
    tab,
    query,
    setQuery,
    candidates,
    searched,
    searching,
    errors,
    saved,
    count,
    message,
    setMessage,
    saving,
    search,
    save,
    selectTab,
  };
}
