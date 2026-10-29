import "../shelf/test-dom";
import { File } from "node:buffer";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type CoversClient,
  coverDimensions,
  downscaleCover,
  removeCover,
  signedCoverUrl,
  uploadCover,
} from "../../data/covers";
import { CoverImage } from "./CoverImage";
import { TodayCover } from "./TodayCover";

const owner = "11111111-1111-4111-8111-111111111111";
const bookId = "22222222-2222-4222-8222-222222222222";
const path = `${owner}/${bookId}/cover.webp`;
function fake() {
  const upload = vi.fn().mockResolvedValue({ error: null });
  const remove = vi.fn().mockResolvedValue({ error: null });
  const createSignedUrl = vi.fn().mockResolvedValue({
    data: { signedUrl: "https://storage.test/cover?token=one" },
    error: null,
  });
  const query = {
    update: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi
      .fn()
      .mockResolvedValue({ data: { id: bookId, owner, cover_path: path }, error: null }),
  };
  const client = {
    storage: { from: vi.fn(() => ({ upload, remove, createSignedUrl })) },
    from: vi.fn(() => query),
  } as unknown as CoversClient;
  return { client, upload, remove, createSignedUrl, query };
}
function browserImage(width = 1200, height = 1800) {
  const close = vi.fn();
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width, height, close }));
  const drawImage = vi.fn();
  vi.spyOn(document, "createElement").mockImplementationOnce(
    () =>
      ({
        width: 0,
        height: 0,
        getContext: () => ({ drawImage }),
        toBlob: (done: (blob: Blob) => void) => done(new Blob(["webp"], { type: "image/webp" })),
      }) as unknown as HTMLCanvasElement,
  );
  return { close, drawImage };
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("cover storage", () => {
  it("keeps portrait and landscape proportions, never upscales, and uses a browser File", async () => {
    expect(coverDimensions(1200, 1800)).toEqual({ width: 600, height: 900 });
    expect(coverDimensions(1800, 900)).toEqual({ width: 600, height: 300 });
    expect(coverDimensions(300, 450)).toEqual({ width: 300, height: 450 });
    expect(() => coverDimensions(0, 1)).toThrow();
    const image = browserImage();
    const blob = await downscaleCover(
      new File(["photo"], "photo.jpg", { type: "image/jpeg" }) as unknown as globalThis.File,
    );
    expect(blob.type).toBe("image/webp");
    expect(image.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 600, 900);
    expect(image.close).toHaveBeenCalled();
  });
  it("uploads only webp at the owner/book path, then saves the path", async () => {
    const f = fake();
    browserImage();
    const stage = vi.fn();
    expect(
      await uploadCover(
        f.client,
        owner,
        bookId,
        new File(["photo"], "photo.png", { type: "image/png" }) as unknown as globalThis.File,
        stage,
      ),
    ).toBe(path);
    expect(f.upload).toHaveBeenCalledWith(path, expect.any(Blob), {
      contentType: "image/webp",
      upsert: true,
      cacheControl: "0",
    });
    expect(f.query.update).toHaveBeenCalledWith({ cover_path: path });
    expect(f.query.eq).toHaveBeenCalledWith("owner", owner);
    expect(stage.mock.calls.flat()).toEqual(["Preparing image", "Uploading cover", "Saving cover"]);
    await expect(
      uploadCover(f.client, "../another", bookId, {} as globalThis.File),
    ).rejects.toThrow();
  });
  it("does not save a failed upload and rejects unsupported files", async () => {
    const f = fake();
    browserImage();
    f.upload.mockResolvedValue({ error: new Error("offline") });
    await expect(
      uploadCover(
        f.client,
        owner,
        bookId,
        new File(["photo"], "photo.jpg", { type: "image/jpeg" }) as unknown as globalThis.File,
      ),
    ).rejects.toThrow("Could not upload");
    expect(f.query.update).not.toHaveBeenCalled();
    await expect(
      downscaleCover(
        new File(["text"], "text.txt", { type: "text/plain" }) as unknown as globalThis.File,
      ),
    ).rejects.toThrow("Choose an image");
  });
  it("caches per client and refreshes before expiration", async () => {
    vi.useFakeTimers();
    const f = fake();
    await signedCoverUrl(f.client, path);
    await signedCoverUrl(f.client, path);
    expect(f.createSignedUrl).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(3540_001);
    await signedCoverUrl(f.client, path);
    expect(f.createSignedUrl).toHaveBeenCalledTimes(2);
    const other = fake();
    await signedCoverUrl(other.client, path);
    expect(other.createSignedUrl).toHaveBeenCalledTimes(1);
  });
  it("removes the object, clears the persisted path, and invalidates cached URLs", async () => {
    const f = fake();
    await signedCoverUrl(f.client, path);
    await removeCover(f.client, owner, bookId);
    expect(f.remove).toHaveBeenCalledWith([path]);
    expect(f.query.update).toHaveBeenCalledWith({ cover_path: null });
    await signedCoverUrl(f.client, path);
    expect(f.createSignedUrl).toHaveBeenCalledTimes(2);
  });
});

it("falls from signed storage to the remote cover, then an honest drawn jacket", async () => {
  const f = fake();
  render(
    <CoverImage
      client={f.client}
      coverPath={path}
      coverUrl="https://remote.test/cover.jpg"
      title="Bumi Manusia"
    />,
  );
  await waitFor(() =>
    expect(screen.getByRole("img").getAttribute("src")).toContain("storage.test"),
  );
  fireEvent.error(screen.getByRole("img"));
  expect(screen.getByRole("img").getAttribute("src")).toBe("https://remote.test/cover.jpg");
  fireEvent.error(screen.getByRole("img"));
  expect(screen.getByRole("img", { name: "No cover for Bumi Manusia" })).toBeTruthy();
  expect(screen.getByText("No cover")).toBeTruthy();
});
it("uses the remote cover when signing fails and rejects inline image URLs", async () => {
  const f = fake();
  f.createSignedUrl.mockResolvedValue({ error: new Error("denied"), data: null });
  const view = render(
    <CoverImage
      client={f.client}
      coverPath={path}
      coverUrl="https://remote.test/cover.jpg"
      title="Book"
    />,
  );
  await waitFor(() => expect(f.createSignedUrl).toHaveBeenCalled());
  expect(screen.getByRole("img").getAttribute("src")).toContain("remote.test");
  view.rerender(<CoverImage client={null} coverUrl="data:image/png;base64,legacy" title="Book" />);
  expect(screen.getByText("No cover")).toBeTruthy();
});
it("offers the camera input and reports a failed removal with retry still available", async () => {
  const f = fake();
  f.remove.mockResolvedValue({ error: new Error("offline") });
  render(<TodayCover client={f.client} bookId={bookId} title="Book" coverUrl={null} />);
  expect(screen.getByLabelText("Upload cover").getAttribute("capture")).toBe("environment");
  await screen.findByRole("button", { name: "Remove cover" });
  fireEvent.click(screen.getByRole("button", { name: "Remove cover" }));
  await screen.findByRole("alert");
  expect(f.query.update).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Remove cover" }).hasAttribute("disabled")).toBe(false);
});

it("refreshes a mounted signed image before its one-hour lifetime ends", async () => {
  vi.useFakeTimers();
  const f = fake();
  await act(async () => {
    render(<CoverImage client={f.client} coverPath={path} title="Book" />);
  });
  expect(f.createSignedUrl).toHaveBeenCalledTimes(1);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(59 * 60 * 1000);
  });
  expect(f.createSignedUrl).toHaveBeenCalledTimes(2);
});
