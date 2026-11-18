import gsap from "gsap";
import { useRef } from "react";
import { useMotionEffect, useReducedMotion } from "../../lib/motion";
import "../../styles/reading-complete.css";

const COLORS = ["var(--accent)", "var(--rule)", "var(--class-800)", "#c87954"];

export function useCompletionStamp(complete: boolean) {
  const stamp = useRef<HTMLSpanElement>(null);
  const wasComplete = useRef(complete);
  const reduced = useReducedMotion();

  useMotionEffect(() => {
    const entered = complete && !wasComplete.current;
    wasComplete.current = complete;
    if (!entered || reduced || !stamp.current) return;

    const target = stamp.current;
    const { left, right } = target.getBoundingClientRect();
    const spreadLeft = Math.min(100, Math.max(0, (left - 20) / 1.25));
    const spreadRight = Math.min(120, Math.max(0, (window.innerWidth - right - 20) / 1.25));
    const layer = document.createElement("span");
    layer.className = "completion-confetti";
    layer.setAttribute("aria-hidden", "true");
    target.append(layer);
    const pieces = COLORS.flatMap((color, lane) =>
      Array.from({ length: 6 }, (_, index) => {
        const piece = document.createElement("i");
        piece.className =
          index === 0 ? "completion-confetti-piece is-bookmark" : "completion-confetti-piece";
        piece.style.setProperty("--confetti-color", color);
        piece.style.setProperty("--confetti-size", `${6 + ((index + lane) % 3)}px`);
        layer.append(piece);
        return piece;
      }),
    );
    const timeline = gsap.timeline({ onComplete: () => layer.remove() });
    timeline
      .fromTo(
        target,
        { scale: 0.52, rotation: -18 },
        { scale: 1.14, rotation: 7, duration: 0.26, ease: "back.out(2.4)" },
      )
      .to(target, {
        scale: 1,
        rotation: 0,
        duration: 0.45,
        ease: "elastic.out(1, 0.48)",
        clearProps: "transform",
      })
      .to(
        pieces,
        {
          x: (index: number) =>
            gsap.utils.mapRange(0, pieces.length - 1, -spreadLeft, spreadRight, index),
          y: () => gsap.utils.random(-112, -38),
          rotation: () => gsap.utils.random(-155, 155),
          duration: 0.36,
          stagger: { each: 0.006, from: "center" },
          ease: "power2.out",
        },
        0.05,
      )
      .to(
        pieces,
        {
          y: "+=74",
          rotation: () => gsap.utils.random(-260, 260),
          opacity: 0,
          duration: 0.72,
          stagger: { each: 0.009, from: "random" },
          ease: "power1.in",
        },
        0.48,
      );
    return () => {
      timeline.kill();
      gsap.set(target, { clearProps: "transform" });
      layer.remove();
    };
  }, [complete, reduced]);

  return stamp;
}
