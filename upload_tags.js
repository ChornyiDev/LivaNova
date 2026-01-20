const { execSync } = require("child_process");
const fetch = require("./functions/node_modules/node-fetch");

async function uploadTags() {
  console.log("Getting access token...");
  const token = execSync("gcloud auth print-access-token").toString().trim();
  const projectId = "livanora-305c9";
  const databaseId = "(default)";

  // Unique tags from CSV
  const tags = [
    "Morgen",
    "Alltag",
    "Übergang",
    "Hydration",
    "Routine",
    "Bewegung",
    "Aktivierung",
  ];

  console.log(`Starting upload of ${tags.length} tags...`);

  for (const tagName of tags) {
    const docId = tagName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/tags/${docId}`;

    const firestoreData = {
      fields: {
        name: { stringValue: tagName },
        display_name: { stringValue: tagName },
      },
    };

    console.log(`Uploading tag: ${tagName} (ID: ${docId})...`);

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(firestoreData),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Failed to upload tag ${tagName}: ${err}`);
    }
  }

  console.log("Tags upload complete!");
}

uploadTags().catch(console.error);
