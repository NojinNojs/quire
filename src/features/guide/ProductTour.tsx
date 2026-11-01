import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TourPanel } from "./TourPanel";
import { steps } from "./tourSteps";
import "../../styles/guide.css";

const tourEvent = "quire:open-guide";

type Rect = { top: number; left: number; width: number; height: number };

export function openProductTour() {
  window.dispatchEvent(new window.Event(tourEvent));
}

function initialPhase(key: string): "tour" | null {
  if (typeof window === "undefined") return null;
  if (new URLSearchParams(window.location.search).get("tour") === "1") return "tour";
  if (window.location.hash && window.location.hash !== "#/shelf") return null;
  try {
    return window.localStorage.getItem(key) ? null : "tour";
  } catch {
    return "tour";
  }
}

export function ProductTour({ scope }: { scope: string }) {
  const key = `quire:tour:v1:${scope}`;
  const [phase, setPhase] = useState(() => initialPhase(key));
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [placement, setPlacement] = useState<CSSProperties>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const step = steps[index] ?? steps[0];

  const start = useCallback(() => {
    returnFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setIndex(0);
    setPhase("tour");
  }, []);

  const close = useCallback(
    (completed = false) => {
      try {
        window.localStorage.setItem(key, completed ? "completed" : "dismissed");
      } catch {
        /* The guide remains usable without storage. */
      }
      setPhase(null);
      setRect(null);
      const previous = returnFocus.current;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
      else
        document.querySelector<HTMLButtonElement>(".shell-guide")?.focus({ preventScroll: true });
    },
    [key],
  );

  useEffect(() => {
    const open = () => start();
    window.addEventListener(tourEvent, open);
    const url = new URL(window.location.href);
    if (url.searchParams.has("tour")) {
      url.searchParams.delete("tour");
      window.history.replaceState(null, "", url);
    }
    return () => window.removeEventListener(tourEvent, open);
  }, [start]);

  useEffect(() => {
    if (phase !== "tour") return;
    window.location.hash = step.route;
    setRect(null);
    heading.current?.focus({ preventScroll: true });
    let timer: ReturnType<typeof setTimeout>;
    let frame = 0;
    let tries = 0;
    const measure = () => {
      const target = document.querySelector(step.target);
      if (!target) {
        setRect(null);
        return;
      }
      const box = target.getBoundingClientRect();
      const top = Math.max(0, box.top - 8);
      const left = Math.max(0, box.left - 8);
      const width = Math.max(0, Math.min(window.innerWidth, box.right + 8) - left);
      const height = Math.max(0, Math.min(window.innerHeight, box.bottom + 8) - top);
      const panel = document.querySelector(".tour-panel")?.getBoundingClientRect();
      if (panel && window.innerWidth >= 768) {
        const gap = 24;
        const rightFits = window.innerWidth - (left + width) - gap >= panel.width;
        const leftFits = left - gap >= panel.width;
        const panelLeft = rightFits
          ? left + width + gap
          : leftFits
            ? left - panel.width - gap
            : window.innerWidth - panel.width - gap;
        const preferredTop = !rightFits && !leftFits ? top + height + 16 : top;
        const panelTop = Math.max(
          gap,
          Math.min(preferredTop, window.innerHeight - panel.height - gap),
        );
        setPlacement((old) =>
          old.left === panelLeft && old.top === panelTop
            ? old
            : { left: panelLeft, top: panelTop, right: "auto", bottom: "auto" },
        );
      } else setPlacement((old) => (Object.keys(old).length ? {} : old));
      setRect((old) =>
        old && old.top === top && old.left === left && old.width === width && old.height === height
          ? old
          : { top, left, width, height },
      );
    };
    const locate = () => {
      const found = document.querySelector(step.target);
      if (!found && tries++ < 20) {
        timer = setTimeout(locate, 100);
        return;
      }
      if (found) {
        const panelTop =
          document.querySelector(".tour-panel")?.getBoundingClientRect().top ?? window.innerHeight;
        const targetHeight = found.getBoundingClientRect().height;
        const desiredTop =
          window.innerWidth < 768 ? Math.max(8, Math.min(88, panelTop - targetHeight - 24)) : 88;
        found.scrollIntoView?.({ block: "start", behavior: "instant" });
        window.scrollBy(0, -desiredTop);
      }
      measure();
    };
    const update = () => {
      window.cancelAnimationFrame?.(frame);
      frame = window.requestAnimationFrame?.(measure) ?? 0;
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    timer = setTimeout(locate, 160);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", locate);
    window.addEventListener("keydown", handleEscape);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    observer?.observe(document.body);
    return () => {
      clearTimeout(timer);
      window.cancelAnimationFrame?.(frame);
      observer?.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", locate);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [phase, step, close]);

  if (phase !== "tour") return null;
  return createPortal(
    <TourPanel
      rect={rect}
      placement={placement}
      heading={heading}
      index={index}
      setIndex={setIndex}
      close={close}
    />,
    document.body,
  );
}
