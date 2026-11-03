import { expect, it } from "vitest";
import { readPendingLog } from "./pendingLog";

it("accepts only matching positive integer logs with valid calendar dates", () => {
  const read = (value: unknown) => readPendingLog({ getItem: () => JSON.stringify(value) }, "book");
  const valid = { bookId: "book", pages: 10, day: "2024-02-29" };
  expect(read(valid)).toEqual(valid);
  expect(read({ ...valid, bookId: "other" })).toBeNull();
  expect(read({ ...valid, pages: 2_147_483_648 })).toBeNull();
  expect(read({ ...valid, pages: 0.5 })).toBeNull();
  expect(read({ ...valid, day: "2025-02-29" })).toBeNull();
  expect(readPendingLog({ getItem: () => "{" }, "book")).toBeNull();
  expect(
    readPendingLog(
      {
        getItem: () => {
          throw new Error("denied");
        },
      },
      "book",
    ),
  ).toBeNull();
});
