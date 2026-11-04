function parse(day: string) {
  const date = new Date(`${day}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDay(day: string) {
  const date = parse(day);
  if (!date) return day;
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatActivityDay(day: string) {
  const date = parse(day);
  if (!date) return day;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
