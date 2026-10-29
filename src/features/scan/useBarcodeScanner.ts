import { useEffect, useRef, useState } from "react";
import { isbnTo13 } from "../../lib/isbn";

export type ScanState =
  | "asking-permission"
  | "permission-denied"
  | "no-camera"
  | "unsupported"
  | "scanning"
  | "found"
  | "bad-checksum"
  | "camera-error";

export interface BarcodeDetectorLike {
  detect(video: HTMLVideoElement): Promise<ReadonlyArray<{ rawValue: string }>>;
}

export interface ScannerAPIs {
  Detector?: new (options: { formats: string[] }) => BarcodeDetectorLike;
  mediaDevices?: Pick<MediaDevices, "getUserMedia">;
}

export interface BarcodeScannerOptions {
  onDetected: (isbn13: string) => void;
  /** Omit to use browser APIs. An explicit empty object exercises the fallback. */
  apis?: ScannerAPIs;
  throttleMs?: number;
}

type TorchConstraint = MediaTrackConstraintSet & { torch: boolean };

function browserAPIs(): ScannerAPIs {
  return {
    Detector: (globalThis as typeof globalThis & { BarcodeDetector?: ScannerAPIs["Detector"] })
      .BarcodeDetector,
    mediaDevices: typeof navigator === "undefined" ? undefined : navigator.mediaDevices,
  };
}

export function useBarcodeScanner({ onDetected, apis, throttleMs = 250 }: BarcodeScannerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const callback = useRef(onDetected);
  const controls = useRef({
    stop: () => {},
    submit: (_value: string): boolean => false,
    toggleTorch: async () => {},
  });
  const [state, setState] = useState<ScanState>("asking-permission");
  const [isbn, setIsbn] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchBusy, setTorchBusy] = useState(false);
  const [torchError, setTorchError] = useState(false);

  useEffect(() => {
    callback.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let active = true;
    let reported = false;
    let cameraStopped = false;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let torchPending = false;
    let light = false;
    const video = videoRef.current;
    const api = apis ?? browserAPIs();
    const delay = Math.max(100, throttleMs);

    const releaseCamera = () => {
      cameraStopped = true;
      clearTimeout(timer);
      for (const track of stream?.getTracks() ?? []) track.stop();
      if (video) video.srcObject = null;
    };
    const stop = () => {
      active = false;
      releaseCamera();
      setCameraActive(false);
      setTorchOn(false);
      setTorchSupported(false);
    };
    const submit = (value: string) => {
      if (!active || reported) return false;
      const valid = /^\d{13}$/.test(value) ? isbnTo13(value) : null;
      if (!valid) {
        setState("bad-checksum");
        return false;
      }
      reported = true;
      setIsbn(valid);
      setState("found");
      stop();
      callback.current(valid);
      return true;
    };
    controls.current = {
      stop,
      submit,
      toggleTorch: async () => {
        const track = stream?.getVideoTracks()[0];
        if (!active || cameraStopped || !track || torchPending) return;
        torchPending = true;
        setTorchBusy(true);
        setTorchError(false);
        try {
          const next = !light;
          await track.applyConstraints({ advanced: [{ torch: next } as TorchConstraint] });
          if (active && !cameraStopped) {
            light = next;
            setTorchOn(next);
          } else {
            // A pending torch operation can finish after close. Stop again in that case.
            track.stop();
          }
        } catch {
          if (active && !cameraStopped) setTorchError(true);
        } finally {
          torchPending = false;
          if (active) setTorchBusy(false);
        }
      },
    };
    setCameraActive(false);
    setState("asking-permission");
    setIsbn(null);
    setTorchSupported(false);
    setTorchOn(false);
    setTorchBusy(false);
    setTorchError(false);

    const start = async () => {
      if (!api.Detector) {
        setState("unsupported");
        return;
      }
      let detector: BarcodeDetectorLike;
      try {
        detector = new api.Detector({ formats: ["ean_13"] });
      } catch {
        setState("unsupported");
        return;
      }
      if (!api.mediaDevices) {
        setState("no-camera");
        return;
      }
      try {
        const acquired = await api.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!active) {
          for (const track of acquired.getTracks()) track.stop();
          return;
        }
        stream = acquired;
        const track = stream.getVideoTracks()[0];
        if (!track || !video || track.readyState === "ended") {
          releaseCamera();
          setState("no-camera");
          return;
        }
        track.addEventListener("ended", () => {
          if (!active) return;
          releaseCamera();
          setCameraActive(false);
          setTorchSupported(false);
          setTorchOn(false);
          setState("no-camera");
        });
        const capabilities = track.getCapabilities?.() as
          | (MediaTrackCapabilities & { torch?: boolean })
          | undefined;
        setTorchSupported(capabilities?.torch === true);
        video.srcObject = stream;
        await video.play();
        if (!active || cameraStopped) return;
        setCameraActive(true);
        setState("scanning");
      } catch (error) {
        if (!active || cameraStopped) return;
        releaseCamera();
        setCameraActive(false);
        setTorchSupported(false);
        const name =
          typeof error === "object" && error !== null && "name" in error ? error.name : "";
        setState(
          name === "NotAllowedError" || name === "SecurityError"
            ? "permission-denied"
            : name === "NotFoundError" || name === "DevicesNotFoundError"
              ? "no-camera"
              : "camera-error",
        );
        return;
      }
      const scan = async () => {
        if (!active || cameraStopped) return;
        if (video && video.readyState >= 2) {
          let results: ReadonlyArray<{ rawValue: string }>;
          try {
            results = await detector.detect(video);
          } catch {
            if (!active || cameraStopped) return;
            releaseCamera();
            setCameraActive(false);
            setTorchSupported(false);
            setTorchOn(false);
            setState("unsupported");
            return;
          }
          if (!active || cameraStopped) return;
          for (const result of results) {
            if (submit(result.rawValue)) return;
          }
        }
        if (active) timer = setTimeout(scan, delay);
      };
      timer = setTimeout(scan, delay);
    };
    void start();
    return () => {
      active = false;
      releaseCamera();
    };
  }, [apis, throttleMs]);

  return {
    videoRef,
    cameraActive,
    state,
    isbn,
    torchSupported,
    torchOn,
    torchBusy,
    torchError,
    stop: () => controls.current.stop(),
    submit: (value: string) => controls.current.submit(value),
    toggleTorch: () => controls.current.toggleTorch(),
  };
}
