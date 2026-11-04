import type { SupabaseClient, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "../../components/toast";
import { saveBook } from "../../data/books";
import { type Candidate, searchCatalog } from "../../lib/catalog";
import { isbnTo13 } from "../../lib/isbn";
import type { ScanRequest } from "../scan/useScanRequest";
import { identity } from "./identity";
import { useBookCount } from "./useBookCount";
export function useCatalogue(
  user: User,
  client: SupabaseClient,
  scanRequest?: ScanRequest | null,
  onScanHandled?: (nonce: number) => void,
) {
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
  const [saveError, setSaveError] = useState<{
    message: string;
    kind: "duplicate" | "unknown";
  } | null>(null);
  const lastCandidate = useRef<Candidate | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const saveLock = useRef(false);
  const request = useRef(0);
  const toast = useToast();
  useEffect(
    () => () => {
      request.current += 1;
    },
    [],
  );

  const run = useCallback(async (term: string) => {
    const current = ++request.current;
    setSearching(true);
    setErrors([]);
    setCacheNotice("");
    setCandidates([]);
    try {
      const result = await searchCatalog(term, (url, options) => fetch(url, options));
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
  }, []);

  const handled = useRef(onScanHandled);
  useEffect(() => {
    handled.current = onScanHandled;
  }, [onScanHandled]);

  const handledNonce = useRef(0);
  useEffect(() => {
    if (!scanRequest || scanRequest.nonce <= handledNonce.current) return;
    handledNonce.current = scanRequest.nonce;
    setQuery(scanRequest.isbn);
    setTab("search");
    const isbn = isbnTo13(scanRequest.isbn);
    setManualDraft(isbn ? { isbn } : {});
    setMessage("");
    setSaveError(null);
    void run(scanRequest.isbn);
    handled.current?.(scanRequest.nonce);
  }, [scanRequest, run]);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    await run(query);
  }

  async function save(candidate: Candidate): Promise<boolean> {
    if (saveLock.current) return false;
    saveLock.current = true;
    const key = identity(candidate);
    setSaving(key);
    setMessage("");
    setSaveError(null);
    lastCandidate.current = candidate;
    try {
      const result = await saveBook(client, { ...candidate, owner: user.id });
      if (!result.ok) {
        // Duplicates stay in the inline panel, which announces them; a toast would repeat it.
        setSaveError({ message: result.message, kind: result.kind });
        if (result.kind !== "duplicate") toast.error(result.message);
        return false;
      }
      setSaved((previous) => new Set([...previous, key]));
      setMessage("");
      toast.success(`${candidate.title} added to your library.`);
      await bookCount.refreshCount();
      return true;
    } catch (error) {
      const message =
        error instanceof Error ||
        (typeof error === "object" && error !== null && "message" in error)
          ? String(error.message)
          : "Could not save the book. Try again.";
      setSaveError({ message, kind: "unknown" });
      toast.error(message);
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
    setSaveError(null);
  }

  return {
    tab,
    manualDraft,
    editCandidate: (candidate: Candidate) => {
      setManualDraft(candidate);
      setTab("manual");
      setMessage("");
      setSaveError(null);
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
