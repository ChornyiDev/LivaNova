# App Logic & Flows

## 0. Onboarding Flow

**Goal**: Collect user profile data (name, age, gender) and notification preferences before the first impulse.

**State Management**:
*   **App State (Local)**: `onboarding_step` (Integer). Used to navigate between slides (0: Intro, 1: Profile, 2: 5-Zones Intro, 3: Notifications).
*   **Database**: `is_onboarding_finished` (Boolean) in the User document.

**Flow**:
1.  **Check Status**: On App Launch, if `is_onboarding_finished` == `false`, redirect to Onboarding Screen.
2.  **Navigation**: User clicks "Next", increment `onboarding_step` in App State.
3.  **Completion**: On the last step:
    *   Update User Document with collected fields (`display_name`, `age`, `gender`, `notification_time_slot`).
    *   Set `is_onboarding_finished` = `true`.
    *   Redirect to Home Screen.

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
    *   **Add to Library**: Create document in `users/{uid}/library/{impulse_id}` with all impulse data + `saved_at` = Now.
    *   **Update User Stats**:
        *   `wellbeing_score` += `impulse.wellbeing_weight`
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
2.  **Search**: Client-side filter or Firestore query `title_full` >= SearchTerm.
3.  **Filters**:
    *   **Zones**: Filter where `zones.{selectedZone}` == true.
    *   **Tags**: Filter where `tags` contains `{selectedTag}`.
4.  **Sort**:
    *   Date (Default): `saved_at` DESC / ASC.
    *   A-Z: `title_full` ASC.

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
*   **User Setting**: In Profile, user toggles `notifications_enabled` and sets `notification_time_slot`.
*   **Action**: When notification arrives, tapping it opens the App.

---

## 6. Implementation Snippets (FlutterFlow)

### Next Day Calculation (Inline Function / Expression)
**Use Case**: Displaying or using the date for tomorrow in `d/M/y` format.
**Return Type**: `String`

```dart
// Returns tomorrow's date like "20/1/2026"
"${DateTime.now().add(const Duration(days: 1)).day}/${DateTime.now().add(const Duration(days: 1)).month}/${DateTime.now().add(const Duration(days: 1)).year}"
```

### Check if Decision was Made Today
**Use Case**: Visibility logic for Home Screen (Show "Done" placeholder if `true`).
**Argument**: `lastDecisionDate` (String?) - expected format "d/M/y"
**Return Type**: `Boolean`

```dart
lastDecisionDate == "${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}"
```

### Multi-Zone & Tag Filtering Logic (Client-side)
**Use Case**: Filtering Library items by 5 checkboxes and a list of tags.

**Parameters (Arguments)**:
1.  `impulses`: `List<LibraryRecord>` (The list of items from User's Library)
2.  `fSleep`: `Boolean?` (Checkbox for Sleep zone)
3.  `fStress`: `Boolean?` (Checkbox for Stress zone)
4.  `fHeart`: `Boolean?` (Checkbox for Heart zone)
5.  `fInflam`: `Boolean?` (Checkbox for Inflammation zone)
6.  `fMove`: `Boolean?` (Checkbox for Movement zone)
7.  `fTags`: `List<String>?` (Selected tags for filtering)
8.  `sortDirection`: `String?` ("ASC" or "DESC")

**Return Type**: `List<LibraryRecord>`

```dart
List<LibraryRecord> filterLibraryByZonesAndTags(
  List<LibraryRecord>? impulses,
  bool? fSleep, 
  bool? fStress, 
  bool? fHeart, 
  bool? fInflam, 
  bool? fMove,
  List<String>? fTags,
  String? sortDirection,
) {
  if (impulses == null) return [];

  final bool s = fSleep ?? false;
  final bool st = fStress ?? false;
  final bool h = fHeart ?? false;
  final bool i = fInflam ?? false;
  final bool m = fMove ?? false;
  final List<String> selectedTags = fTags ?? [];

  // 1. Filtering Logic
  var filteredList = impulses.where((impulse) {
    bool zoneMatch = !s && !st && !h && !i && !m; 
    final zones = impulse.zones;
    if (zones != null) {
      if (s && zones.sleep == true) zoneMatch = true;
      if (st && zones.stress == true) zoneMatch = true;
      if (h && zones.heart == true) zoneMatch = true;
      if (i && zones.inflammation == true) zoneMatch = true;
      if (m && zones.movement == true) zoneMatch = true;
    }

    bool tagMatch = selectedTags.isEmpty; 
    if (selectedTags.isNotEmpty) {
      final impulseTags = impulse.tags ?? [];
      tagMatch = selectedTags.any((tag) => impulseTags.contains(tag));
    }

    return zoneMatch && tagMatch;
  }).toList();

  // 2. Sorting Logic (by saved_at)
  if (sortDirection != null && sortDirection.isNotEmpty) {
    filteredList.sort((a, b) {
      final DateTime timeA = a.savedAt ?? DateTime.fromMillisecondsSinceEpoch(0);
      final DateTime timeB = b.savedAt ?? DateTime.fromMillisecondsSinceEpoch(0);
      if (sortDirection == 'ASC') {
        return timeA.compareTo(timeB);
      } else {
        return timeB.compareTo(timeA);
      }
    });
  }

  return filteredList;
}
```

### Initial Filter Tags
These tags are now stored in the **`tags` (Collection)** and should be fetched dynamically to populate filters in the Library:
*   `Morgen`, `Alltag`, `Übergang`, `Hydration`, `Routine`, `Bewegung`, `Aktivierung`.

### Request Notification Permission & Get Token (Custom Action)
**Use Case**: Onboarding Step 3 - Request permission and save token immediately.
**Return Type**: `Future<String?>`
**Dependencies**: `firebase_messaging`

```dart
// Custom Action: requestNotificationPermissionAndGetToken
import 'package:firebase_messaging/firebase_messaging.dart';

Future<String?> requestNotificationPermissionAndGetToken() async {
  try {
    FirebaseMessaging messaging = FirebaseMessaging.instance;

    // 1. Request Permission for all platforms
    NotificationSettings settings = await messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false, // Set true for silent notifications on iOS 12+
      sound: true,
    );

    print('User granted permission: ${settings.authorizationStatus}');

    if (settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional) {
      
      // 2. Get Token
      // On Web, ensure VAPID key is configured in your FlutterFlow project settings
      String? token = await messaging.getToken();
      
      print('FCM Token: $token');
      return token;
    } else {
      print('User declined or has not accepted permission');
      return null;
    }
  } catch (e) {
    print('Error requesting permission or getting token: $e');
    return null;
  }
}
```
