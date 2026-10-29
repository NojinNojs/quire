import { useEffect, useId, useState } from "react";
import { type CoverStage, type CoversClient, removeCover, uploadCover } from "../../data/covers";
import { supabase } from "../../lib/supabase";
import { CoverImage } from "./CoverImage";

export function TodayCover({
  bookId,
  title,
  author,
  ddc,
  coverUrl,
  client = supabase,
}: {
  bookId: string;
  title: string;
  author?: string | null;
  ddc?: string | null;
  coverUrl: string | null;
  client?: CoversClient | null;
}) {
  const id = useId();
  const [record, setRecord] = useState<{ owner: string; cover_path: string | null } | null>(null);
  const [stage, setStage] = useState<CoverStage | "Removing cover" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    // Each retry starts a fresh load without leaving stale owner information visible.
    void attempt;
    let live = true;
    setRecord(null);
    if (!client) return;
    void (async () => {
      try {
        const { data, error } = await client
          .from("books")
          .select("owner,cover_path")
          .eq("id", bookId)
          .single();
        if (error || !data) throw new Error("Could not load cover controls. Try again.");
        if (live) {
          setRecord(data);
          setError(null);
        }
      } catch {
        if (live) setError("Could not load cover controls. Try again.");
      }
    })();
    return () => {
      live = false;
    };
  }, [client, bookId, attempt]);

  async function change(file?: File) {
    if (!record || !client || stage) return;
    setError(null);
    try {
      let path: string | null = null;
      if (file) path = await uploadCover(client, record.owner, bookId, file, setStage);
      else {
        setStage("Removing cover");
        await removeCover(client, record.owner, bookId);
      }
      setRecord({ ...record, cover_path: path });
      setRevision((value) => value + 1);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not change the cover. Try again.");
    } finally {
      setStage(null);
    }
  }
  return (
    <div className="today-cover">
      <CoverImage
        key={revision}
        coverPath={record?.cover_path}
        coverUrl={coverUrl}
        title={title}
        author={author}
        ddc={ddc}
        className="reading-cover"
        client={client}
      />
      <div className="cover-controls" aria-busy={stage !== null}>
        <label htmlFor={id}>Upload cover</label>
        <input
          id={id}
          type="file"
          accept="image/*"
          capture="environment"
          disabled={!record || !!stage}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) void change(file);
          }}
        />
        {record?.cover_path && (
          <button type="button" disabled={!!stage} onClick={() => void change()}>
            Remove cover
          </button>
        )}
        {stage && (
          <>
            <progress aria-label={stage} />
            <p role="status">{stage}...</p>
          </>
        )}
        {error && <p role="alert">{error}</p>}
        {error && !record && (
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>
            Retry cover
          </button>
        )}
      </div>
    </div>
  );
}
