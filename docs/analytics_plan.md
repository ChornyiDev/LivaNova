# Analytics Plan for LivaNova

## 1. Key Metrics (KPIs)
To validate the MVP, we will track the following metrics as requested:

1.  **DAU (Daily Active Users)**: Unique users opening the app each day.
2.  **Conversion Rate (Decision Making)**: Percentage of daily users who make a decision ("Accept" or "Not Today").
    *   *Formula*: `(Total 'decision_made' events) / (Total DAU)`
3.  **Retention Rate**: Percentage of users returning on Day 1, Day 7, and Day 30.
4.  **Content Popularity**: Which impulses are accepted most often.

---

## 2. Event Strategy (Custom Events)
Implement these custom events in your FlutterFlow actions:

| Event Name | Parameter | Description |
| :--- | :--- | :--- |
| `impulse_viewed` | `impulse_id` (String) | Triggered when the daily impulse card is shown. |
| `decision_made` | `type` ("accept" / "skip"), `impulse_id` (String) | Triggered when user clicks "Accept" or "Not Today". |
| `library_opened` | - | Triggered when navigating to the Library. |
| `onboarding_complete` | - | Triggered when user finishes the welcome flow. |

---

## 3. Setup Instructions (Firebase & FlutterFlow)

### Step 1: Analytics Account Setup
1.  Go to **analytics.google.com** and create a free Google Analytics 4 (GA4) account.
2.  Go to your **Firebase Console** > **Settings** > **Integrations**.
3.  Find **Google Analytics** and click **Link**.
4.  Select your newly created GA4 account. This links your Firebase project to Google Analytics.

### Step 2: Enable in FlutterFlow
1.  Open your project in **FlutterFlow**.
2.  Go to **Settings & Integrations** > **Firebase**.
3.  Ensure "Enable Google Analytics" is checked.
4.  Deploy your Firestore rules and Indexes if prompted.

### Step 3: View Data
*   **Firebase Console**: Go to "Analytics" > "Dashboard" for a quick view of users and retention.
*   **Google Analytics Dashboard**: Use the GA4 interface for granular analysis (e.g., creating the "Conversion Rate" exploration using your custom events).

---

## 4. Integration Note
FlutterFlow automatically tracks screen views (`screen_view`). You only need to manually add the **Backend Call -> Analytics -> Log Event** action to your buttons ("Accept", "Not Today") to track the custom behavior described in Section 2.
