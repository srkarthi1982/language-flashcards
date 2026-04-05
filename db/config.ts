import { defineDb } from "astro:db";
import { VocabDecks } from "./tables";

export default defineDb({
  tables: {
    VocabDecks,
  },
});
