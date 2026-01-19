# LivaNova Project Documentation

Welcome to the technical documentation for the LivaNova MVP. This project is built using FlutterFlow and Firebase.

## Documentation Index

### 1. [Database Schema](./docs/database_schema.md)
*   **Purpose**: Defines the Cloud Firestore structure.
*   **Contents**: `users` and `impulses` collections, field definitions, and data types.

### 2. [App Logic](./docs/app_logic.md)
*   **Purpose**: Describes the core functionality and user flow.
*   **Contents**:
    *   Home screen logic (Show/Hide Impulse).
    *   Decision logic ("Accept" vs "Not Today").
    *   Streak calculation and Library filtering.

### 3. [Cloud Functions](./docs/cloud_functions.md)
*   **Purpose**: Specifications for backend automation (Notifications).
*   **Contents**: Design of the `sendDailyNotifications` function using Firebase Cloud Messaging.

### 4. [Analytics Plan](./docs/analytics_plan.md)
*   **Purpose**: Strategy for tracking KPIs and setup instructions.
*   **Contents**: Key metrics (DAU, Retention), Custom Events, and Google Analytics integration guide.

---

## Getting Started
For the developer:
1.  **Initialize Firebase**: Set up the collections as described in the [Database Schema](./docs/database_schema.md).
2.  **Import Data**: Use the CSV provided in `Input docs` to populate the `impulses` collection.
3.  **Implement Logic**: Follow the [App Logic](./docs/app_logic.md) to build the Home and Decision flows in FlutterFlow.
4.  **Connect Analytics**: Enable GA4 as per the [Analytics Plan](./docs/analytics_plan.md).
