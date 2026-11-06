import gsap from "gsap";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "../../lib/motion";

const TILES = ".reading-book, .reading-console, .reading-streak, .reading-year, .reading-activity";
const HIDDEN = { y: 16, scale: 0.985, opacity: 0 };
const VISIBLE = { y: 0, scale: 1, opacity: 1 };
const ENTER = { duration: 0.5, ease: "power2.out", clearProps: "transform,opacity" };

export function usePanelReveal<T extends HTMLElement>() {
  const scope = useRef<T>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = scope.current;
    if (!root || reduced) return;
    const header = root.querySelector<HTMLElement>(":scope > header");
    const tiles = [...root.querySelectorAll<HTMLElement>(TILES)];
    const below = new Set(
      tiles.filter((tile) => tile.getBoundingClientRect().top >= window.innerHeight),
    );
    const above = tiles.filter((tile) => !below.has(tile));
    let disconnect: (() => void) | undefined;

    const context = gsap.context(() => {
      gsap.from([...(header ? [header] : []), ...above], {
        ...HIDDEN,
        ...ENTER,
        stagger: 0.07,
      });
      if (below.size === 0) return;
      if (typeof IntersectionObserver !== "function") {
        gsap.from([...below], { ...HIDDEN, ...ENTER });
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            observer.unobserve(entry.target);
            context.add(() => gsap.fromTo(entry.target, HIDDEN, { ...VISIBLE, ...ENTER }));
          }
        },
        { threshold: 0.2 },
      );
      for (const tile of below) observer.observe(tile);
      disconnect = () => observer.disconnect();
    }, root);

    return () => {
      disconnect?.();
      context.revert();
    };
  }, [reduced]);

  return scope;
}
