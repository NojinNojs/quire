import gsap from "gsap";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "../../lib/motion";
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
  const started = useRef(false);
  const reduced = useReducedMotion();
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;

  useEffect(() => {
    const element = fill.current;
    if (!element) return;
    if (!started.current) {
      started.current = true;
      gsap.set(element, { scaleX: ratio });
      return;
    }
    const from = Number(gsap.getProperty(element, "scaleX")) || 0;
    if (reduced || from === ratio) {
      gsap.set(element, { scaleX: ratio });
      return;
    }
    const tween = gsap.fromTo(
      element,
      { scaleX: from },
      { scaleX: ratio, duration: 0.5, ease: "power2.out" },
    );
    // Cleanup lands on this render's target, so a preference change mid-tween
    // snaps forward instead of rewinding to the previous value.
    return () => {
      tween.kill();
      gsap.set(element, { scaleX: ratio });
    };
  }, [ratio, reduced]);

  return (
    <span className="reading-progress-track">
      <progress className="reading-progress-native" value={value} max={max} aria-label={label} />
      <span ref={fill} className="reading-progress-fill" aria-hidden="true" />
    </span>
  );
}
