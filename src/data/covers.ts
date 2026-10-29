import type { SupabaseClient } from "@supabase/supabase-js";

export type CoversClient = Pick<SupabaseClient, "from" | "storage">;
export type CoverStage = "Preparing image" | "Uploading cover" | "Saving cover";
const lifetime = 3600;
const urls = new WeakMap<CoversClient, Map<string, { url: string; expires: number }>>();

export function coverDimensions(width: number, height: number) {
  if (width <= 0 || height <= 0) throw new Error("This image has no usable dimensions.");
  const scale = Math.min(1, 600 / width);
  return { width: Math.round(width * scale), height: Math.max(1, Math.round(height * scale)) };
}

export async function downscaleCover(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  const image = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const canvas = document.createElement("canvas");
    Object.assign(canvas, coverDimensions(image.width, image.height));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this image.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob?.type === "image/webp") resolve(blob);
          else
            reject(new Error("Your browser could not create a WebP cover. Try another browser."));
        },
        "image/webp",
        0.85,
      );
    });
  } finally {
    image.close();
  }
}

export function coverPath(owner: string, bookId: string) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(owner) || !uuid.test(bookId))
    throw new Error("This book could not be identified.");
  return `${owner}/${bookId}/cover.webp`;
}

async function writePath(client: CoversClient, owner: string, bookId: string, path: string | null) {
  const { data, error } = await client
    .from("books")
    .update({ cover_path: path })
    .eq("owner", owner)
    .eq("id", bookId)
    .select("id")
    .single();
  if (error || !data)
    throw new Error("Could not save the cover. Check your connection and try again.");
}

export async function uploadCover(
  client: CoversClient,
  owner: string,
  bookId: string,
  file: File,
  onStage?: (stage: CoverStage) => void,
): Promise<string> {
  const path = coverPath(owner, bookId);
  onStage?.("Preparing image");
  const blob = await downscaleCover(file);
  onStage?.("Uploading cover");
  const { error } = await client.storage.from("covers").upload(path, blob, {
    contentType: "image/webp",
    upsert: true,
    cacheControl: "0",
  });
  if (error) throw new Error("Could not upload the cover. Check your connection and try again.");
  urls.get(client)?.delete(path);
  onStage?.("Saving cover");
  await writePath(client, owner, bookId, path);
  return path;
}

export async function signedCoverUrl(client: CoversClient, path: string): Promise<string> {
  let cache = urls.get(client);
  if (!cache) {
    cache = new Map();
    urls.set(client, cache);
  }
  const cached = cache.get(path);
  if (cached && cached.expires > Date.now()) return cached.url;
  const { data, error } = await client.storage.from("covers").createSignedUrl(path, lifetime);
  if (error || !data) throw new Error("Could not load the cover.");
  // The revision also bypasses an image already cached at this stable storage path after replacement.
  const url = `${data.signedUrl}&revision=${Date.now()}`;
  cache.set(path, { url, expires: Date.now() + (lifetime - 60) * 1000 });
  return url;
}

export async function removeCover(client: CoversClient, owner: string, bookId: string) {
  const path = coverPath(owner, bookId);
  const { error } = await client.storage.from("covers").remove([path]);
  if (error) throw new Error("Could not remove the cover. Check your connection and try again.");
  await writePath(client, owner, bookId, null);
  urls.get(client)?.delete(path);
}
