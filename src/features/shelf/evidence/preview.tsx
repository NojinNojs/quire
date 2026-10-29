import { createRoot } from "react-dom/client";
import "../../../styles/fonts.css";
import "../../../styles/tokens.css";
import "../../../styles/themes.css";
import "../../../styles/app.css";
import { shelfBooks } from "../fixtures";
import { ShelfScreen } from "../ShelfScreen";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <ShelfScreen
      books={shelfBooks}
      onAddBook={() => window.alert("Add book callback")}
      onSelectBook={(book) => window.alert(`Selected edition: ${book.title}`)}
    />,
  );
}
