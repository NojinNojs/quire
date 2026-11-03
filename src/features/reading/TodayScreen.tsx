import "../../styles/reading.css";
import "../../styles/reading-presets.css";
import { ActiveReadingPanel } from "./ActiveReadingPanel";
import type { LogSnapshot } from "./pageLogStore";

export { ActiveBookCard, PageStepper, StreakBlock } from "./ReadingParts";

export type ReadingBook = {
  id: string;
  title: string;
  author: string | null;
  editionLine: string;
  coverUrl: string | null;
  total: number | null;
  ddc?: string | null;
};
export type ReadingStreak = {
  current: number;
  longest: number;
  days: readonly { day: string; read: boolean; restored?: boolean }[];
};
export type TodayScreenProps = {
  book: ReadingBook | null;
  streak: ReadingStreak;
  pageLog: LogSnapshot & { log: (pages: number) => void; undo: () => void; retry: () => unknown };
  loadingDay?: boolean;
  onCatalogue: () => void;
};
export function TodayScreen(props: TodayScreenProps) {
  return <ActiveReadingPanel {...props} />;
}
