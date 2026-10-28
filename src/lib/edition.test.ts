import { describe, expect, it } from "vitest";
import { clothFor, editionKey } from "./edition";

const cet1980 = { isbn: null, title: "Bumi Manusia", publisher: "Hasta Mitra", year: 1980 };
const penguin = { isbn: "9780140126938", title: "Bumi Manusia", publisher: "Penguin", year: 1990 };
const seabad = {
  isbn: "9786231066329",
  title: "Bumi Manusia",
  publisher: "Lentera Dipantara",
  year: 2025,
};

describe("editionKey", () => {
  it("uses the ISBN when there is one", () => {
    expect(editionKey(penguin)).toBe("isbn:9780140126938");
  });

  it("falls back to title, publisher and year for pre-ISBN printings", () => {
    expect(editionKey(cet1980)).toBe("print:bumimanusia:hastamitra:1980");
  });

  it("never merges editions of one title", () => {
    const keys = new Set([editionKey(cet1980), editionKey(penguin), editionKey(seabad)]);
    expect(keys.size).toBe(3);
  });

  it("is stable across calls", () => {
    expect(editionKey(cet1980)).toBe(editionKey({ ...cet1980 }));
  });
});

describe("clothFor", () => {
  it("gives each edition its own colour", () => {
    const cloths = new Set([
      clothFor(editionKey(cet1980)),
      clothFor(editionKey(penguin)),
      clothFor(editionKey(seabad)),
    ]);
    expect(cloths.size).toBeGreaterThan(1);
  });

  it("is deterministic", () => {
    expect(clothFor("isbn:9780140126938")).toBe(clothFor("isbn:9780140126938"));
  });
});
