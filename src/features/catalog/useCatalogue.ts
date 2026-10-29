import type { SupabaseClient, User } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { saveBook } from "../../data/books";
import { type Candidate, searchCatalog } from "../../lib/catalog";
import { isbnTo13 } from "../../lib/isbn";
import { identity } from "./identity";
import { useBookCount } from "./useBookCount";
export function useCatalogue(user: User, client: SupabaseClient) {
  const [tab, setTab] = useState<"search" | "manual">("search");
  const [manualDraft, setManualDraft] = useState<Partial<Candidate>>({});
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [cacheNotice, setCacheNotice] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const bookCount = useBookCount(client, user.id);
  const [saveError, setSaveError] = useState("");
  const lastCandidate = useRef<Candidate | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const saveLock = useRef(false);
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current += 1;
    },
    [],
  );

  async function run() {
    const current = ++request.current;
    setSearching(true);
    setErrors([]);
    setCacheNotice("");
    setCandidates([]);
    try {
      const result = await searchCatalog(query, (url, options) => fetch(url, options));
      if (current !== request.current) return;
      setCandidates(result.candidates);
      setErrors(result.fromCache ? [] : result.errors);
      setCacheNotice(result.fromCache ? (result.errors[0] ?? "") : "");
    } catch {
      if (current === request.current)
        setErrors(["Could not search the catalogue. Check your connection and try again."]);
    } finally {
      if (current === request.current) {
        setSearched(true);
        setSearching(false);
      }
    }
  }

  async function search(event: React.FormEvent) {
    event.preventDefault();
    await run();
  }

  async function save(candidate: Candidate): Promise<boolean> {
    if (saveLock.current) return false;
    saveLock.current = true;
    const key = identity(candidate);
    setSaving(key);
    setMessage("");
    setSaveError("");
    lastCandidate.current = candidate;
    try {
      const result = await saveBook(client, { ...candidate, owner: user.id });
      if (!result.ok) {
        setSaveError(result.message);
        return false;
      }
      setSaved((previous) => new Set([...previous, key]));
      setMessage(`${candidate.title} added to your library.`);
      await bookCount.refreshCount();
      return true;
    } catch (error) {
      setSaveError(
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
    if (next === "manual" && manualDraft.isbn !== isbnTo13(query))
      setManualDraft({ isbn: isbnTo13(query) });
    setTab(next);
    setMessage("");
    setSaveError("");
  }

  return {
    tab,
    manualDraft,
    editCandidate: (candidate: Candidate) => {
      setManualDraft(candidate);
      setTab("manual");
      setMessage("");
      setSaveError("");
    },
    query,
    setQuery,
    candidates,
    cacheNotice,
    searched,
    searching,
    errors,
    saved,
    ...bookCount,
    run,
    saveError,
    retrySave: () => {
      if (lastCandidate.current) void save(lastCandidate.current);
    },
    message,
    setMessage,
    saving,
    search,
    save,
    selectTab,
  };
}
