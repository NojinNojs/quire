/** Formatting separators are accepted; other characters are rejected rather than silently removed. */
export function normaliseIsbn(value: string): string | null {
  if (!/^[0-9Xx\s-]+$/.test(value)) return null;
  const isbn = value.replace(/[\s-]/g, "").toUpperCase();
  if (/^\d{9}[\dX]$/.test(isbn)) {
    const sum = [...isbn].reduce(
      (total, digit, i) => total + (digit === "X" ? 10 : Number(digit)) * (10 - i),
      0,
    );
    return sum % 11 === 0 ? isbn : null;
  }
  if (/^97[89]\d{10}$/.test(isbn)) {
    const sum = [...isbn].reduce((total, digit, i) => total + Number(digit) * (i % 2 ? 3 : 1), 0);
    return sum % 10 === 0 ? isbn : null;
  }
  return null;
}

export function isbnTo13(value: string): string | null {
  const isbn = normaliseIsbn(value);
  if (!isbn || isbn.length === 13) return isbn;
  const stem = `978${isbn.slice(0, 9)}`;
  const sum = [...stem].reduce((total, digit, i) => total + Number(digit) * (i % 2 ? 3 : 1), 0);
  return `${stem}${(10 - (sum % 10)) % 10}`;
}
