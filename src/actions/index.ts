import { defineAction, ActionError, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { VocabDecks, and, db, desc, eq } from "astro:db";
import { emitDashboardSummary, maybeEmitHighSignalNotification } from "../lib/integrations";

function requireUser(context: ActionAPIContext) {
  const user = (context.locals as App.Locals | undefined)?.user;

  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return user;
}

async function requireOwnedFlashcard(id: number, userId: string) {
  const [flashcard] = await db
    .select()
    .from(VocabDecks)
    .where(and(eq(VocabDecks.id, id), eq(VocabDecks.ownerId, userId)));

  if (!flashcard) {
    throw new ActionError({ code: "NOT_FOUND", message: "Flashcard not found." });
  }

  return flashcard;
}

const flashcardPayload = z.object({
  language: z.string().trim().max(100).optional(),
  deck: z.string().trim().max(120).optional(),
  topic: z.string().trim().max(120).optional(),
  frontText: z.string().trim().min(1).max(500),
  backText: z.string().trim().min(1).max(500),
  pronunciation: z.string().trim().max(240).optional(),
  exampleText: z.string().trim().max(1000).optional(),
  notes: z.string().trim().max(2000).optional(),
});

function normalizeNullable(value?: string) {
  return value && value.length > 0 ? value : null;
}

export const server = {
  createLanguageFlashcard: defineAction({
    accept: "form",
    input: flashcardPayload,
    handler: async (input, context) => {
      const user = requireUser(context);
      const now = new Date();

      const existingCount = await db
        .select({ id: VocabDecks.id })
        .from(VocabDecks)
        .where(eq(VocabDecks.ownerId, user.id));

      const [flashcard] = await db
        .insert(VocabDecks)
        .values({
          ownerId: user.id,
          language: normalizeNullable(input.language),
          deck: normalizeNullable(input.deck),
          topic: normalizeNullable(input.topic),
          frontText: input.frontText,
          backText: input.backText,
          pronunciation: normalizeNullable(input.pronunciation),
          exampleText: normalizeNullable(input.exampleText),
          notes: normalizeNullable(input.notes),
          isFavorite: false,
          status: "active",
          createdAt: now,
          updatedAt: now,
          archivedAt: null,
        })
        .returning();

      await emitDashboardSummary(user.id);

      if (existingCount.length === 0) {
        await maybeEmitHighSignalNotification({
          userId: user.id,
          type: "first_flashcard_created",
          title: "First flashcard created",
          message: `Great start — \"${flashcard.frontText}\" was added to your workspace.`,
        });
      }

      return { success: true, data: { flashcard } };
    },
  }),

  updateLanguageFlashcard: defineAction({
    accept: "form",
    input: flashcardPayload.extend({ id: z.number().int() }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await requireOwnedFlashcard(input.id, user.id);

      const [flashcard] = await db
        .update(VocabDecks)
        .set({
          language: normalizeNullable(input.language),
          deck: normalizeNullable(input.deck),
          topic: normalizeNullable(input.topic),
          frontText: input.frontText,
          backText: input.backText,
          pronunciation: normalizeNullable(input.pronunciation),
          exampleText: normalizeNullable(input.exampleText),
          notes: normalizeNullable(input.notes),
          updatedAt: new Date(),
        })
        .where(eq(VocabDecks.id, input.id))
        .returning();

      await emitDashboardSummary(user.id);

      return { success: true, data: { flashcard } };
    },
  }),

  archiveLanguageFlashcard: defineAction({
    accept: "form",
    input: z.object({ id: z.number().int() }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await requireOwnedFlashcard(input.id, user.id);
      const now = new Date();

      const [flashcard] = await db
        .update(VocabDecks)
        .set({ status: "archived", archivedAt: now, updatedAt: now })
        .where(eq(VocabDecks.id, input.id))
        .returning();

      await emitDashboardSummary(user.id);

      return { success: true, data: { flashcard } };
    },
  }),

  restoreLanguageFlashcard: defineAction({
    accept: "form",
    input: z.object({ id: z.number().int() }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await requireOwnedFlashcard(input.id, user.id);
      const now = new Date();

      const [flashcard] = await db
        .update(VocabDecks)
        .set({ status: "active", archivedAt: null, updatedAt: now })
        .where(eq(VocabDecks.id, input.id))
        .returning();

      await emitDashboardSummary(user.id);

      return { success: true, data: { flashcard } };
    },
  }),

  toggleLanguageFlashcardFavorite: defineAction({
    accept: "form",
    input: z.object({ id: z.number().int() }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const existing = await requireOwnedFlashcard(input.id, user.id);
      const now = new Date();

      const [flashcard] = await db
        .update(VocabDecks)
        .set({ isFavorite: !existing.isFavorite, updatedAt: now })
        .where(eq(VocabDecks.id, input.id))
        .returning();

      if (!existing.isFavorite && flashcard.isFavorite) {
        const favorites = await db
          .select({ id: VocabDecks.id })
          .from(VocabDecks)
          .where(
            and(
              eq(VocabDecks.ownerId, user.id),
              eq(VocabDecks.isFavorite, true)
            )
          );

        if (favorites.length === 1) {
          await maybeEmitHighSignalNotification({
            userId: user.id,
            type: "first_favorite_flashcard",
            title: "First favorite saved",
            message: `\"${flashcard.frontText}\" is now marked as a favorite.`,
          });
        }
      }

      await emitDashboardSummary(user.id);

      return { success: true, data: { flashcard } };
    },
  }),

  listLanguageFlashcards: defineAction({
    input: z
      .object({
        status: z.enum(["active", "archived", "all"]).default("active"),
      })
      .optional(),
    handler: async (input, context) => {
      const user = requireUser(context);
      const status = input?.status ?? "active";

      const rows =
        status === "all"
          ? await db
              .select()
              .from(VocabDecks)
              .where(eq(VocabDecks.ownerId, user.id))
              .orderBy(desc(VocabDecks.updatedAt))
          : await db
              .select()
              .from(VocabDecks)
              .where(
                and(
                  eq(VocabDecks.ownerId, user.id),
                  eq(VocabDecks.status, status)
                )
              )
              .orderBy(desc(VocabDecks.updatedAt));

      return { success: true, data: { items: rows, total: rows.length } };
    },
  }),

  getLanguageFlashcardDetail: defineAction({
    input: z.object({ id: z.number().int() }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const flashcard = await requireOwnedFlashcard(input.id, user.id);
      return { success: true, data: { flashcard } };
    },
  }),
};
