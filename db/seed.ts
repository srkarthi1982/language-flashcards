import { db, LanguageFlashcards } from "astro:db";

export default async function seed() {
  await db.insert(LanguageFlashcards).values([
    {
      userId: "demo-user",
      language: "Spanish",
      deck: "Travel",
      topic: "Basics",
      frontText: "¿Dónde está la estación?",
      backText: "Where is the station?",
      pronunciation: "DON-deh es-TAH lah es-ta-see-ON",
      exampleText: "¿Dónde está la estación de tren?",
      notes: "Useful for transit questions.",
      isFavorite: true,
      status: "active",
      archivedAt: null,
    },
  ]);
}
