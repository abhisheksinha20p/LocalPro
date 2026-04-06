# 📦 Firebase Database Schema (Firestore) — LocalPro v2.0
## Hyperlocal Service Marketplace
**Version:** 2.0 (Professional Review)
**Last Updated:** April 2026

---

## Overview

This schema is optimized for:
- **Scalability** — NoSQL document structure with denormalization where needed
- **Real-time updates** — Chat, booking status, provider availability
- **Geo-queries** — GeoHash stored on all location fields (required for GeoFlutterFire Plus)
- **Security** — Role-based Firestore rules; sensitive data in private Storage
- **Offline support** — Flutter Hive cache layer for profile and booking history

---

## 📁 Collections

---

### `/users/{userId}`

```
id:               string    (Firebase Auth UID)
name:             string
phone:            string    (E.164 format: +919876543210)
role:             string    ENUM: "customer" | "provider" | "admin"
profile_image:    string    (Firebase Storage URL)
fcm_token:        string    (updated on every login — required for push notifications)
location: {
  lat:            number
  lng:            number
  geoHash:        string    ← REQUIRED for GeoFlutterFire geo-queries
  address:        string    (human-readable: "Boring Road, Patna")
}
is_active:        boolean   (false = soft-deleted; excluded from all queries)
created_at:       timestamp
updated_at:       timestamp
```

> **Note:** `fcm_token` must be refreshed on every app launch via `FirebaseMessaging.instance.getToken()` and written back to Firestore. Stale tokens cause missed push notifications.

---

### `/providers/{providerId}`

```
id:               string    (same as userId for the provider)
user_id:          string    (ref: /users/{userId})
category:         string    ENUM validated via Cloud Function
                            e.g. "electrician" | "plumber" | "carpenter" |
                                 "tutor" | "cleaner" | "ac_technician" | "painter"
sub_categories:   string[]  e.g. ["AC installation", "wiring", "switchboard repair"]
description:      string    (50–500 chars)
price_range: {              ← Changed from plain string to structured object
  min:            number    (in INR)
  max:            number    (in INR)
  unit:           string    ENUM: "per_job" | "per_hour"
}
rating:           number    (1.0–5.0, float — recomputed by Cloud Function on every review)
total_reviews:    number    (incremented by Cloud Function)
total_jobs:       number    (incremented on booking completion)
is_verified:      boolean
verified_at:      timestamp (null until verified)
verification_doc: string    (Firebase Storage private URL — admin-read only)
verification_notes: string  (admin notes on verification decision)
availability:     boolean   (provider's live on/off toggle)
work_radius_km:   number    (5–50)
location: {                 ← Duplicate of user location for geo-queries on providers
  lat:            number
  lng:            number
  geoHash:        string    ← REQUIRED for GeoFlutterFire
  address:        string
}
is_active:        boolean   (false = soft-deleted)
created_at:       timestamp
updated_at:       timestamp
```

> **Why duplicate location?** Firestore geo-queries run on the `/providers` collection directly. Joining with `/users` is not possible in a single geo-query, so location is intentionally denormalized here.

---

### `/bookings/{bookingId}`

```
id:               string
customer_id:      string    (ref: /users)
provider_id:      string    (ref: /providers)
status:           string    ENUM:
                            "pending"     — created, awaiting provider response
                            "accepted"    — provider confirmed
                            "in_progress" — provider marked arrival / started
                            "completed"   — provider marked done
                            "cancelled"   — cancelled by customer or provider
                            "disputed"    — raised by either party post-acceptance
date_time:        timestamp (requested service date/time)
address:          string    (job site address — may differ from user's home address)
notes:            string    (optional, max 300 chars)
price: {
  quoted:         number    (provider's price estimate at booking time)
  final:          number    (actual price at completion — may differ)
  currency:       string    default: "INR"
}
cancelled_by:     string    (userId of the cancelling party)
cancel_reason:    string    (required when cancelling)
dispute_reason:   string    (set when status = "disputed")
dispute_evidence: string[]  (Storage URLs of evidence images)
review_id:        string    (ref: /reviews — populated after review is submitted)
created_at:       timestamp
updated_at:       timestamp
```

