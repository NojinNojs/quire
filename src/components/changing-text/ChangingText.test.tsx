// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PageStepper } from "../../features/reading/PageStepper";
import { ChangingText } from "./ChangingText";

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

const valueNode = (container: HTMLElement) =>
  container.querySelector<HTMLElement>(".changing-text-value");
const ghosts = (container: HTMLElement) =>
  container.querySelectorAll<HTMLElement>(".changing-text-ghost");

describe("ChangingText", () => {
  it("paints the first value with no ghost and no inline motion", () => {
    const { container } = render(<ChangingText value={214} />);
    expect(valueNode(container)?.textContent).toBe("214");
    expect(ghosts(container)).toHaveLength(0);
    expect(valueNode(container)?.style.transform).toBe("");
  });

  it("keeps one accessible value and one aria-hidden ghost mid-swap", () => {
    const { container, rerender } = render(<ChangingText value="Page 12" />);
    rerender(<ChangingText value="Page 13" />);

    expect(valueNode(container)?.textContent).toBe("Page 13");
    expect(ghosts(container)).toHaveLength(1);
    expect(ghosts(container)[0]?.textContent).toBe("Page 12");
    expect(ghosts(container)[0]?.getAttribute("aria-hidden")).toBe("true");
  });

  it("masks only one-line numbers and leaves prose unclipped", () => {
    const { container, rerender } = render(<ChangingText value={10} />);
    expect(container.querySelector(".changing-text-number")).toBeTruthy();

    rerender(<ChangingText value="Bumi Manusia" />);
    expect(container.querySelector(".changing-text-number")).toBeNull();
    expect(container.querySelector(".changing-text")?.getAttribute("data-mode")).toBe("text");
  });

  it("keeps a single ghost through rapid changes and shows the latest value", () => {
    const { container, rerender } = render(<ChangingText value="1" />);
    rerender(<ChangingText value="2" />);
    rerender(<ChangingText value="3" />);
    rerender(<ChangingText value="4" />);

    expect(ghosts(container).length).toBeLessThanOrEqual(1);
    expect(valueNode(container)?.textContent).toBe("4");
    expect(container.querySelectorAll(".changing-text-value")).toHaveLength(1);
  });

  it("skips the swap under reduced motion and resets a running one live", () => {
    const { container, rerender } = render(<ChangingText value="Page 1" />);
    rerender(<ChangingText value="Page 2" />);
    expect(ghosts(container)).toHaveLength(1);

    setReduced(true);
    expect(ghosts(container)).toHaveLength(0);
    expect(valueNode(container)?.style.opacity).toBe("");
    expect(valueNode(container)?.style.transform).toBe("");

    rerender(<ChangingText value="Page 3" />);
    expect(ghosts(container)).toHaveLength(0);
    expect(valueNode(container)?.textContent).toBe("Page 3");
  });

  it("updates a consumer preview immediately and keeps focus on the control", () => {
    render(<PageStepper current={214} total={550} disabled={false} onLog={() => {}} />);
    const preset = screen.getByRole("button", { name: "10 pages" });
    preset.focus();
    fireEvent.click(preset);

    expect(document.activeElement).toBe(preset);
    expect(screen.getByText("214 → 224")).toBeTruthy();
  });
});
