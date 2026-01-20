const fs = require("fs");
const { execSync } = require("child_process");
const fetch = require("./functions/node_modules/node-fetch");

async function upload() {
  console.log("Getting access token...");
  const token = execSync("gcloud auth print-access-token").toString().trim();
  const projectId = "livanora-305c9";
  const databaseId = "(default)";

  console.log("Reading CSV...");
  const csvData = fs.readFileSync(
    "Input docs/4 LIVANORA Impulse Example Database.csv",
    "utf8",
  );

  const rows = parseFullCsv(csvData);
  console.log(`Parsed ${rows.length - 1} rows.`);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2) continue;

    const data = {
      impulseId: row[0],
      sequence: parseInt(row[1]),
      title_short: row[2],
      title_full: row[3],
      hook_text: (row[4] || "").replace(/\n/g, " ").trim(),
      motivator_text: (row[5] || "").replace(/\n/g, " ").trim(),
      impulse_long_text: (row[6] || "").replace(/\n/g, " ").trim(),
      zones_bridge_text: (row[7] || "").trim(),
      wellbeing_weight: parseInt(row[8] || "0"),
      tags: (row[9] || "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s),
      zones: {
        sleep: row[10] === "true",
        stress: row[11] === "true",
        heart: row[12] === "true",
        inflammation: row[13] === "true",
        movement: row[14] === "true",
      },
      zone_details: {
        sleep_text: row[15] || "",
        stress_text: row[16] || "",
        heart_text: row[17] || "",
        inflammation_text: row[18] || "",
        movement_text: row[19] || "",
      },
      zone_focus_text: row[20] || "",
    };

    const impulseId = data.impulseId;
    const firestoreData = {
      fields: {
        sequence: { integerValue: data.sequence },
        title_short: { stringValue: data.title_short },
        title_full: { stringValue: data.title_full },
        hook_text: { stringValue: data.hook_text },
        motivator_text: { stringValue: data.motivator_text },
        impulse_long_text: { stringValue: data.impulse_long_text },
        zones_bridge_text: { stringValue: data.zones_bridge_text },
        wellbeing_weight: { integerValue: data.wellbeing_weight },
        tags: {
          arrayValue: { values: data.tags.map((t) => ({ stringValue: t })) },
        },
        zones: {
          mapValue: {
            fields: {
              sleep: { booleanValue: data.zones.sleep },
              stress: { booleanValue: data.zones.stress },
              heart: { booleanValue: data.zones.heart },
              inflammation: { booleanValue: data.zones.inflammation },
              movement: { booleanValue: data.zones.movement },
            },
          },
        },
        zone_details: {
          mapValue: {
            fields: {
              sleep_text: { stringValue: data.zone_details.sleep_text },
              stress_text: { stringValue: data.zone_details.stress_text },
              heart_text: { stringValue: data.zone_details.heart_text },
              inflammation_text: {
                stringValue: data.zone_details.inflammation_text,
              },
              movement_text: { stringValue: data.zone_details.movement_text },
            },
          },
        },
        zone_focus_text: { stringValue: data.zone_focus_text },
      },
    };

    console.log(`Uploading ${impulseId}: ${data.title_short}...`);
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/impulses/${impulseId}`;

    const res = await fetch(url + "?currentDocument.exists=false", {
      // This adds if not exists or updates if no condition
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(firestoreData),
    });

    // Patch with no condition updates or creates.
    const finalUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/impulses/${impulseId}`;
    const patchRes = await fetch(finalUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(firestoreData),
    });

    if (!patchRes.ok) {
      const err = await patchRes.text();
      console.error(`Failed to upload ${impulseId}: ${err}`);
    }
  }
  console.log("Done!");
}

function parseFullCsv(text) {
  const rows = [];
  let currentRow = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentCell += '"';
          i++;
        } else {
          // End of quotes
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentCell);
        currentCell = "";
      } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
        if (char === "\r") i++;
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
  }
  if (currentRow.length > 0 || currentCell) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }
  return rows;
}

upload().catch(console.error);
