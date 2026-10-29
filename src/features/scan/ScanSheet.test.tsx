// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScanFallback } from "./ScanFallback";
import { ScanSheet } from "./ScanSheet";
import type { ScannerAPIs } from "./useBarcodeScanner";

function fakeCamera(torch = false) {
  const track = Object.assign(new EventTarget(), {
    readyState: "live",
    stop: vi.fn(),
    getCapabilities: () => ({ torch }),
    applyConstraints: vi.fn().mockResolvedValue(undefined),
  });
  const detect = vi.fn().mockResolvedValue([]);
  const getUserMedia = vi.fn().mockResolvedValue({
    getTracks: () => [track],
    getVideoTracks: () => [track],
  });
  const apis: ScannerAPIs = {
    Detector: class {
      detect = detect;
    },
    mediaDevices: { getUserMedia },
  };
  return { track, detect, getUserMedia, apis };
}

async function mount(apis: ScannerAPIs) {
  const onDetected = vi.fn();
  const onClose = vi.fn();
  await act(async () => {
    render(<ScanSheet apis={apis} onDetected={onDetected} onClose={onClose} />);
  });
  return { onDetected, onClose };
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

describe("ScanSheet", () => {
  it("shows the permission request while it is unresolved", async () => {
    const fake = fakeCamera();
    fake.getUserMedia.mockReturnValue(new Promise(() => {}));
    await mount(fake.apis);
    expect(screen.getByRole("status").textContent).toContain("Asking for camera permission");
    expect(screen.getByRole("dialog", { name: "Scan a book" })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close" }));
  });

  it("renders permission denied and allows manual entry", async () => {
    const fake = fakeCamera();
    fake.getUserMedia.mockRejectedValue(new DOMException("Denied", "NotAllowedError"));
    await mount(fake.apis);
    expect(screen.getByRole("status").textContent).toContain("Camera permission denied");
    expect(screen.getByRole("textbox", { name: "ISBN-13" })).toBeTruthy();
    expect(fake.detect).not.toHaveBeenCalled();
  });

  it("uses the fallback without requesting a camera when BarcodeDetector is missing", async () => {
    const getUserMedia = vi.fn();
    const { onDetected } = await mount({ mediaDevices: { getUserMedia } });
    expect(screen.getByRole("status").textContent).toContain("not supported in this browser");
    expect(getUserMedia).not.toHaveBeenCalled();
    const input = screen.getByRole("textbox", { name: "ISBN-13" });
    expect(input.getAttribute("inputmode")).toBe("numeric");
    fireEvent.change(input, { target: { value: "9780140328722" } });
    fireEvent.click(screen.getByRole("button", { name: "Use ISBN" }));
    expect(screen.getByRole("alert").textContent).toBe("That barcode is not a valid ISBN");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(onDetected).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "9780140328721" } });
    fireEvent.click(screen.getByRole("button", { name: "Use ISBN" }));
    expect(onDetected).toHaveBeenCalledExactlyOnceWith("9780140328721");
    expect(screen.getByRole("status").textContent).toBe("ISBN found: 9780140328721");
  });

  it("shows the checksum error while continuing to scan, then shows found", async () => {
    const fake = fakeCamera();
    fake.detect
      .mockResolvedValueOnce([{ rawValue: "9780140328722" }])
      .mockResolvedValueOnce([{ rawValue: "9780140328721" }]);
    const { onDetected } = await mount(fake.apis);
    expect(screen.getByRole("status").textContent).toContain("Scanning.");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    expect(screen.getByRole("status").textContent).toBe("That barcode is not a valid ISBN");
    expect(screen.queryByRole("textbox")).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    expect(screen.getByRole("status").textContent).toBe("ISBN found: 9780140328721");
    expect(onDetected).toHaveBeenCalledExactlyOnceWith("9780140328721");
  });

  it("keeps manual entry available if the camera ends while video playback is starting", async () => {
    let play!: () => void;
    vi.spyOn(HTMLMediaElement.prototype, "play").mockReturnValue(
      new Promise<void>((resolve) => {
        play = resolve;
      }),
    );
    const fake = fakeCamera();
    const { onDetected } = await mount(fake.apis);
    await act(async () => {
      fake.track.dispatchEvent(new Event("ended"));
    });
    await act(async () => {
      play();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(screen.getByRole("status").textContent).toContain("No camera available");
    expect(fake.detect).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "9780140328721" } });
    fireEvent.click(screen.getByRole("button", { name: "Use ISBN" }));
    expect(onDetected).toHaveBeenCalledExactlyOnceWith("9780140328721");
  });

  it("ignores an in-flight detection when the camera has ended", async () => {
    let detect!: (results: { rawValue: string }[]) => void;
    const fake = fakeCamera();
    fake.detect.mockReturnValue(
      new Promise((resolve) => {
        detect = resolve;
      }),
    );
    const { onDetected } = await mount(fake.apis);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    await act(async () => {
      fake.track.dispatchEvent(new Event("ended"));
    });
    await act(async () => {
      detect([{ rawValue: "9780140328721" }]);
    });
    expect(onDetected).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toContain("No camera available");
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("renders no camera when the device cannot be found", async () => {
    const fake = fakeCamera();
    fake.getUserMedia.mockRejectedValue(new DOMException("Missing", "NotFoundError"));
    await mount(fake.apis);
    expect(screen.getByRole("status").textContent).toContain("No camera available");
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("falls back if the detector cannot initialize or process frames", async () => {
    const fake = fakeCamera();
    fake.detect.mockRejectedValue(new DOMException("Unsupported", "NotSupportedError"));
    await mount(fake.apis);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    expect(screen.getByRole("textbox")).toBeTruthy();
    expect(fake.track.stop).toHaveBeenCalled();
    cleanup();
    await mount({
      Detector: class {
        constructor() {
          throw new Error("Unsupported");
        }
        detect = fake.detect;
      },
    });
    expect(screen.getByRole("status").textContent).toContain("not supported");
  });

  it("offers the light only when supported and stops it immediately on close", async () => {
    const fake = fakeCamera(true);
    const { onClose } = await mount(fake.apis);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Turn light on" }));
    });
    expect(fake.track.applyConstraints).toHaveBeenLastCalledWith({ advanced: [{ torch: true }] });
    expect(
      screen.getByRole("button", { name: "Turn light off" }).getAttribute("aria-pressed"),
    ).toBe("true");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Turn light off" }));
    });
    expect(fake.track.applyConstraints).toHaveBeenLastCalledWith({ advanced: [{ torch: false }] });
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(fake.track.stop).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
    cleanup();
    await mount(fakeCamera().apis);
    expect(screen.queryByRole("button", { name: /light/ })).toBeNull();
  });

  it("reports a rejected torch operation without claiming the light is on", async () => {
    const fake = fakeCamera(true);
    fake.track.applyConstraints.mockRejectedValue(new Error("Unavailable"));
    await mount(fake.apis);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Turn light on" }));
    });
    expect(screen.getByRole("alert").textContent).toContain("light could not be changed");
    expect(screen.getByRole("button", { name: "Turn light on" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
  });

  it("handles a camera ending and closes on Escape with focus restored", async () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    const fake = fakeCamera(true);
    const { onClose } = await mount(fake.apis);
    await act(async () => {
      fake.track.dispatchEvent(new Event("ended"));
    });
    expect(screen.getByRole("status").textContent).toContain("No camera available");
    expect(screen.queryByRole("button", { name: /light/ })).toBeNull();
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(onClose).toHaveBeenCalledOnce();
    cleanup();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});

it("validates the standalone fallback and ignores duplicate submissions", () => {
  const onDetected = vi.fn();
  render(<ScanFallback onDetected={onDetected} />);
  const input = screen.getByRole("textbox");
  for (const value of ["", "4006381333931", "9780140328722", "abcdefghijklm"]) {
    fireEvent.change(input, { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "Use ISBN" }));
    expect(screen.getByRole("alert").textContent).toBe("That barcode is not a valid ISBN");
  }
  expect(onDetected).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: "9780140328721" } });
  fireEvent.submit(input.closest("form") as HTMLFormElement);
  fireEvent.submit(input.closest("form") as HTMLFormElement);
  expect(onDetected).toHaveBeenCalledExactlyOnceWith("9780140328721");
});
