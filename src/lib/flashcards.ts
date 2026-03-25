import { LanguageFlashcards, and, db, desc, eq } from "astro:db";

export async function listLanguageFlashcardsForUser(userId: string) {
  return db
    .select()
    .from(LanguageFlashcards)
    .where(eq(LanguageFlashcards.userId, userId))
    .orderBy(desc(LanguageFlashcards.updatedAt));
}

export async function getLanguageFlashcardDetailForUser(id: number, userId: string) {
  const [flashcard] = await db
    .select()
    .from(LanguageFlashcards)
    .where(and(eq(LanguageFlashcards.id, id), eq(LanguageFlashcards.userId, userId)));

  return flashcard ?? null;
}

export function getLanguageFlashcardSummary(items: Array<{
  status: "active" | "archived";
  isFavorite: boolean;
  language: string | null;
  deck: string | null;
  frontText: string;
  updatedAt: Date;
}>) {
  const active = items.filter((item) => item.status === "active");
  const archived = items.filter((item) => item.status === "archived");
  const favorites = items.filter((item) => item.isFavorite);
  const languageCount = new Set(items.map((item) => item.language).filter(Boolean)).size;
  const deckCount = new Set(items.map((item) => item.deck).filter(Boolean)).size;

  return {
    total: items.length,
    active: active.length,
    archived: archived.length,
    favorites: favorites.length,
    languageCount,
    deckCount,
    mostRecent: items[0]
      ? {
          frontText: items[0].frontText,
          updatedAt: items[0].updatedAt,
        }
      : null,
  };
}
