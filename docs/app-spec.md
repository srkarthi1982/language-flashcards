# App Spec: language-flashcards

## 1) App Overview
- **App Name:** Language Flashcards
- **Category:** Education / Memorization
- **Version:** V1
- **App Type:** DB-backed
- **Purpose:** Help an authenticated user maintain personal language flashcards with decks, topics, favorites, and archive state.
- **Primary User:** A signed-in user studying languages through a private flashcard workspace.

## 2) User Stories
- As a user, I want to create flashcards with front/back text and optional pronunciation, so that I can study vocabulary and phrases.
- As a user, I want to filter flashcards by language, deck, topic, and favorites, so that I can focus on a specific study set.
- As a user, I want to archive and restore cards, so that I can keep older material without deleting it.

## 3) Core Workflow
1. User signs in and opens `/app`.
2. User creates a flashcard from the drawer or edits one from the workspace.
3. App saves the card to the user-scoped database and refreshes the visible list.
4. User opens the detail route for full reading, favorite, and archive/restore actions.
5. User filters the library by search, language, deck, topic, favorites, or archived state.

## 4) Functional Behavior
- Flashcards are persisted per user with language, deck, topic, front text, back text, pronunciation, example text, and notes.
- The workspace supports create, edit, favorite toggle, archive, restore, search, and filter behavior.
- `/app` and detail routes are protected; unauthenticated users are redirected to the parent login flow.
- Current implementation is a manual flashcard library and does not include quiz or spaced-repetition scoring logic.

## 5) Data & Storage
- **Storage type:** Astro DB on the app’s isolated Turso database
- **Main entities:** LanguageFlashcards
- **Persistence expectations:** Cards persist across refresh and future sessions for the authenticated owner.
- **User model:** Multi-user shared infrastructure with per-user isolation

## 6) Special Logic (Optional)
- Summary cards track active, archived, favorite, language-count, and deck-count metrics.
- Favorite and archive actions can be triggered from both workspace and detail routes.

## 7) Edge Cases & Error Handling
- Invalid IDs/routes: Non-numeric detail IDs redirect back to `/app`; missing records return `404`.
- Empty input: Front and back text are required before save.
- Unauthorized access: Protected routes require a signed-in user.
- Missing records: Non-owned cards are blocked by ownership checks in the action layer.
- Invalid payload/state: Overlong or malformed payload values are rejected by the schema.

## 8) Tester Verification Guide
### Core flow tests
- [ ] Create a flashcard with language, deck, and optional pronunciation, then confirm it appears in the workspace and detail route.
- [ ] Edit the flashcard, favorite it, archive it, then restore it and confirm all state changes persist.

### Safety tests
- [ ] Open an invalid or missing flashcard detail route and confirm the app fails safely.
- [ ] Attempt to save without front or back text and confirm the request is rejected.
- [ ] Confirm cross-user access to another flashcard is blocked.

### Negative tests
- [ ] Confirm there is no quiz engine or automatic spaced repetition in V1.
- [ ] Confirm there is no hard-delete flow in the current implementation.

## 9) Out of Scope (V1)
- Quiz/test mode
- Shared decks between users
- Permanent delete or import/export workflows

## 10) Freeze Notes
- V1 release freeze: this document reflects the current repo implementation before final browser verification.
- This spec was populated conservatively from current routes, actions, and tables; route handling and reactivity should be confirmed in freeze verification.
- During freeze, only verification fixes and cleanup are allowed; no undocumented feature expansion.
