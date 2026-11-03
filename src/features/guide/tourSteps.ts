export const steps = [
  {
    route: "/shelf",
    target: ".shelf-filters",
    title: "Find your next read.",
    body: "Your shelf groups books by subject. Filter by reading status or language, or search for a title. Open a book to keep notes and a rating.",
    label: "Explore your shelf",
  },
  {
    route: "/today",
    target: ".reading-book, .reading-empty",
    title: "One book. A place to begin.",
    body: "Today keeps your current book close. Pick a book from your shelf whenever you want to start something else.",
    label: "Your current read",
  },
  {
    route: "/today",
    target: ".reading-stepper, .reading-empty",
    title: "Make every page count.",
    body: "Enter the pages you have read, then log them. The preview shows where you will land, and Undo gives you a moment to change your mind.",
    label: "Log your reading",
  },
  {
    route: "/search",
    target: ".entry-tabs",
    title: "Give your books a home.",
    body: "Find a book in the catalogue, or enter it manually. A title is enough to get started; you can leave unknown details blank.",
    label: "Add a book",
  },
  {
    route: "/settings",
    target: ".profile-form",
    title: "Your account.",
    body: "Save your reader name and yearly goal here. Account settings also let you change your password or sign out. Open Guide whenever you need it.",
    label: "Account settings",
  },
] as const;
