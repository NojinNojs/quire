import { describe, expect, it } from "vitest";
import { classify, groupByClass } from "./ddc";

describe("classify", () => {
  it("reads a full DDC number", () => {
    expect(classify("899.2213")?.code).toBe("800");
    expect(classify("899.2213")?.label).toBe("Literature");
  });

  it("reads a call number with a cutter", () => {
    expect(classify("899.2213 T64 1980")?.code).toBe("800");
  });

  it("returns null for missing or unreadable numbers", () => {
    expect(classify(null)).toBeNull();
    expect(classify("")).toBeNull();
    expect(classify("not a number")).toBeNull();
  });
});

describe("groupByClass", () => {
  it("groups books under human readable class keys and keeps order", () => {
    const groups = groupByClass([
      { ddc: "899.2213", title: "Bumi Manusia" },
      { ddc: "959.8", title: "Sejarah Indonesia Modern" },
      { ddc: "101", title: "Filsafat Terapan" },
      { ddc: null, title: "Korupsi" },
    ]);
    expect([...groups.keys()]).toEqual([
      "800 Literature",
      "900 History",
      "100 Philosophy",
      "Unclassified",
    ]);
    expect(groups.get("800 Literature")?.[0]?.title).toBe("Bumi Manusia");
  });
});
