import { defineAction, ActionError, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import {
  VocabCards,
  VocabDecks,
  VocabReviews,
  VocabStudySessions,
  and,
  db,
  eq,
} from "astro:db";

function requireUser(context: ActionAPIContext) {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;

  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return user;
}

async function getDeckForUser(deckId: number, userId: string) {
  const [deck] = await db.select().from(VocabDecks).where(eq(VocabDecks.id, deckId));

  if (!deck) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "Deck not found.",
    });
  }

  if (deck.ownerId !== userId) {
    throw new ActionError({
      code: "FORBIDDEN",
      message: "You do not have access to this deck.",
    });
  }

  return deck;
}

export const server = {
  createDeck: defineAction({
    input: z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      fromLanguage: z.string().optional(),
      toLanguage: z.string().optional(),
      level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2", "mixed"]).optional(),
      tags: z.string().optional(),
      isActive: z.boolean().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const now = new Date();

      const [deck] = await db
        .insert(VocabDecks)
        .values({
          ownerId: user.id,
          title: input.title,
          description: input.description,
          fromLanguage: input.fromLanguage ?? "en",
          toLanguage: input.toLanguage ?? "en",
          level: input.level ?? "mixed",
          tags: input.tags,
          isActive: input.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return {
        success: true,
        data: { deck },
      };
    },
  }),

  updateDeck: defineAction({
    input: z
      .object({
        id: z.number().int(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        fromLanguage: z.string().optional(),
        toLanguage: z.string().optional(),
        level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2", "mixed"]).optional(),
        tags: z.string().optional(),
        isActive: z.boolean().optional(),
      })
      .refine(
        (input) =>
          input.title !== undefined ||
          input.description !== undefined ||
          input.fromLanguage !== undefined ||
          input.toLanguage !== undefined ||
          input.level !== undefined ||
          input.tags !== undefined ||
          input.isActive !== undefined,
        { message: "At least one field must be provided to update." }
      ),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getDeckForUser(input.id, user.id);

      const [deck] = await db
        .update(VocabDecks)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          ...(input.fromLanguage !== undefined
            ? { fromLanguage: input.fromLanguage }
            : {}),
          ...(input.toLanguage !== undefined ? { toLanguage: input.toLanguage } : {}),
          ...(input.level !== undefined ? { level: input.level } : {}),
          ...(input.tags !== undefined ? { tags: input.tags } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          updatedAt: new Date(),
        })
        .where(eq(VocabDecks.id, input.id))
        .returning();

      return {
        success: true,
        data: { deck },
      };
    },
  }),

  listDecks: defineAction({
    input: z
      .object({
        includeInactive: z.boolean().default(false),
      })
      .optional(),
    handler: async (input, context) => {
      const user = requireUser(context);
      const includeInactive = input?.includeInactive ?? false;

      const decks = await db
        .select()
        .from(VocabDecks)
        .where(
          includeInactive
            ? eq(VocabDecks.ownerId, user.id)
            : and(eq(VocabDecks.ownerId, user.id), eq(VocabDecks.isActive, true))
        );

      return {
        success: true,
        data: { items: decks, total: decks.length },
      };
    },
  }),

  upsertCard: defineAction({
    input: z.object({
      id: z.number().int().optional(),
      deckId: z.number().int(),
      displayOrder: z.number().int().optional(),
      term: z.string().min(1),
      translation: z.string().min(1),
      transliteration: z.string().optional(),
      partOfSpeech: z.string().optional(),
      gender: z.string().optional(),
      exampleSentence: z.string().optional(),
      exampleTranslation: z.string().optional(),
      phonetic: z.string().optional(),
      audioUrl: z.string().optional(),
      tags: z.string().optional(),
      isActive: z.boolean().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getDeckForUser(input.deckId, user.id);
      const now = new Date();

      if (input.id) {
        const [card] = await db
          .select()
          .from(VocabCards)
          .where(and(eq(VocabCards.id, input.id), eq(VocabCards.deckId, input.deckId)));

        if (!card) {
          throw new ActionError({
            code: "NOT_FOUND",
            message: "Card not found.",
          });
        }

        const [updated] = await db
          .update(VocabCards)
          .set({
            deckId: input.deckId,
            displayOrder: input.displayOrder ?? card.displayOrder,
            term: input.term,
            translation: input.translation,
            transliteration: input.transliteration,
            partOfSpeech: input.partOfSpeech,
            gender: input.gender,
            exampleSentence: input.exampleSentence,
            exampleTranslation: input.exampleTranslation,
            phonetic: input.phonetic,
            audioUrl: input.audioUrl,
            tags: input.tags,
            isActive: input.isActive ?? card.isActive,
          })
          .where(eq(VocabCards.id, input.id))
          .returning();

        return {
          success: true,
          data: { card: updated },
        };
      }

      const [card] = await db
        .insert(VocabCards)
        .values({
          deckId: input.deckId,
          displayOrder: input.displayOrder ?? 0,
          term: input.term,
          translation: input.translation,
          transliteration: input.transliteration,
          partOfSpeech: input.partOfSpeech,
          gender: input.gender,
          exampleSentence: input.exampleSentence,
          exampleTranslation: input.exampleTranslation,
          phonetic: input.phonetic,
          audioUrl: input.audioUrl,
          tags: input.tags,
          isActive: input.isActive ?? true,
        })
        .returning();

      return {
        success: true,
        data: { card },
      };
    },
  }),

  listCards: defineAction({
    input: z.object({
      deckId: z.number().int(),
      includeInactive: z.boolean().default(false),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getDeckForUser(input.deckId, user.id);

      const cards = await db
        .select()
        .from(VocabCards)
        .where(
          input.includeInactive
            ? eq(VocabCards.deckId, input.deckId)
            : and(eq(VocabCards.deckId, input.deckId), eq(VocabCards.isActive, true))
        );

      return {
        success: true,
        data: { items: cards, total: cards.length },
      };
    },
  }),

  startStudySession: defineAction({
    input: z.object({
      deckId: z.number().int(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getDeckForUser(input.deckId, user.id);
      const startedAt = new Date();

      const [session] = await db
        .insert(VocabStudySessions)
        .values({
          deckId: input.deckId,
          userId: user.id,
          startedAt,
          completedAt: null,
          totalCardsSeen: 0,
          correctCount: 0,
          wrongCount: 0,
          summary: null,
          createdAt: startedAt,
        })
        .returning();

      return {
        success: true,
        data: { session },
      };
    },
  }),

  completeStudySession: defineAction({
    input: z.object({
      id: z.number().int(),
      totalCardsSeen: z.number().int().optional(),
      correctCount: z.number().int().optional(),
      wrongCount: z.number().int().optional(),
      summary: z.record(z.any()).optional(),
      completedAt: z.date().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [session] = await db
        .select()
        .from(VocabStudySessions)
        .where(
          and(
            eq(VocabStudySessions.id, input.id),
            eq(VocabStudySessions.userId, user.id)
          )
        );

      if (!session) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Study session not found.",
        });
      }

      const [updated] = await db
        .update(VocabStudySessions)
        .set({
          totalCardsSeen: input.totalCardsSeen ?? session.totalCardsSeen,
          correctCount: input.correctCount ?? session.correctCount,
          wrongCount: input.wrongCount ?? session.wrongCount,
          summary: input.summary ?? session.summary,
          completedAt: input.completedAt ?? new Date(),
        })
        .where(eq(VocabStudySessions.id, input.id))
        .returning();

      return {
        success: true,
        data: { session: updated },
      };
    },
  }),

  logReview: defineAction({
    input: z.object({
      deckId: z.number().int(),
      cardId: z.number().int(),
      sessionId: z.number().int().optional(),
      rating: z.enum(["again", "hard", "good", "easy"]).default("good"),
      reviewedAt: z.date().optional(),
      dueAt: z.date().optional(),
      intervalDays: z.number().int().optional(),
      easeFactor: z.number().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getDeckForUser(input.deckId, user.id);

      const [card] = await db
        .select()
        .from(VocabCards)
        .where(and(eq(VocabCards.id, input.cardId), eq(VocabCards.deckId, input.deckId)));

      if (!card) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Card not found for this deck.",
        });
      }

      if (input.sessionId) {
        const [session] = await db
          .select()
          .from(VocabStudySessions)
          .where(
            and(
              eq(VocabStudySessions.id, input.sessionId),
              eq(VocabStudySessions.userId, user.id)
            )
          );

        if (!session) {
          throw new ActionError({
            code: "FORBIDDEN",
            message: "Session not found or not accessible.",
          });
        }
      }

      const [review] = await db
        .insert(VocabReviews)
        .values({
          deckId: input.deckId,
          cardId: input.cardId,
          userId: user.id,
          sessionId: input.sessionId,
          rating: input.rating,
          reviewedAt: input.reviewedAt ?? new Date(),
          dueAt: input.dueAt,
          intervalDays: input.intervalDays ?? 0,
          easeFactor: input.easeFactor,
        })
        .returning();

      return {
        success: true,
        data: { review },
      };
    },
  }),
};
