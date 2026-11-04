/** Move focus to the route content after a palette selection. */
export function focusMainContent() {
  const screen = document.getElementById("main-content");
  if (!screen) return;
  const main = screen.querySelector<HTMLElement>("main") ?? screen;
  main.tabIndex = -1;
  main.focus();
}
