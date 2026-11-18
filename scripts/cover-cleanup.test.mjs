import { expect, test } from "vitest";
import { cleanupCoverEvidence } from "../src/features/covers/evidence/cleanup.mjs";

function resources(failingUser) {
  const files = new Set();
  const users = new Set(["generated-a", "generated-b", "existing-user"]);
  const state = { closed: false };
  const options = {
    path: "generated-a/book/cover.webp",
    users: ["generated-a", "generated-b"],
    browser: {
      async close() {
        state.closed = true;
      },
    },
    admin: {
      storage: {
        from() {
          return {
            async remove(paths) {
              for (const path of paths) files.delete(path);
              return { error: null };
            },
          };
        },
      },
      auth: {
        admin: {
          async deleteUser(id) {
            if (id === failingUser) return { error: new Error("delete rejected") };
            users.delete(id);
            return { error: null };
          },
        },
      },
    },
  };
  return { files, users, state, options };
}

test("a late upload cannot recreate an object after failed capture cleanup", async () => {
  const { files, users, state, options } = resources();
  let finishUpload;
  const upload = Promise.allSettled([
    new Promise((resolve) => {
      finishUpload = () => {
        files.add(options.path);
        resolve();
      };
    }),
  ]);
  const captureError = new Error("later capture failure");
  const capture = async () => {
    try {
      throw captureError;
    } finally {
      await cleanupCoverEvidence({ ...options, upload, runError: captureError });
    }
  };
  const result = expect(capture()).rejects.toThrow("later capture failure");
  await Promise.resolve();
  expect(state.closed).toBe(false);
  expect(users.has("generated-a")).toBe(true);
  finishUpload();
  await result;
  expect(state.closed).toBe(true);
  expect(files.size).toBe(0);
  expect([...users]).toEqual(["existing-user"]);
});

test("unknown upload completion retains identified resources instead of racing deletion", async () => {
  const { files, users, state, options } = resources();
  const uploadError = new Error("upload completion unknown");
  files.add(options.path);
  const upload = Promise.allSettled([Promise.reject(uploadError)]);
  let failure;
  try {
    await cleanupCoverEvidence({ ...options, upload });
  } catch (error) {
    failure = error;
  }
  expect(failure).toBeInstanceOf(AggregateError);
  expect(failure.errors).toContain(uploadError);
  expect(state.closed).toBe(true);
  expect(files.has(options.path)).toBe(true);
  expect([...users]).toEqual(["generated-a", "generated-b", "existing-user"]);
});

test("one deletion failure does not prevent cleanup of the other generated account", async () => {
  const { files, users, state, options } = resources("generated-a");
  files.add(options.path);
  await expect(cleanupCoverEvidence(options)).rejects.toThrow(AggregateError);
  expect(state.closed).toBe(true);
  expect(files.size).toBe(0);
  expect([...users]).toEqual(["generated-a", "existing-user"]);
});
