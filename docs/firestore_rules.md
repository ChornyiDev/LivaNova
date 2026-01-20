# Firestore Security Rules Specification

## Current Production Rules
The following rules have been implemented to ensure data privacy and accessibility for LivaNova.

### Rules Analysis
| Collection | Access Level | Description |
| :--- | :--- | :--- |
| **`impulses`** | Public Read | Everyone can read impulses. No one can write. |
| **`users`** | Private | User can create/read/write/delete only their own document. |
| **`library`** | Private | Sub-collection. Only the parent user has access. |
| **`notifications`** | System/Public | Read/Create allowed for push notification services. |

---

## Active Code (Firestore)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Global Impulses: Public read, No write
    match /impulses/{document} {
      allow create: if false;
      allow read: if true;
      allow write: if false;
      allow delete: if false;
    }

    // Push Notifications Logic (Internal FF)
    match /notifications/{document} {
      allow create: if true;
      allow read: if true;
      allow write: if false;
      allow delete: if false;
    }

    // User's Personal Library
    match /users/{parent}/library/{document} {
      allow create: if request.auth.uid == parent;
      allow read: if request.auth.uid == parent;
      allow write: if request.auth.uid == parent;
      allow delete: if request.auth.uid == parent;
    }

    // Current State Management
    match /users/{parent}/current/{document} {
      allow create: if request.auth.uid == parent;
      allow read: if request.auth.uid == parent;
      allow write: if request.auth.uid == parent;
      allow delete: if request.auth.uid == parent;
    }

    match /scheduled_notifications/{document} {
      allow create: if true;
      allow read: if true;
      allow write: if false;
      allow delete: if false;
    }

    // FlutterFlow Service Access
    match /{document=**} {
      allow read, write: if request.auth.token.email.matches("firebase@flutterflow.io");
    }

    // User Profile Document
    match /users/{document} {
      allow create: if request.auth != null;
      allow read: if request.auth.uid == document;
      allow write: if request.auth.uid == document;
      allow delete: if request.auth.uid == document;
    }
  }
}
```
