# Database Schema for LivaNova

## Overview

The database will be hosted on **Cloud Firestore**. The structure is designed to be scalable, cost-effective (minimizing reads), and supportive of the core "Daily Impulse" logic.

## Collections

### 1. `impulses` (Collection)

Contains all the static content for the impulses. This data is read-only for the client app.

**Document ID**: `impulseId` (e.g., "1001" or auto-generated, but using a sequence-mapped ID helps).

**Fields**:
| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `sequence` | Integer | **Critical**. Determines the order of impulses (1, 2, 3...). Used to match with user's progress. |
| `titleShort` | String | Short title (max 6 words). |
| `titleFull` | String | Full title (max 12 words). |
| `hookText` | String | Catchy intro text. |
| `motivatorText` | String | Psychological motivation text. |
| `impulsLongText` | String | The main content. |
| `zonesBridgeText` | String | Transition text to the 5-zone model. |
| `wellbeingWeight` | Integer | Points (1-3) added to user's score upon acceptance. |
| `tags` | Array<String> | For filtering in Library (e.g., ["Morgen", "Alltag"]). |
| `zones` | Object/Map | Boolean flags for the 5 zones. |
| &nbsp;&nbsp;`sleep` | Boolean | |
| &nbsp;&nbsp;`stress` | Boolean | |
| &nbsp;&nbsp;`heart` | Boolean | (herzActive) |
| &nbsp;&nbsp;`inflammation`| Boolean | (entzuendungActive) |
| &nbsp;&nbsp;`movement` | Boolean | (bewegungActive) |
| `zoneDetails` | Object/Map | Specific text for each zone if active. |
| &nbsp;&nbsp;`sleepText` | String | |
| &nbsp;&nbsp;`stressText` | String | |
| &nbsp;&nbsp;`heartText` | String | |
| &nbsp;&nbsp;`inflammationText`| String | |
| &nbsp;&nbsp;`movementText` | String | |
| `zoneFocusText` | String | Summary of focus ("Heute stehen Schlaf und Stress..."). |

#### Example Data Structures for Maps:

**`zones` (Map/Object)**:
```json
{
  "sleep": true,
  "stress": true,
  "heart": false,
  "inflammation": false,
  "movement": false
}
```

**`zoneDetails` (Map/Object)**:
```json
{
  "sleepText": "Diese Zone steht für Erholung und Rhythmus...",
  "stressText": "Diese Zone reguliert innere Sicherheit...",
  "heartText": "",
  "inflammationText": "",
  "movementText": ""
}
```

---

### 2. `users` (Collection)

Stores user profile, state, and progress.

**Document ID**: `uid` (from Firebase Auth).

**Fields**:
| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `email` | String | User email. |
| `display_name` | String | User first name. |
| `photo_url` | String | Profile picture URL. |
| `created_time` | Timestamp | Account creation date. |
| `age` | String/Int | User age group or year. |
| `gender` | String | User gender. |
| **State Tracking** | | |
| `current_impulse_sequence` | Integer | The `sequence` number of the impulse the user is currently on (starts at 1). |
| `last_decision_date` | Date/Timestamp | The date when the last decision (Accept/Not Today) was made. Used to determine if "Done" screen should be shown. |
| **Stats** | | |
| `wellbeing_score` | Integer | Sum of `wellbeingWeight` of all accepted impulses. |
| `saved_count` | Integer | Total number of accepted impulses. |
| `streak_count` | Integer | Days in a row a decision was made. |
| `last_streak_update` | Date/Timestamp | Used to calculate if streak continues or resets. |
| **Settings** | | |
| `notifications_enabled` | Boolean | |
| `notification_time` | Timestamp/String | Preferred time for daily notification. |

---

### 3. `users/{uid}/library` (Sub-collection)

Stores the impulses that the user has "Accepted".
_Why a sub-collection?_ To allow efficient filtering and searching specific to the user without downloading the entire history effectively.

**Document ID**: `impulseId` (Same as the global impulse ID).

**Fields**:

- _Copy all fields from the `impulses` document_ (Denormalization is recommended here so the Library view doesn't need to join/read from the main collection for every item, saving reads and ensuring speed).
- **Additional Fields**:
  - `saved_at`: Timestamp (Date when it was accepted).

---

## Scalability Considerations

1.  **Denormalization**: Copying impulse data to the user's library increases storage use slightly but significantly reduces read costs and simplifies "my library" queries.
2.  **Sequence Logic**: Using an Integer `sequence` allows easy reordering of future impulses in the main database without breaking user progress (as long as you don't change the sequence of already consumed ones).
3.  **Pro Version**: The schema supports adding a `isPro` boolean to the user or a `subscription_status` field later.

## Indexing Requirements

- `users/{uid}/library`:
  - Index on `saved_at` (DESC) for default sorting.
  - Index on `titleFull` for search.
  - Index on `tags` (Array-contains) for filtering.
  - Index on `zones.sleep`, `zones.stress`, etc., for zone filtering.
