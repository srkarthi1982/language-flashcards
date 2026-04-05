import { column, defineTable, NOW } from "astro:db";

export const VocabDecks = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    ownerId: column.text(),
    title: column.text({ optional: true, deprecated: true }),
    description: column.text({ optional: true, deprecated: true }),
    fromLanguage: column.text({ optional: true, deprecated: true }),
    toLanguage: column.text({ optional: true, deprecated: true }),
    level: column.text({ optional: true, deprecated: true }),
    tags: column.text({ optional: true, deprecated: true }),
    isActive: column.boolean({ optional: true, deprecated: true }),
    language: column.text({ optional: true }),
    deck: column.text({ optional: true }),
    topic: column.text({ optional: true }),
    frontText: column.text({ default: "" }),
    backText: column.text({ default: "" }),
    pronunciation: column.text({ optional: true }),
    exampleText: column.text({ optional: true }),
    notes: column.text({ optional: true }),
    isFavorite: column.boolean({ default: false }),
    status: column.text({ enum: ["active", "archived"], default: "active" }),
    archivedAt: column.date({ optional: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
  indexes: [
    { on: ["ownerId", "status"] },
    { on: ["ownerId", "language"] },
    { on: ["ownerId", "deck"] },
    { on: ["ownerId", "topic"] },
    { on: ["ownerId", "isFavorite"] },
    { on: ["ownerId", "updatedAt"] },
  ],
});

export const languageFlashcardsTables = {
  VocabDecks,
} as const;
