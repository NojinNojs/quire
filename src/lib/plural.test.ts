import { describe, expect, it } from "vitest";
import { plural } from "./plural";

describe("plural", () => {
  it("keeps the singular for one", () => {
    expect(plural(1, "page")).toBe("1 page");
    expect(plural(1, "day")).toBe("1 day");
  });

  it("pluralises everything else, including zero", () => {
    expect(plural(0, "page")).toBe("0 pages");
    expect(plural(2, "day")).toBe("2 days");
  });

  it("accepts an irregular plural", () => {
    expect(plural(3, "copy", "copies")).toBe("3 copies");
  });
});
