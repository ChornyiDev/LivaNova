import pandas as pd
from google.cloud import firestore
import json

def upload_impulses():
    # Initialize Firestore client
    db = firestore.Client(project="livanora-305c9")
    
    # Read CSV
    csv_path = "Input docs/4 LIVANORA Impulse Example Database.csv"
    df = pd.read_csv(csv_path)
    
    # Process each row
    for index, row in df.iterrows():
        impulse_id = str(row['impulseId'])
        
        # Prepare tags array
        tags = [t.strip() for t in str(row['tags']).split(',')] if pd.notna(row['tags']) else []
        
        # Prepare document data
        doc_data = {
            "sequence": int(row['sequence']),
            "title_short": str(row['titleShort']),
            "title_full": str(row['titleFull']),
            "hook_text": str(row['hookText']).replace('\n', ' '),
            "motivator_text": str(row['motivatorText']).replace('\n', ' '),
            "impulse_long_text": str(row['impulsLongText']).replace('\n', ' '),
            "zones_bridge_text": str(row['zonesBridgeText']),
            "wellbeing_weight": int(row['wellbeingWeight']),
            "tags": tags,
            "zones": {
                "sleep": bool(row['sleepActive']),
                "stress": bool(row['stressActive']),
                "heart": bool(row['herzActive']),
                "inflammation": bool(row['entzuendungActive']),
                "movement": bool(row['bewegungActive'])
            },
            "zone_details": {
                "sleep_text": str(row['sleepDetailText']) if pd.notna(row['sleepDetailText']) else "",
                "stress_text": str(row['stressDetailText']) if pd.notna(row['stressDetailText']) else "",
                "heart_text": str(row['herzDetailText']) if pd.notna(row['herzDetailText']) else "",
                "inflammation_text": str(row['entzuendungDetailText']) if pd.notna(row['entzuendungDetailText']) else "",
                "movement_text": str(row['bewegungDetailText']) if pd.notna(row['bewegungDetailText']) else ""
            },
            "zone_focus_text": str(row['zoneFocusText']) if pd.notna(row['zoneFocusText']) else ""
        }
        
        # Write to Firestore
        print(f"Uploading impulse {impulse_id}: {doc_data['title_short']}...")
        db.collection("impulses").document(impulse_id).set(doc_data)

    print("Upload complete!")

if __name__ == "__main__":
    upload_impulses()
