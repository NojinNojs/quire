import type { SupabaseClient, User } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { countBooks, saveBook } from "../../data/books";
import { type Candidate, searchCatalog } from "../../lib/catalog";
import { identity } from "./identity";
export function useCatalogue(user: User, client: SupabaseClient) {
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
    countBooks(client, user.id)
      .then((total) => {
        if (current) setCount(total);
      })
      .catch((error: Error) => {
        if (current) setMessage(error.message);
      });
    return () => {
      current = false;
    };
  }, [client, user.id]);

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
    if (saveLock.current) return false;
    saveLock.current = true;
    const key = identity(candidate);
    setSaving(key);
    setMessage("");
    try {
      const result = await saveBook(client, { ...candidate, owner: user.id });
      if (!result.ok) {
        setMessage(result.message);
        return false;
      }
      setSaved((previous) => new Set([...previous, key]));
      setCount((previous) => (previous === null ? null : previous + 1));
      try {
        setCount(await countBooks(client, user.id));
      } catch (error) {
        setMessage((error as Error).message);
      }
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
