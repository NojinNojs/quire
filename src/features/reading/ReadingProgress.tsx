import gsap from "gsap";
import { useRef } from "react";
import { useMotionEffect, useReducedMotion } from "../../lib/motion";
import "./reading-progress.css";

export function ReadingProgress({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const fill = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const width = `${max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0}%`;
  const initialWidth = useRef(width);

  useMotionEffect(() => {
    const element = fill.current;
    if (!element) return;
    if (element.style.width === width) return;
    if (reduced) {
      gsap.set(element, { width });
      return;
    }
    const tween = gsap.to(element, { width, duration: 0.45, ease: "power3.out" });
    return () => {
      tween.kill();
    };
  }, [width, reduced]);

  return (
    <span className="reading-progress-track">
      <progress className="reading-progress-native" value={value} max={max} aria-label={label} />
      <span
        ref={fill}
        className="reading-progress-fill"
        style={{ width: initialWidth.current }}
        aria-hidden="true"
      />
    </span>
  );
}
