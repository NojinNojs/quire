// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import gsap from "gsap";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ReadingProgress } from "./ReadingProgress";
import { usePanelReveal } from "./usePanelReveal";

type Listener = (event: MediaQueryListEvent) => void;

let reduced = false;
let listeners: Listener[] = [];

beforeEach(() => {
  reduced = false;
  listeners = [];
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) =>
      ({
        get matches() {
          return reduced;
        },
        media: query,
        onchange: null,
        addEventListener: (_: string, listener: Listener) => listeners.push(listener),
        removeEventListener: (_: string, listener: Listener) => {
          listeners = listeners.filter((item) => item !== listener);
        },
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  });
});

afterEach(cleanup);

function setReduced(value: boolean) {
  reduced = value;
  act(() => {
    for (const listener of listeners) listener({} as MediaQueryListEvent);
  });
}

const scaleOf = (container: HTMLElement) =>
  Number(gsap.getProperty(container.querySelector(".reading-progress-fill"), "scaleX"));

function Panels() {
  const scope = usePanelReveal<HTMLDivElement>();
  return (
    <div ref={scope}>
      <header>Greeting</header>
      <article className="reading-book">Book</article>
      <section className="reading-year">Year</section>
    </div>
  );
}

describe("usePanelReveal", () => {
  it("starts tiles below and cleared of opacity instead of animating from identity", () => {
    const { container } = render(<Panels />);
    const book = container.querySelector(".reading-book");
    expect(Number(gsap.getProperty(book, "opacity"))).toBeLessThan(1);
    expect(Number(gsap.getProperty(book, "y"))).toBeGreaterThan(0);
  });

  it("lands an offscreen tile on its visible state when it scrolls in", async () => {
    const observers: { callback: IntersectionObserverCallback }[] = [];
    class FakeObserver {
      callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        observers.push(this);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    const rect = Element.prototype.getBoundingClientRect;
    const innerHeight = window.innerHeight;
    Reflect.set(globalThis, "IntersectionObserver", FakeObserver);
    Object.defineProperty(window, "innerHeight", { value: 100, configurable: true });
    Element.prototype.getBoundingClientRect = () =>
      ({ top: 500, bottom: 600, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0 }) as DOMRect;

    try {
      const { container } = render(<Panels />);
      const book = container.querySelector(".reading-book") as HTMLElement;
      expect(Number(gsap.getProperty(book, "opacity"))).toBe(1);

      act(() => {
        observers[0]?.callback(
          [{ isIntersecting: true, target: book } as unknown as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );
      });
      expect(Number(gsap.getProperty(book, "opacity"))).toBe(0);

      await act(() => new Promise((resolve) => setTimeout(resolve, 600)));
      expect(Number(gsap.getProperty(book, "opacity"))).toBeCloseTo(1, 2);
      expect(book.style.opacity).toBe("");
    } finally {
      Element.prototype.getBoundingClientRect = rect;
      Reflect.set(globalThis, "IntersectionObserver", undefined);
      Object.defineProperty(window, "innerHeight", { value: innerHeight, configurable: true });
    }
  });
});

describe("ReadingProgress", () => {
  it("keeps the native progress value and name while the fill is decorative", () => {
    const { container } = render(
      <ReadingProgress value={58} max={550} label="Reading progress: 58 of 550 pages" />,
    );
    const bar = screen.getByRole("progressbar", {
      name: "Reading progress: 58 of 550 pages",
    });
    expect(bar.getAttribute("value")).toBe("58");
    expect(bar.getAttribute("max")).toBe("550");
    expect(container.querySelector(".reading-progress-fill")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(scaleOf(container)).toBeCloseTo(58 / 550, 4);
  });

  it("reports the new value at once and snaps the fill forward when motion is reduced", () => {
    const { container, rerender } = render(
      <ReadingProgress value={58} max={550} label="Reading progress" />,
    );
    rerender(<ReadingProgress value={275} max={550} label="Reading progress" />);

    expect(screen.getByRole("progressbar").getAttribute("value")).toBe("275");
    setReduced(true);
    expect(scaleOf(container)).toBeCloseTo(0.5, 4);
  });

  it("jumps straight to the value when the reader already prefers reduced motion", () => {
    reduced = true;
    const { container, rerender } = render(
      <ReadingProgress value={0} max={550} label="Reading progress" />,
    );
    rerender(<ReadingProgress value={550} max={550} label="Reading progress" />);

    expect(screen.getByRole("progressbar").getAttribute("value")).toBe("550");
    expect(scaleOf(container)).toBeCloseTo(1, 4);
  });
});
