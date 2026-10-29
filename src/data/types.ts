export type EditionInput = {
  owner: string;
  title: string;
  author: string | null;
  publisher: string | null;
  year: number | null;
  pages: number | null;
  isbn: string | null;
  language: string | null;
  coverUrl: string | null;
};

export type Book = {
  id: string;
  owner: string;
  work_id: string | null;
  title: string;
  author: string | null;
  publisher: string | null;
  city: string | null;
  year: number | null;
  edition: string | null;
  pages: number | null;
  isbn: string | null;
  ddc: string | null;
  language: string | null;
  cover_url: string | null;
  cover_path: string | null;
  status: "want" | "reading" | "finished" | "wishlist";
  rating: number | null;
  notes: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};
