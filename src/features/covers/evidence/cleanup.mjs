import { stopEvidenceServer } from "../../../../scripts/evidence-server.mjs";

export async function cleanupCoverEvidence({
  upload,
  browser,
  path,
  admin,
  users,
  server,
  runError,
}) {
  const results = [];
  const uploadResults = upload ? await upload : [];
  results.push(...uploadResults);
  if (browser)
    results.push(...(await Promise.allSettled([Promise.resolve().then(() => browser.close())])));
  // A failed upload barrier cannot prove the backend has stopped writing.
  const unknown = uploadResults.some((result) => result.status === "rejected");
  if (!unknown) {
    if (path)
      results.push(
        ...(await Promise.allSettled([
          Promise.resolve().then(async () => {
            const { error } = await admin.storage.from("covers").remove([path]);
            if (error) throw error;
          }),
        ])),
      );
    results.push(
      ...(await Promise.allSettled(
        users.map(async (id) => {
          const { error } = await admin.auth.admin.deleteUser(id);
          if (error) throw error;
        }),
      )),
    );
  }
  if (server)
    results.push(
      ...(await Promise.allSettled([Promise.resolve().then(() => stopEvidenceServer(server))])),
    );
  const failures = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason);
  if (failures.length)
    throw new AggregateError(
      runError ? [runError, ...failures] : failures,
      unknown
        ? `Cover upload completion unknown; retained users: ${users.join(", ")}; path: ${path}`
        : "Cover evidence cleanup failed",
    );
}
