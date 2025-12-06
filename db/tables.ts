import { column, defineTable, NOW } from "astro:db";

/**
 * A vocabulary deck for a language pair.
 * Example: "EN → DE Travel", "JLPT N5 Verbs".
 */
export const VocabDecks = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    // Owner from parent Users.id
    ownerId: column.text(),

    title: column.text(),
    description: column.text({ optional: true }),

    // Language codes (ISO-ish) for better filtering
    fromLanguage: column.text({ default: "en" }), // source language
    toLanguage: column.text({ default: "en" }),   // target language

    level: column.text({
      enum: ["A1", "A2", "B1", "B2", "C1", "C2", "mixed"],
      default: "mixed",
    }),

    tags: column.text({ optional: true }),

    isActive: column.boolean({ default: true }),

    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

/**
 * Individual vocabulary cards.
 */
export const VocabCards = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    deckId: column.number({ references: () => VocabDecks.columns.id }),

    // Order in the deck
    displayOrder: column.number({ default: 0 }),

    // Core content
    term: column.text(),           // e.g., "book"
    translation: column.text(),    // e.g., "Buch"
    transliteration: column.text({ optional: true }), // e.g., for Japanese/Arabic

    partOfSpeech: column.text({ optional: true }), // "noun", "verb", etc.

    // Optional extra data
    gender: column.text({ optional: true }), // for languages with grammatical gender
    exampleSentence: column.text({ optional: true }),
    exampleTranslation: column.text({ optional: true }),

    // Pronunciation / audio
    phonetic: column.text({ optional: true }),
    audioUrl: column.text({ optional: true }),

    tags: column.text({ optional: true }),

    isActive: column.boolean({ default: true }),
  },
});

/**
 * A dedicated study session for a deck.
 */
export const VocabStudySessions = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    deckId: column.number({ references: () => VocabDecks.columns.id }),
    userId: column.text({ optional: true }),

    startedAt: column.date({ default: NOW }),
    completedAt: column.date({ optional: true }),

    totalCardsSeen: column.number({ default: 0 }),
    correctCount: column.number({ default: 0 }),
    wrongCount: column.number({ default: 0 }),

    summary: column.json({ optional: true }),

    createdAt: column.date({ default: NOW }),
  },
});

/**
 * Spaced repetition review log for each card.
 */
export const VocabReviews = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    deckId: column.number({ references: () => VocabDecks.columns.id }),
    cardId: column.number({ references: () => VocabCards.columns.id }),

    userId: column.text({ optional: true }),

    sessionId: column.number({
      references: () => VocabStudySessions.columns.id,
      optional: true,
    }),

    // Rating after seeing the card (SM-2 style)
    rating: column.text({
      enum: ["again", "hard", "good", "easy"],
      default: "good",
    }),

    reviewedAt: column.date({ default: NOW }),
    dueAt: column.date({ optional: true }),
    intervalDays: column.number({ default: 0 }),

    easeFactor: column.number({ optional: true }),
  },
});

export const languageFlashcardsTables = {
  VocabDecks,
  VocabCards,
  VocabStudySessions,
  VocabReviews,
} as const;
