import { useEffect, useState } from "react";
import { type CoversClient, signedCoverUrl } from "../../data/covers";
import { clothFor } from "../../lib/edition";
import { supabase } from "../../lib/supabase";
import "../../styles/covers.css";

export function CoverImage({
  coverPath,
  coverUrl,
  title,
  author,
  ddc,
  className = "",
  client = supabase,
}: {
  coverPath?: string | null;
  coverUrl?: string | null;
  title: string;
  author?: string | null;
  ddc?: string | null;
  className?: string;
  client?: CoversClient | null;
}) {
  const [signed, setSigned] = useState<{ path: string; url: string } | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  useEffect(() => {
    let live = true;
    if (!coverPath || !client) return;
    const source = client;
    const path = coverPath;
    async function refresh() {
      try {
        const url = await signedCoverUrl(source, path);
        if (live) setSigned({ path, url });
      } catch {
        if (live) setSigned(null);
      }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 60 * 1000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [client, coverPath]);
  const remote = coverUrl && /^https?:\/\//i.test(coverUrl) ? coverUrl : null;
  const src = [signed && signed.path === coverPath ? signed.url : null, remote].find(
    (url) => url && !failed.includes(url),
  );
  return (
    <div className={`cover-image cover-cloth-${clothFor(title)} ${className}`}>
      {src ? (
        <img
          src={src}
          alt={`Cover of ${title}`}
          onError={() => setFailed((urls) => [...urls, src])}
        />
      ) : (
        <span className="cover-jacket" role="img" aria-label={`${title}, no cover image`}>
          <span className="cover-jacket-heading">
            <span className="cover-jacket-title">{title}</span>
            <span className="cover-jacket-author">{author?.trim() || "Author unknown"}</span>
          </span>
          <span className="cover-jacket-class">
            {ddc?.trim() || "Unclassified"}
            <span className="cover-jacket-rule" />
          </span>
        </span>
      )}
    </div>
  );
}
