const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Triggered at 8am, 10am, 12pm, 4pm, and 8pm Berlin time.
 * Matches the user selection slots in the LIVANORA app.
 */
exports.sendDailyNotifications = functions.pubsub
  .schedule("0 8,10,12,16,20 * * *")
  .timeZone("Europe/Berlin")
  .onRun(async (context) => {
    const hour = new Date().getHours();
    let slot = "";

    // Map hour to slot name
    if (hour === 8) slot = "morning";
    else if (hour === 10) slot = "forenoon";
    else if (hour === 12) slot = "midday";
    else if (hour === 16) slot = "afternoon";
    else if (hour === 20) slot = "evening";

    if (!slot) {
      console.log(`No slot defined for hour ${hour}. Skipping.`);
      return null;
    }

    console.log(`Processing notifications for slot: ${slot}`);

    const usersSnapshot = await admin
      .firestore()
      .collection("users")
      .where("notifications_enabled", "==", true)
      .where("notification_time_slot", "==", slot)
      .get();

    const tokens = [];
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.fcm_tokens && Array.isArray(data.fcm_tokens)) {
        tokens.push(...data.fcm_tokens);
      }
    });

    if (tokens.length === 0) {
      console.log("No recipient tokens found.");
      return null;
    }

    const payload = {
      notification: {
        title: "LIVANORA Impulse",
        body: "Dein täglicher Impuls wartet auf dich!",
      },
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        route: "home",
      },
    };

    // Batch sending to devices
    try {
      const response = await admin.messaging().sendToDevice(tokens, payload);
      console.log(`Sent ${response.successCount} notifications successfully.`);

      // Optional: Cleanup invalid tokens
      if (response.failureCount > 0) {
        console.log(`Failed to send ${response.failureCount} notifications.`);
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
    }

    return null;
  });
