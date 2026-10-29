export function parseCatalogueHtml(html: string): { title: string; author: string | null } | null {
  const page = new DOMParser().parseFromString(html, "text/html");
  const heading = page.querySelector("title")?.textContent?.trim();
  const metadata = heading?.match(/^(.+?)\s+-\s+Google (?:Buku|Books)$/i)?.[1]?.trim();
  if (!metadata) return null;
  const separator = metadata.lastIndexOf(" - ");
  const title = (separator < 0 ? metadata : metadata.slice(0, separator)).trim();
  const author = separator < 0 ? null : metadata.slice(separator + 3).trim() || null;
  return title ? { title, author } : null;
}

export async function lookupCatalogueHtml(
  isbn: string,
  read: (url: string) => Promise<string>,
): Promise<{ title: string; author: string | null } | null> {
  return parseCatalogueHtml(await read(`/gb/books?vid=ISBN${encodeURIComponent(isbn)}`));
}
