const { execSync } = require("child_process");
const fetch = require("./functions/node_modules/node-fetch");

async function resetTags() {
  console.log("Getting access token...");
  const token = execSync("gcloud auth print-access-token").toString().trim();
  const projectId = "livanora-305c9";
  const databaseId = "(default)";

  // 1. Delete old predictable tags
  const oldIds = [
    "morgen",
    "alltag",
    "_bergang",
    "hydration",
    "routine",
    "bewegung",
    "aktivierung",
  ];
  for (const id of oldIds) {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/tags/${id}`;
    await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  console.log("Old tags deleted.");

  // 2. Add new tags with Auto-ID (POST request)
  const tags = [
    "Morgen",
    "Alltag",
    "Übergang",
    "Hydration",
    "Routine",
    "Bewegung",
    "Aktivierung",
  ];
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/tags`;

  for (const tagName of tags) {
    const firestoreData = {
      fields: {
        name: { stringValue: tagName },
      },
    };

    console.log(`Adding tag with Auto-ID: ${tagName}...`);

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(firestoreData),
    });

    if (!res.ok) {
      console.error(`Failed to add tag ${tagName}: ${await res.text()}`);
    }
  }

  console.log("Simplified tags uploaded successfully!");
}

resetTags().catch(console.error);
