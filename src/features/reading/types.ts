import type { LogSnapshot } from "./pageLogStore";

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
