import { defineDb } from "astro:db";
import { LanguageFlashcards } from "./tables";

export default defineDb({
  tables: {
    LanguageFlashcards,
  },
});
