import type { CSSProperties, RefObject } from "react";
import { steps } from "./tourSteps";

type Rect = { top: number; left: number; width: number; height: number };

export function TourPanel({
  rect,
  placement,
  heading,
  index,
  setIndex,
  close,
}: {
  rect: Rect | null;
  placement: CSSProperties;
  heading: RefObject<HTMLHeadingElement | null>;
  index: number;
  setIndex: (index: number) => void;
  close: (completed?: boolean) => void;
}) {
  const step = steps[index] ?? steps[0];
  return (
    <div className="product-tour">
      <div className="tour-backdrop" aria-hidden="true">
        {rect && rect.height > 0 && (
          <>
            <div
              className="tour-shade"
              style={{ top: 0, left: 0, width: "100%", height: rect.top }}
            />
            <div
              className="tour-shade"
              style={{ top: rect.top + rect.height, bottom: 0, left: 0, width: "100%" }}
            />
            <div
              className="tour-shade"
              style={{ top: rect.top, left: 0, width: rect.left, height: rect.height }}
            />
            <div
              className="tour-shade"
              style={{ top: rect.top, left: rect.left + rect.width, right: 0, height: rect.height }}
            />
            <div className="tour-spotlight" style={rect} />
          </>
        )}
      </div>
      <section
        className="tour-panel"
        style={placement}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-title"
        aria-describedby="tour-description"
      >
        <div className="tour-panel-top">
          <span>
            Guide · {index + 1} of {steps.length}
          </span>
          <button className="guide-quiet" type="button" onClick={() => close()}>
            Skip tour
          </button>
        </div>
        <h2 id="tour-title" ref={heading} tabIndex={-1}>
          {step.title}
        </h2>
        <p id="tour-description">{step.body}</p>
        <ol className="tour-progress" aria-label="Tour steps">
          {steps.map((item, number) => (
            <li key={item.route + item.label}>
              <button
                type="button"
                aria-label={item.label}
                aria-current={number === index ? "step" : undefined}
                onClick={() => setIndex(number)}
              >
                <span />
              </button>
            </li>
          ))}
        </ol>
        <div className="tour-panel-bottom">
          <button
            className="guide-quiet"
            type="button"
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
          >
            Back
          </button>
          <button
            className="guide-primary"
            type="button"
            onClick={() => (index === steps.length - 1 ? close(true) : setIndex(index + 1))}
          >
            {index === steps.length - 1 ? "Finish tour" : "Next"}
          </button>
        </div>
      </section>
    </div>
  );
}
