# Cloud Function for Notifications

## Overview
To send reliable push notifications at a user-specified time (e.g., "Morning", "Lunch", "Evening"), we will use a **Scheduled Cloud Function** combined with **Firebase Cloud Messaging (FCM)**.

## Function: `sendDailyImpulseNotifications`

### Trigger
*   **Schedule**: Runs at specific predefined times that match the user's selection options in the app.
*   **Time Slots**: 
    *   **Morning**: 08:00
    *   **Forenoon**: 10:00
    *   **Midday**: 12:00
    *   **Afternoon**: 16:00
    *   **Evening**: 20:00
*   **Cron Syntax**: `0 8,10,12,16,20 * * *` (At 08:00, 10:00, 12:00, 16:00, and 20:00 daily).

### Logic
1.  **Identify Time Slot**:
    *   Extract the current hour in local timezone (**Europe/Berlin**).
    *   Determine the corresponding label: `morning`, `forenoon`, `midday`, `afternoon`, or `evening`.
2.  **Query Users**:
    *   Query the `users` collection.
    *   **Filters**:
        *   `notifications_enabled` == `true`
        *   `notification_time_slot` == `[current_label]` (e.g., "morning").
3.  **Construct Payload**:
    *   **Title**: "LivaNova Impulse"
    *   **Body**: "Dein täglicher Impuls wartet auf dich!"
    *   **Data**: `{ "route": "home" }`
4.  **Send**:
    *   Batch send to all FCM tokens.

### Prerequisites
1.  **FCM Token**: The app must save the device's Push Token (as an array) to the `users/{uid}/fcm_tokens` field.
2.  **Time Slot Selection**: User selects one of the 5 active slots (or "later"), saved to `notification_time_slot`.

### Code Structure (Concept)
```javascript
// Triggered at 8am, 10am, 12pm, 4pm, and 8pm Berlin time
exports.sendDailyNotifications = functions.pubsub
    .schedule('0 8,10,12,16,20 * * *')
    .timeZone('Europe/Berlin')
    .onRun(async (context) => {
        const hour = new Date().getHours();
        let slot = '';
        
        if (hour === 8) slot = 'morning';
        else if (hour === 10) slot = 'forenoon';
        else if (hour === 12) slot = 'midday';
        else if (hour === 16) slot = 'afternoon';
        else if (hour === 20) slot = 'evening';

        if (!slot) return null;

        const usersSnapshot = await admin.firestore().collection('users')
            .where('notifications_enabled', '==', true)
            .where('notification_time_slot', '==', slot)
            .get();

        const tokens = [];
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.fcm_tokens && Array.isArray(data.fcm_tokens)) {
                tokens.push(...data.fcm_tokens);
            }
        });

        if (tokens.length > 0) {
            const payload = {
                notification: {
                    title: 'LivaNova Impulse',
                    body: 'Dein täglicher Impuls wartет auf dich!',
                },
                data: { click_action: 'FLUTTER_NOTIFICATION_CLICK' }
            };
            return admin.messaging().sendToDevice(tokens, payload);
        }
        return null;
    });
```


