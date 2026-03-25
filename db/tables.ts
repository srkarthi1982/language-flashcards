import { column, defineTable, NOW } from "astro:db";

export const LanguageFlashcards = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    userId: column.text(),
    language: column.text({ optional: true }),
    deck: column.text({ optional: true }),
    topic: column.text({ optional: true }),
    frontText: column.text(),
    backText: column.text(),
    pronunciation: column.text({ optional: true }),
    exampleText: column.text({ optional: true }),
    notes: column.text({ optional: true }),
    isFavorite: column.boolean({ default: false }),
    status: column.text({ enum: ["active", "archived"], default: "active" }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
    archivedAt: column.date({ optional: true }),
  },
  indexes: [
    { on: ["userId", "status"] },
    { on: ["userId", "language"] },
    { on: ["userId", "deck"] },
    { on: ["userId", "topic"] },
    { on: ["userId", "isFavorite"] },
    { on: ["userId", "updatedAt"] },
  ],
});

export const languageFlashcardsTables = {
  LanguageFlashcards,
} as const;
