import { createRoot } from "react-dom/client";
import "../../../styles/fonts.css";
import "../../../styles/tokens.css";
import "../../../styles/themes.css";
import "../../../styles/app.css";
import { TodayScreen } from "../TodayScreen";
import { usePageLog } from "../usePageLog";

function Preview() {
  const pageLog = usePageLog({
    bookId: "reading-evidence",
    current: 214,
    pagesToday: 14,
    day: "2026-10-29",
    client: {
      rpc: async () => {
        if (!navigator.onLine) throw new Error("Offline");
        return { data: [{ streak_current: 5, streak_longest: 12, restored: false }], error: null };
      },
    },
  });
  return (
    <TodayScreen
      book={{
        id: "reading-evidence",
        title: "This Earth of Mankind",
        author: "Pramoedya Ananta Toer",
        editionLine: "Penguin · 1996 · English",
        coverUrl: null,
        total: 550,
      }}
      streak={{
        current: 5,
        longest: 12,
        days: Array.from({ length: 7 }, (_, index) => ({
          day: `2026-10-${23 + index}`,
          read: index >= 2,
        })),
      }}
      pageLog={pageLog}
      onCatalogue={() => {
        window.location.hash = "catalogue";
      }}
    />
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<Preview />);
