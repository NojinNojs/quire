import gsap from "gsap";
import { useRef } from "react";
import { useMotionEffect, useReducedMotion } from "../../lib/motion";
import "./changing-text.css";

const NUMERIC = /^-?\d[\d.,]*\s*%?$/;

function numericValue(value: string) {
  if (!NUMERIC.test(value.trim())) return null;
  const parsed = Number(value.replace(/[%,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function ChangingText({ value }: { value: string | number }) {
  const node = useRef<HTMLSpanElement>(null);
  const shown = useRef<string | null>(null);
  const reduced = useReducedMotion();
  const text = String(value);
  const count = numericValue(text);
  const mode = count === null ? "text" : "number";

  useMotionEffect(() => {
    const wrapper = node.current;
    const current = wrapper?.querySelector<HTMLElement>(".changing-text-value");
    if (!wrapper || !current) return;
    const previous = shown.current;
    shown.current = text;
    if (previous === null || previous === text || reduced) return;

    const before = numericValue(previous);
    const rise = count === null || before === null || count >= before ? 1 : -1;
    const rolling = mode === "number";
    const offset = rolling ? { yPercent: rise * 100, opacity: 0 } : { y: rise * 4, opacity: 0 };
    const settled = rolling ? { yPercent: 0, opacity: 1 } : { y: 0, opacity: 1 };
    const exit = rolling ? { yPercent: -rise * 100, opacity: 0 } : { y: -rise * 4, opacity: 0 };
    const ghost = document.createElement("span");
    ghost.className = "changing-text-ghost";
    ghost.setAttribute("aria-hidden", "true");
    ghost.textContent = previous;
    wrapper.append(ghost);

    const context = gsap.context(() => {
      gsap.set(current, offset);
      gsap
        .timeline({ defaults: { duration: 0.4, ease: "power2.out" } })
        .to(current, settled, 0)
        .to(ghost, { ...exit, onComplete: () => ghost.remove() }, 0);
    }, wrapper);

    return () => {
      context.revert();
      ghost.remove();
    };
  }, [text, count, mode, reduced]);

  return (
    <span ref={node} className={`changing-text changing-text-${mode}`} data-mode={mode}>
      <span className="changing-text-value">{value}</span>
    </span>
  );
}
