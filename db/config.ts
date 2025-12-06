import { defineDb } from "astro:db";
import {
  VocabDecks,
  VocabCards,
  VocabStudySessions,
  VocabReviews,
} from "./tables";

export default defineDb({
  tables: {
    VocabDecks,
    VocabCards,
    VocabStudySessions,
    VocabReviews,
  },
});
