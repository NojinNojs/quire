// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type ScannerAPIs, useBarcodeScanner } from "./useBarcodeScanner";

function camera() {
  const track = Object.assign(new EventTarget(), {
    stop: vi.fn(),
    readyState: "live",
    getCapabilities: () => ({ torch: true }),
    applyConstraints: vi.fn().mockResolvedValue(undefined),
  });
  const stream = {
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream;
  const detect = vi.fn().mockResolvedValue([]);
  const construct = vi.fn();
  const getUserMedia = vi.fn().mockResolvedValue(stream);
  const apis: ScannerAPIs = {
    Detector: class {
      constructor(options: { formats: string[] }) {
        construct(options);
      }
      detect = detect;
    },
    mediaDevices: { getUserMedia },
  };
  return { track, stream, detect, construct, getUserMedia, apis };
}

function Harness({ apis, onDetected }: { apis: ScannerAPIs; onDetected: (isbn: string) => void }) {
  const scanner = useBarcodeScanner({ apis, onDetected });
  return (
    <>
      <video ref={scanner.videoRef} aria-label="Camera" muted />
      <p>{scanner.state}</p>
      <button type="button" onClick={scanner.toggleTorch}>
        Torch {String(scanner.torchOn)}
      </button>
    </>
  );
}

async function mount(apis: ScannerAPIs, onDetected = vi.fn()) {
  let result: ReturnType<typeof render> | undefined;
  await act(async () => {
    result = render(<Harness apis={apis} onDetected={onDetected} />);
  });
  if (!result) throw new Error("Harness did not mount");
  return { ...result, onDetected };
}

async function frame() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "readyState", "get").mockReturnValue(2);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useBarcodeScanner", () => {
  it("requests the rear camera and reports the first valid ISBN exactly once", async () => {
    const fake = camera();
    fake.detect.mockResolvedValue([
      { rawValue: "9780140328721" },
      { rawValue: "9780140328721" },
      { rawValue: "9780306406157" },
    ]);
    const { onDetected } = await mount(fake.apis);
    expect(fake.getUserMedia).toHaveBeenCalledWith({ video: { facingMode: "environment" } });
    expect(fake.construct).toHaveBeenCalledWith({ formats: ["ean_13"] });
    expect(fake.detect).not.toHaveBeenCalled();
    await frame();
    await frame();
    expect(onDetected).toHaveBeenCalledExactlyOnceWith("9780140328721");
    expect(fake.detect).toHaveBeenCalledTimes(1);
    expect(screen.getByText("found")).toBeTruthy();
    expect(fake.track.stop).toHaveBeenCalled();
    expect((screen.getByLabelText("Camera") as HTMLVideoElement).srcObject).toBeNull();
  });

  it("rejects a bad checksum and a non-book EAN, then keeps scanning", async () => {
    const fake = camera();
    fake.detect
      .mockResolvedValueOnce([{ rawValue: "9780140328722" }, { rawValue: "4006381333931" }])
      .mockResolvedValueOnce([{ rawValue: "9780140328721" }]);
    const { onDetected } = await mount(fake.apis);
    await frame();
    expect(screen.getByText("bad-checksum")).toBeTruthy();
    expect(onDetected).not.toHaveBeenCalled();
    expect(fake.track.stop).not.toHaveBeenCalled();
    await frame();
    expect(onDetected).toHaveBeenCalledExactlyOnceWith("9780140328721");
  });

  it("does not overlap slow detections or report a result after unmount", async () => {
    const fake = camera();
    let resolve!: (codes: { rawValue: string }[]) => void;
    fake.detect.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const { unmount, onDetected } = await mount(fake.apis);
    await frame();
    await frame();
    expect(fake.detect).toHaveBeenCalledTimes(1);
    unmount();
    await act(async () => resolve([{ rawValue: "9780140328721" }]));
    expect(onDetected).not.toHaveBeenCalled();
    expect(fake.track.stop).toHaveBeenCalled();
  });

  it("stops a camera that resolves after unmount", async () => {
    const fake = camera();
    let resolve!: (stream: MediaStream) => void;
    fake.getUserMedia.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const { unmount } = await mount(fake.apis);
    unmount();
    await act(async () => resolve(fake.stream));
    expect(fake.track.stop).toHaveBeenCalled();
  });

  it("waits for a video frame before detecting", async () => {
    vi.spyOn(HTMLMediaElement.prototype, "readyState", "get").mockReturnValue(0);
    const fake = camera();
    await mount(fake.apis);
    await frame();
    expect(fake.detect).not.toHaveBeenCalled();
    vi.spyOn(HTMLMediaElement.prototype, "readyState", "get").mockReturnValue(2);
    await frame();
    expect(fake.detect).toHaveBeenCalledTimes(1);
  });

  it("stops the torch track even if its constraint resolves after unmount", async () => {
    const fake = camera();
    let resolve!: () => void;
    fake.track.applyConstraints.mockReturnValue(
      new Promise<void>((done) => {
        resolve = done;
      }),
    );
    const { unmount } = await mount(fake.apis);
    await act(async () => screen.getByRole("button").click());
    expect(fake.track.applyConstraints).toHaveBeenCalledWith({ advanced: [{ torch: true }] });
    unmount();
    await act(async () => resolve());
    expect(fake.track.stop).toHaveBeenCalledTimes(2);
  });

  it("cleans up the superseded permission request in React StrictMode", async () => {
    const fake = camera();
    const onDetected = vi.fn();
    await act(async () => {
      render(
        <StrictMode>
          <Harness apis={fake.apis} onDetected={onDetected} />
        </StrictMode>,
      );
    });
    expect(fake.getUserMedia).toHaveBeenCalledTimes(2);
    expect(fake.track.stop).toHaveBeenCalledTimes(1);
    fake.detect.mockResolvedValue([{ rawValue: "9780140328721" }]);
    await frame();
    expect(onDetected).toHaveBeenCalledExactlyOnceWith("9780140328721");
  });
});
