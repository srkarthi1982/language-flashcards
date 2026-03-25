import type { Alpine } from "alpinejs";

type Flashcard = {
  id: number;
  language: string | null;
  deck: string | null;
  topic: string | null;
  frontText: string;
  backText: string;
  pronunciation: string | null;
  exampleText: string | null;
  notes: string | null;
  isFavorite: boolean;
  status: "active" | "archived";
};

declare global {
  interface Window {
    flashcardsAppStore: {
      init: (payload: { flashcards: Flashcard[] }) => any;
    };
  }
}

function baseForm() {
  return {
    id: null as number | null,
    language: "",
    deck: "",
    topic: "",
    frontText: "",
    backText: "",
    pronunciation: "",
    exampleText: "",
    notes: "",
  };
}

export default function initAlpine(_Alpine: Alpine) {
  window.flashcardsAppStore = {
    init({ flashcards }) {
      return {
        flashcards,
        search: "",
        activeTab: "overview",
        activeFlashcardId: null as number | null,
        isDrawerOpen: false,
        isSubmitting: false,
        flash: { success: "", error: "" },
        filters: { language: "", deck: "", topic: "" },
        form: baseForm(),
        get visibleFlashcards() {
          return this.flashcards.filter((item: Flashcard) => {
            const tabMatch =
              this.activeTab === "overview" ||
              this.activeTab === "flashcards"
                ? item.status === "active"
                : this.activeTab === "favorites"
                  ? item.status === "active" && item.isFavorite
                  : this.activeTab === "archived"
                    ? item.status === "archived"
                    : true;

            const searchLower = this.search.toLowerCase();
            const searchMatch =
              searchLower.length === 0 ||
              item.frontText.toLowerCase().includes(searchLower) ||
              item.backText.toLowerCase().includes(searchLower);

            const languageMatch =
              !this.filters.language ||
              (item.language ?? "").toLowerCase().includes(this.filters.language.toLowerCase());
            const deckMatch =
              !this.filters.deck ||
              (item.deck ?? "").toLowerCase().includes(this.filters.deck.toLowerCase());
            const topicMatch =
              !this.filters.topic ||
              (item.topic ?? "").toLowerCase().includes(this.filters.topic.toLowerCase());

            return tabMatch && searchMatch && languageMatch && deckMatch && topicMatch;
          });
        },
        openCreateModal() {
          this.form = baseForm();
          this.activeFlashcardId = null;
          this.isDrawerOpen = true;
        },
        openEditModal(item: Flashcard) {
          this.form = {
            id: item.id,
            language: item.language ?? "",
            deck: item.deck ?? "",
            topic: item.topic ?? "",
            frontText: item.frontText,
            backText: item.backText,
            pronunciation: item.pronunciation ?? "",
            exampleText: item.exampleText ?? "",
            notes: item.notes ?? "",
          };
          this.activeFlashcardId = item.id;
          this.isDrawerOpen = true;
        },
        closeDrawer() {
          this.isDrawerOpen = false;
        },
      };
    },
  };
}
