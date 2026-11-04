import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
});
const { window: jsdomWindow } = dom;

Object.defineProperties(globalThis, {
  window: { value: jsdomWindow, configurable: true },
  document: { value: jsdomWindow.document, configurable: true },
  navigator: { value: jsdomWindow.navigator, configurable: true },
  HTMLElement: { value: jsdomWindow.HTMLElement, configurable: true },
  Element: { value: jsdomWindow.Element, configurable: true },
  Node: { value: jsdomWindow.Node, configurable: true },
  Event: { value: jsdomWindow.Event, configurable: true },
  CustomEvent: { value: jsdomWindow.CustomEvent, configurable: true },
  KeyboardEvent: { value: jsdomWindow.KeyboardEvent, configurable: true },
  MouseEvent: { value: jsdomWindow.MouseEvent, configurable: true },
  MutationObserver: { value: jsdomWindow.MutationObserver, configurable: true },
  getComputedStyle: { value: jsdomWindow.getComputedStyle.bind(jsdomWindow), configurable: true },
  IS_REACT_ACT_ENVIRONMENT: { value: true, writable: true, configurable: true },
});

// Floating UI and Base UI read layout and motion APIs jsdom does not implement.
Object.defineProperties(globalThis, {
  requestAnimationFrame: {
    value: (callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 0),
    writable: true,
    configurable: true,
  },
  cancelAnimationFrame: {
    value: (handle: number) => clearTimeout(handle),
    writable: true,
    configurable: true,
  },
});

if (typeof jsdomWindow.Element.prototype.getAnimations !== "function") {
  Object.defineProperty(jsdomWindow.Element.prototype, "getAnimations", {
    value: () => [],
    configurable: true,
  });
}

if (typeof jsdomWindow.matchMedia !== "function") {
  Object.defineProperty(jsdomWindow, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

if (typeof globalThis.ResizeObserver !== "function") {
  class NoopResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(globalThis, "ResizeObserver", {
    value: NoopResizeObserver,
    configurable: true,
  });
}
