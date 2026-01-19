# App Logic & Flows

## 1. App Initialization & Home Screen Logic

**Goal**: Determine if the user should see a new impulse or the "Done for today" placeholder.

**Flow**:
1.  **App Launch / Home Load**:
    *   Fetch User Document (`users/{uid}`).
    *   Get `current_impulse_sequence` (default 1 if null) and `last_decision_date`.
2.  **Date Comparison**:
    *   Compare `last_decision_date` with `Today's Date` (Local time).
    *   **Condition A**: If `last_decision_date` == `Today`:
        *   **Action**: Show **Placeholder Card** ("You are done for today").
    *   **Condition B**: If `last_decision_date` != `Today` (e.g., yesterday or null):
        *   **Action**: Query `impulses` collection where `sequence` == `current_impulse_sequence`.
        *   Show **Impulse Card**.

---

## 2. Core Interactions (Home Screen)

### Button: "Accept" (User wants to keep impulse)
1.  **UI Feedback**: Show success animation/snackbar.
2.  **Database Actions (Batch Write recommended)**:
    *   **Add to Library**: Create document in `users/{uid}/library/{impulseId}` with all impulse data + `saved_at` = Now.
    *   **Update User Stats**:
        *   `wellbeing_score` += `impulse.wellbeingWeight`
        *   `saved_count` += 1
        *   `last_decision_date` = Now
        *   `current_impulse_sequence` += 1 (Increment for *tomorrow's* impulse)
        *   **Streak Logic**:
            *   If `last_streak_update` was Yesterday -> Streak += 1
            *   If `last_streak_update` was Today -> No change (already counted)
            *   If `last_streak_update` was older than Yesterday -> Reset Streak to 1
            *   Update `last_streak_update` = Now.
3.  **UI Update**: Replace Impulse Card with Placeholder Card.

### Button: "Not Today" (User skips impulse)
1.  **UI Feedback**: Card dismissed.
2.  **Database Actions**:
    *   **Update User Stats**:
        *   `last_decision_date` = Now
        *   `current_impulse_sequence` += 1 (Increment for *tomorrow's* impulse - user skips this one permanently)
        *   **Streak Logic**: Same as "Accept" (Making a decision counts towards streak).
3.  **UI Update**: Replace Impulse Card with Placeholder Card.

---

## 3. Library Logic
**Goal**: Display saved impulses with filtering.

1.  **Load**: Query `users/{uid}/library` order by `saved_at` DESC.
2.  **Search**: Client-side filter or Firestore query `titleFull` >= SearchTerm.
3.  **Filters**:
    *   **Zones**: Filter where `zones.{selectedZone}` == true.
    *   **Tags**: Filter where `tags` contains `{selectedTag}`.
4.  **Sort**:
    *   Date (Default): `saved_at` DESC / ASC.
    *   A-Z: `titleFull` ASC.

---

## 4. Journey / Profile Logic
**Goal**: Display user progress.

1.  **Metrics Display**:
    *   **Wellbeing Minutes**: Read `users/{uid}.wellbeing_score`.
    *   **Saved Impulses**: Read `users/{uid}.saved_count`.
    *   **Streak**: Read `users/{uid}.streak_count`.
2.  **Streak Calculation Note**:
    *   When displaying streak, check if `last_streak_update` is older than Yesterday. If so, display 0 (user broke the streak), but do not reset in DB until they make a new decision (lazy update).

---

## 5. Notifications
*   **Trigger**: Cloud Function (see [cloud_functions.md](cloud_functions.md)).
*   **User Setting**: In Profile, user toggles `notifications_enabled` and sets `notification_time`.
*   **Action**: When notification arrives, tapping it opens the App.

