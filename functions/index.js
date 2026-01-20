const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Triggered at 8am, 10am, 12pm, 4pm, and 8pm Berlin time.
 * Matches the user selection slots in the LIVANORA app.
 */
exports.sendDailyNotifications = onSchedule(
  {
    schedule: "0 8,10,12,16,20 * * *",
    timeZone: "Europe/Berlin",
  },
  async (event) => {
    // Determine the current hour in Berlin time
    const now = new Date();
    const options = {
      timeZone: "Europe/Berlin",
      hour: "numeric",
      hour12: false,
    };
    const formatter = new Intl.DateTimeFormat([], options);
    const hour = parseInt(formatter.format(now), 10);

    let slot = "";

    // Map hour to slot name
    if (hour === 8) slot = "morning";
    else if (hour === 10) slot = "forenoon";
    else if (hour === 12) slot = "midday";
    else if (hour === 16) slot = "afternoon";
    else if (hour === 20) slot = "evening";

    if (!slot) {
      console.log(
        `No slot defined for hour ${hour}` +
          ` (Server Time: ${now.toISOString()}). Skipping.`,
      );
      return null;
    }

    console.log(`Processing notifications for slot: ${slot}`);

    const usersSnapshot = await admin
      .firestore()
      .collection("users")
      .where("notifications_enabled", "==", true)
      .where("notification_time_slot", "==", slot)
      .get();

    // Collect unique tokens and track which user has which token
    const tokenToUserMap = new Map();
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.fcm_tokens && Array.isArray(data.fcm_tokens)) {
        data.fcm_tokens.forEach((token) => {
          if (token && token.trim()) {
            tokenToUserMap.set(token, doc.id);
          }
        });
      }
    });

    const tokens = Array.from(tokenToUserMap.keys());

    if (tokens.length === 0) {
      console.log("No recipient tokens found.");
      return null;
    }

    console.log(
      `Found ${tokens.length} unique tokens to send notifications to.`,
    );

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

    // Firebase has a limit of 500 tokens per request
    const BATCH_SIZE = 500;
    const batches = [];
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      batches.push(tokens.slice(i, i + BATCH_SIZE));
    }

    let totalSuccess = 0;
    let totalFailure = 0;
    const invalidTokens = [];

    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(
        `Sending batch ${i + 1}/${batches.length} ` +
          `with ${batch.length} tokens`,
      );

      try {
        const response = await admin.messaging().sendToDevice(batch, payload);
        totalSuccess += response.successCount;
        totalFailure += response.failureCount;

        // Collect invalid tokens for cleanup
        if (response.results) {
          response.results.forEach((result, index) => {
            if (result.error) {
              const errorCode = result.error.code;
              // These error codes indicate invalid/expired tokens
              if (
                errorCode === "messaging/invalid-registration-token" ||
                errorCode === "messaging/registration-token-not-registered"
              ) {
                invalidTokens.push(batch[index]);
              }
            }
          });
        }
      } catch (error) {
        console.error(`Error sending batch ${i + 1}:`, error);
        totalFailure += batch.length;
      }
    }

    console.log(
      `Total sent: ${totalSuccess} successful, ${totalFailure} failed.`,
    );

    // Cleanup invalid tokens
    if (invalidTokens.length > 0) {
      console.log(`Cleaning up ${invalidTokens.length} invalid tokens...`);

      const batch = admin.firestore().batch();
      let updateCount = 0;

      for (const token of invalidTokens) {
        const userId = tokenToUserMap.get(token);
        if (userId) {
          const userRef = admin.firestore().collection("users").doc(userId);
          batch.update(userRef, {
            fcm_tokens: admin.firestore.FieldValue.arrayRemove(token),
          });
          updateCount++;
        }
      }

      if (updateCount > 0) {
        try {
          await batch.commit();
          console.log(`Cleaned up ${updateCount} invalid tokens.`);
        } catch (error) {
          console.error("Error cleaning up invalid tokens:", error);
        }
      }
    }

    return null;
  },
);