#### Booking Status Transition Rules
```
pending     → accepted    (provider action only)
pending     → cancelled   (customer or provider)
accepted    → in_progress (provider action only)
accepted    → cancelled   (either party, with reason)
in_progress → completed   (provider action only)
in_progress → disputed    (either party)
completed   → [terminal]
cancelled   → [terminal]
```

> Status transitions are enforced in Cloud Functions. Client-side PATCH requests that violate the state machine are rejected with `400 INVALID_STATUS_TRANSITION`.

---

### `/chats/{chatId}`

```
id:               string
participants:     string[]  (always exactly 2: [customerId, providerId])
booking_id:       string    (ref: /bookings — chat is always linked to a booking)
last_message:     string    (preview text for chat list)
last_message_by:  string    (userId of last sender)
last_updated:     timestamp
is_archived:      boolean   (hidden from chat list but not deleted)
```

---

### `/chats/{chatId}/messages/{messageId}`

```
id:               string
sender_id:        string    (ref: /users)
message:          string    (text content; empty string if type = "image")
type:             string    ENUM: "text" | "image" | "location"
media_url:        string    (Firebase Storage URL — only for type = "image")
location: {                 (only for type = "location")
  lat:            number
  lng:            number
}
is_read:          boolean   (updated when recipient opens chat)
timestamp:        timestamp
```

> **Messages are immutable.** No update or delete rules are set in security rules. Reported messages are flagged via a separate `/reports` collection (Phase 3).

---

### `/reviews/{reviewId}`

```
id:               string
booking_id:       string    (ref: /bookings — unique constraint enforced via Cloud Function)
customer_id:      string    (ref: /users)
provider_id:      string    (ref: /providers)
rating:           number    (integer 1–5)
comment:          string    (optional, max 500 chars)
provider_reply:   string    (optional — provider response to the review)
provider_reply_at: timestamp
created_at:       timestamp
```

> **Uniqueness:** A Cloud Function checks that no review already exists for the given `booking_id` before allowing creation. Duplicate reviews are rejected with `409 REVIEW_ALREADY_EXISTS`.

---

### `/categories/{categoryId}` ← NEW

```
id:               string
name:             string    (display name: "Electrician")
slug:             string    (machine name: "electrician")
icon_url:         string    (Firebase Storage URL or asset path)
sub_categories:   string[]  (e.g., ["Wiring", "AC Installation", "Switchboard"])
is_active:        boolean
sort_order:       number    (controls display order on home screen)
```

> Categories are managed by admin only. Flutter fetches this collection once on app launch and caches locally with Hive.

---

### `/notifications/{notificationId}` ← NEW

```
id:               string
user_id:          string    (ref: /users — notification recipient)
title:            string
body:             string
type:             string    ENUM: "booking_update" | "chat" | "promo" | "system"
is_read:          boolean
payload: {                  (deep-link navigation data)
  screen:         string    e.g. "booking_detail"
  entity_id:      string    e.g. bookingId or chatId
}
created_at:       timestamp
```

> FCM sends the push. This collection stores the in-app notification history so users can view past notifications in the Notification Center screen.

---

