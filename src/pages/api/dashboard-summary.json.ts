import type { APIRoute } from "astro";
import { listLanguageFlashcardsForUser, getLanguageFlashcardSummary } from "../../lib/flashcards";

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const items = await listLanguageFlashcardsForUser(user.id);
  const summary = getLanguageFlashcardSummary(items);

  return new Response(
    JSON.stringify({
      appId: "language-flashcards",
      summary: {
        totalFlashcards: summary.total,
        activeFlashcards: summary.active,
        favoriteFlashcards: summary.favorites,
        archivedFlashcards: summary.archived,
        languageCount: summary.languageCount,
        deckCount: summary.deckCount,
        mostRecentlyUpdated: summary.mostRecent?.frontText ?? null,
      },
    }),
    { headers: { "content-type": "application/json" } }
  );
};
