import { listLanguageFlashcardsForUser, getLanguageFlashcardSummary } from "./flashcards";

type NotificationPayload = {
  userId: string;
  type: "first_flashcard_created" | "first_favorite_flashcard";
  title: string;
  message: string;
};

const DASHBOARD_WEBHOOK_URL = import.meta.env.ANSIVERSA_DASHBOARD_WEBHOOK_URL;
const NOTIFICATIONS_WEBHOOK_URL = import.meta.env.ANSIVERSA_NOTIFICATIONS_WEBHOOK_URL;

export async function emitDashboardSummary(userId: string) {
  if (!DASHBOARD_WEBHOOK_URL) return;

  const all = await listLanguageFlashcardsForUser(userId);
  const summary = getLanguageFlashcardSummary(all);

  await fetch(DASHBOARD_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      appId: "language-flashcards",
      userId,
      summary: {
        totalFlashcards: summary.total,
        favoriteFlashcards: summary.favorites,
        languageCount: summary.languageCount,
        mostRecentlyUpdated: summary.mostRecent?.frontText ?? null,
        mostRecentlyUpdatedAt: summary.mostRecent?.updatedAt ?? null,
      },
    }),
  });
}

export async function maybeEmitHighSignalNotification(payload: NotificationPayload) {
  if (!NOTIFICATIONS_WEBHOOK_URL) return;

  await fetch(NOTIFICATIONS_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      appId: "language-flashcards",
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      severity: "info",
    }),
  });
}
