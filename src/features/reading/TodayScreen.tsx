import "../../styles/reading.css";
import "../../styles/reading-presets.css";
import { ActiveReadingPanel } from "./ActiveReadingPanel";
import type { TodayScreenProps } from "./types";

export { ActiveBookCard } from "./BookIdentity";
export { PageStepper } from "./PageStepper";
export { StreakBlock } from "./StreakBlock";
export type { ReadingBook, ReadingStreak, TodayScreenProps } from "./types";

export function TodayScreen(props: TodayScreenProps) {
  return <ActiveReadingPanel {...props} />;
}