## 🔐 Security Rules (Production-Grade)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ─── Helper functions ─────────────────────────────────────────────────────
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isProvider() {
      return getUserData().role == 'provider';
    }

    function isAdmin() {
      return getUserData().role == 'admin';
    }

    function isParticipant(chatId) {
      return request.auth.uid in
        get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
    }

    function isBookingParty(booking) {
      return request.auth.uid == booking.data.customer_id ||
             request.auth.uid == booking.data.provider_id;
    }

    // ─── Users ────────────────────────────────────────────────────────────────
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if false; // Use is_active: false for soft-delete
    }

    // ─── Providers ────────────────────────────────────────────────────────────
    match /providers/{providerId} {
      allow read: if true; // Public: needed for unauthenticated discovery
      allow create: if isAuthenticated() && isProvider() && isOwner(providerId);
      allow update: if isAuthenticated() &&
        (resource.data.user_id == request.auth.uid || isAdmin());
      allow delete: if false;
    }

    // ─── Bookings ─────────────────────────────────────────────────────────────
    match /bookings/{bookingId} {
      allow read: if isAuthenticated() && (isBookingParty(resource) || isAdmin());
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (isBookingParty(resource) || isAdmin());
      allow delete: if false;
    }

    // ─── Chats ────────────────────────────────────────────────────────────────
    match /chats/{chatId} {
      allow read, write: if isAuthenticated() && isParticipant(chatId);

      match /messages/{messageId} {
        allow read: if isAuthenticated() && isParticipant(chatId);
        allow create: if isAuthenticated() && isParticipant(chatId);
        allow update, delete: if false; // Messages are immutable
      }
    }

    // ─── Reviews ──────────────────────────────────────────────────────────────
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if isAuthenticated(); // Uniqueness enforced by Cloud Function
      allow update: if isAuthenticated() &&
        resource.data.provider_id == request.auth.uid &&
        request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['provider_reply', 'provider_reply_at']); // Provider can only add reply
      allow delete: if isAdmin();
    }

    // ─── Categories ───────────────────────────────────────────────────────────
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // ─── Notifications ────────────────────────────────────────────────────────
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && resource.data.user_id == request.auth.uid;
      allow create: if false; // Written only by Cloud Functions
      allow update: if isAuthenticated() &&
        resource.data.user_id == request.auth.uid &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['is_read']);
      allow delete: if false;
    }
  }
}
```

---

## ⚡ Indexing

Composite indexes to create in Firebase Console (or `firestore.indexes.json`):

```json
{
  "indexes": [
    {
      "collectionGroup": "bookings",
      "fields": [
        { "fieldPath": "customer_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "fields": [
        { "fieldPath": "provider_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "providers",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "rating", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "providers",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "availability", "order": "ASCENDING" },
        { "fieldPath": "location.geoHash", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "reviews",
      "fields": [
        { "fieldPath": "provider_id", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "is_read", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "chats",
      "fields": [
        { "fieldPath": "participants", "arrayConfig": "CONTAINS" },
        { "fieldPath": "last_updated", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## ☁️ Required Cloud Functions

| Function | Trigger | Action |
|----------|---------|--------|
| `onBookingCreated` | Firestore: `/bookings` write | Notify provider via FCM; create notification doc |
| `onBookingStatusChanged` | Firestore: `/bookings` update | Notify customer; update provider `total_jobs` on completion |
| `onReviewCreated` | Firestore: `/reviews` write | Recalculate provider `rating` + `total_reviews` |
| `onMessageCreated` | Firestore: `/chats/{id}/messages` write | FCM push for offline recipient; update `last_message` on chat doc |
| `onProviderVerified` | Firestore: `/providers` update | Notify provider of verification result |
| `validateReviewUniqueness` | Firestore: `/reviews` onCreate | Reject if review for this `booking_id` already exists |
| `validateBookingTransition` | Firestore: `/bookings` onUpdate | Reject invalid status transitions |
| `cleanupExpiredBookings` | Scheduled (daily, 2 AM IST) | Auto-cancel pending bookings older than 48 hours |
| `generateEarningsSummary` | Scheduled (Monday, 8 AM IST) | Write weekly earnings summary to provider doc |

---

## 🚀 Storage Structure (Firebase Storage)

```
/profile_images/{userId}.jpg           (public read via Storage rules)
/provider_docs/{providerId}/id_proof.jpg  (private — admin-read only)
/chat_images/{chatId}/{messageId}.jpg  (read: chat participants only)
/dispute_evidence/{bookingId}/{n}.jpg  (read: booking parties + admin)
/category_icons/{categorySlug}.png     (public read)
```

---

## ✅ Flutter Integration Checklist

- [ ] `geoflutterfire_plus` integrated for provider geo-queries
- [ ] `GeoPoint` and `geoHash` written on every location update
- [ ] `fcm_token` refreshed on every login in `AuthNotifier`
- [ ] Firestore `StreamBuilder` used for: chat messages, booking status, provider availability
- [ ] `Hive` boxes defined for: user profile, booking list, categories (offline cache)
- [ ] Firebase Emulator Suite configured for local development
- [ ] `firestore.indexes.json` committed to version control
- [ ] `firestore.rules` committed to version control and deployed via Firebase CLI

---

*Schema Version 2.0 | Last Updated: April 2026*
