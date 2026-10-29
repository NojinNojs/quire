import { describe, expect, it } from "vitest";
import { isbnTo13, normaliseIsbn } from "./isbn";

describe("ISBN", () => {
  it("validates ISBN-10 including an X check digit", () => {
    expect(normaliseIsbn("0-8044-2957-x")).toBe("080442957X");
    expect(normaliseIsbn("0 14 025635 0")).toBe("0140256350");
  });
  it("validates ISBN-13", () => expect(normaliseIsbn("978-0-14-025635-2")).toBe("9780140256352"));
  it("rejects bad digits, misplaced X, lengths, prefixes and other characters", () => {
    for (const value of [
      "0140256351",
      "9780140256353",
      "X804429570",
      "123",
      "9780140256352!",
      "ISBN 0140256350",
      "1234567890128",
    ]) {
      expect(normaliseIsbn(value)).toBeNull();
      expect(isbnTo13(value)).toBeNull();
    }
  });
  it("converts ISBN-10 to ISBN-13", () => {
    expect(isbnTo13("0140256350")).toBe("9780140256352");
    expect(isbnTo13("080442957X")).toBe("9780804429573");
    expect(isbnTo13("9780140256352")).toBe("9780140256352");
  });
});
