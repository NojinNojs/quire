const covers = [
  ["The Waves", "Virginia Woolf", "waves"],
  ["A Room of One's Own", "Virginia Woolf", "room"],
  ["Meditations", "Marcus Aurelius", "meditations"],
  ["The Histories", "Herodotus", "histories"],
  ["Bumi Manusia", "Pramoedya Ananta Toer", "bumi"],
  ["Laut Bercerita", "Leila S. Chudori", "laut"],
  ["Pride and Prejudice", "Jane Austen", "pride"],
  ["Walden", "Henry David Thoreau", "walden"],
  ["On the Origin of Species", "Charles Darwin", "origin"],
] as const;

export function sampleCover(title: string, author: string | null) {
  const normalize = (value: string) => value.trim().toLocaleLowerCase();
  const cover = covers.find(
    ([name, writer]) =>
      normalize(name) === normalize(title) && normalize(writer) === normalize(author ?? ""),
  );
  return cover ? `/covers/${cover[2]}.webp` : null;
}
