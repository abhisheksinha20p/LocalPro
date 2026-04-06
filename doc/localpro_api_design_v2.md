# 🌐 API Design — LocalPro v2.1
## Hyperlocal Service Marketplace
**Version:** 2.1 (React Native + Expo)
**Last Updated:** April 2026

---

## Overview

REST-style API over Firebase Cloud Functions (Node.js 20).
All endpoints are versioned under `/api/v1/`.

```
Base URL:     https://api.localpro.com/api/v1
Auth:         Bearer <Firebase ID Token> in Authorization header
Content-Type: application/json
Rate Limit:   100 requests/min per user (10/min for OTP endpoints)
Client:       React Native (Expo) via Axios + React Query
```

**Note:** React Native clients use the same API endpoints as web clients. Expo provides native HTTP and socket support via standard REST protocols.

---

## Standard Response Envelopes

All endpoints return one of these two shapes. Never return raw objects.

### Success
```json
{
  "success": true,
  "data": { },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "has_next": true
  }
}
```
> `meta` is only present on paginated list endpoints.

### Error
```json
{
  "success": false,
  "error": {
    "code": "PROVIDER_NOT_FOUND",
    "message": "No provider found with the given ID.",
    "details": { }
  },
  "timestamp": "2026-04-06T10:30:00Z"
}
```

### Error Codes Reference

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | Request body/query failed validation |
| `INVALID_STATUS_TRANSITION` | 400 | Booking status change not permitted |
| `REVIEW_ALREADY_EXISTS` | 409 | Review for this booking already submitted |
| `BOOKING_NOT_COMPLETED` | 400 | Review attempted on non-completed booking |
| `UNAUTHORIZED` | 401 | Missing or expired token |
| `FORBIDDEN` | 403 | Token valid but insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server-side failure |

---

## HTTP Status Codes

```
200 OK           — Successful GET, PUT, PATCH
201 Created      — Successful POST (resource created)
204 No Content   — Successful DELETE or action with no body
400 Bad Request  — Validation or business rule failure
401 Unauthorized — Missing or invalid token
403 Forbidden    — Valid token, insufficient role
404 Not Found    — Resource not found
409 Conflict     — Duplicate resource (e.g. review already exists)
429 Too Many Requests — Rate limit exceeded
500 Server Error — Unexpected server failure
```

---

## Authentication Header

```
Authorization: Bearer <firebase_id_token>
```

Tokens expire after **1 hour**. Use the refresh endpoint to get a new token without re-entering OTP.

---

## 🔐 1. Authentication

### POST `/auth/send-otp`
Send a one-time password to the given phone number.

**Rate limit:** 5 OTPs per phone number per hour.

```json
// Request
{
  "phone": "+919876543210"   // E.164 format — required
}

// Response 200
{
  "success": true,
  "data": {
    "message": "OTP sent successfully.",
    "expires_in": 300         // seconds
  }
}
```

---

### POST `/auth/verify-otp`
Verify the OTP and receive auth tokens.

```json
// Request
{
  "phone": "+919876543210",
  "otp": "123456"
}

// Response 200
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",           // Firebase ID token (1-hour expiry)
    "refresh_token": "AMf-vBx...",    // 30-day refresh token
    "user": {
      "id": "uid_abc123",
      "name": "Rahul Kumar",
      "role": "customer",             // "customer" | "provider" | "admin"
      "is_new_user": true             // true = trigger onboarding flow in app
    }
  }
}
```

---

### POST `/auth/refresh`
Exchange a refresh token for a new ID token.

```json
// Request
{
  "refresh_token": "AMf-vBx..."
}

// Response 200
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "refresh_token": "AMf-vBy..."
  }
}
```

---

### POST `/auth/logout`
Revoke the current device's FCM token (clears push notifications for this device).

```json
// Request — no body required (uses Authorization header)

// Response 204 No Content
```

---

## 👤 2. Users

### GET `/users/me`
Get the authenticated user's profile.

```json
// Response 200
{
  "success": true,
  "data": {
    "id": "uid_abc123",
    "name": "Rahul Kumar",
    "phone": "+919876543210",
    "role": "customer",
    "profile_image": "https://storage.googleapis.com/...",
    "location": {
      "lat": 25.5941,
      "lng": 85.1376,
      "address": "Boring Road, Patna, Bihar"
    }
  }
}
```

---

### PUT `/users/me`
Update the authenticated user's profile.

```json
// Request
{
  "name": "Rahul Kumar",
  "location": {
    "lat": 25.5941,
    "lng": 85.1376,
    "address": "Boring Road, Patna, Bihar"
  },
  "fcm_token": "fzH9..."   // Always send on app launch
}

// Response 200
{
  "success": true,
  "data": { /* updated user object */ }
}
```

---

### POST `/users/me/photo`
Upload a profile photo. Uses `multipart/form-data`.

```
Content-Type: multipart/form-data
Field:        photo  (image/jpeg | image/png, max 5 MB)

// Response 200
{
  "success": true,
  "data": {
    "profile_image": "https://storage.googleapis.com/..."
  }
}
```

---

### DELETE `/users/me`
Request account deletion (soft-delete: sets `is_active: false`). Compliant with DPDP Act.

```json
// Response 204 No Content
```

---

## 🧑‍🔧 3. Providers

### GET `/providers`
Discover nearby providers. At least one of `category` or `lat+lng` is required.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | string | — | Filter by category slug (e.g. `electrician`) |
| `lat` | number | — | User's latitude (required for geo-search) |
| `lng` | number | — | User's longitude (required for geo-search) |
| `radius_km` | number | `10` | Search radius (max: 50) |
| `min_rating` | number | `0` | Minimum rating filter |
| `available` | boolean | `true` | Only show currently available providers |
| `sort` | string | `distance` | `rating` \| `distance` \| `price_asc` \| `price_desc` |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Results per page (max: 50) |

```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": "prov_xyz",
      "name": "Ramesh Electricals",
      "category": "electrician",
      "sub_categories": ["wiring", "AC installation"],
      "rating": 4.7,
      "total_reviews": 38,
      "distance_km": 2.4,
      "price_range": { "min": 200, "max": 800, "unit": "per_job" },
      "is_verified": true,
      "availability": true,
      "profile_image": "https://..."
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 47, "has_next": true }
}
```

---

### GET `/providers/{id}`
Get a single provider's full profile.

```json
// Response 200
{
  "success": true,
  "data": {
    "id": "prov_xyz",
    "name": "Ramesh Electricals",
    "category": "electrician",
    "sub_categories": ["wiring", "AC installation", "switchboard"],
    "description": "10 years of experience. Available 7 days a week.",
    "rating": 4.7,
    "total_reviews": 38,
    "total_jobs": 112,
    "price_range": { "min": 200, "max": 800, "unit": "per_job" },
    "work_radius_km": 15,
    "is_verified": true,
    "availability": true,
    "profile_image": "https://...",
    "location": { "address": "Kankarbagh, Patna" },
    "recent_reviews": [ /* top 3 review objects */ ]
  }
}
```

---

### POST `/providers`
Register the authenticated user as a provider (role must be `provider`).

```json
// Request
{
  "category": "electrician",
  "sub_categories": ["wiring", "AC installation"],
  "description": "10 years of experience. Available 7 days a week.",
  "price_range": { "min": 200, "max": 800, "unit": "per_job" },
  "work_radius_km": 15
}

// Response 201
{
  "success": true,
  "data": { /* created provider object */ }
}
```

---

### PUT `/providers/{id}`
Update provider profile. Only the owning provider or admin can update.

```json
// Request (all fields optional)
{
  "sub_categories": ["wiring", "panel repair"],
  "description": "Updated description.",
  "price_range": { "min": 300, "max": 1000, "unit": "per_job" },
  "work_radius_km": 20
}
```

---

### PATCH `/providers/{id}/availability`
Toggle availability (quick action, separate from full profile update).

```json
// Request
{ "availability": false }

// Response 200
{
  "success": true,
  "data": { "availability": false, "updated_at": "2026-04-06T08:00:00Z" }
}
```

---

### POST `/providers/{id}/photo`
Upload provider profile photo. `multipart/form-data`, same rules as user photo.

---

### POST `/providers/{id}/verification-doc` ← Admin-reviewed
Upload ID proof for verified badge.

```
Content-Type: multipart/form-data
Field:        document  (image/jpeg | image/png | application/pdf, max 10 MB)

// Response 200
{
  "success": true,
  "data": { "message": "Document submitted for review. Allow 1–2 business days." }
}
```

---

## 📅 4. Bookings

### POST `/bookings`
Create a new booking request.

```json
// Request
{
  "provider_id": "prov_xyz",
  "date_time": "2026-04-10T10:00:00Z",
  "address": "Flat 3B, Gandhi Maidan, Patna",
  "notes": "Please bring your own tools."   // optional, max 300 chars
}

// Response 201
{
  "success": true,
  "data": {
    "id": "book_abc",
    "status": "pending",
    "provider": { /* provider summary */ },
    "date_time": "2026-04-10T10:00:00Z",
    "address": "Flat 3B, Gandhi Maidan, Patna",
    "created_at": "2026-04-06T09:00:00Z"
  }
}
```

---

### GET `/bookings`
List bookings for the authenticated user (filtered by their role automatically).

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | — | Filter by status |
| `page` | number | `1` | |
| `limit` | number | `20` | Max: 50 |

---

### GET `/bookings/{id}`
Get full detail of a single booking. Only accessible by the customer, provider, or admin.

---

### PATCH `/bookings/{id}/status`
Update the booking status. Business rules enforced server-side.

```json
// Request
{
  "status": "accepted",
  "cancel_reason": "Emergency came up"   // Required only when status = "cancelled"
}
```

**Permitted transitions per role:**

| From | To | Who |
|------|----|-----|
| pending | accepted | Provider |
| pending | cancelled | Customer or Provider |
| accepted | in_progress | Provider |
| accepted | cancelled | Customer or Provider (reason required) |
| in_progress | completed | Provider |
| in_progress | disputed | Customer or Provider |

---

### POST `/bookings/{id}/dispute`
Raise a dispute on an in-progress or completed booking.

```json
// Request
{
  "reason": "Provider did not complete the work but marked it done.",
  "evidence_urls": [
    "https://storage.googleapis.com/dispute_evidence/..."
  ]
}

// Response 201
{
  "success": true,
  "data": { "message": "Dispute raised. Our team will review within 24 hours." }
}
```

---

## 💬 5. Chat

### POST `/chats`
Create a new chat thread (linked to a booking).

```json
// Request
{
  "provider_id": "prov_xyz",
  "booking_id": "book_abc"
}

// Response 201
{
  "success": true,
  "data": { "chat_id": "chat_123" }
}
```

> If a chat for this `booking_id` already exists, returns the existing chat ID with `200 OK`.

---

### GET `/chats`
List all chats for the authenticated user, sorted by `last_updated` descending.

```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": "chat_123",
      "booking_id": "book_abc",
      "other_participant": {
        "id": "uid_xyz",
        "name": "Ramesh Electricals",
        "profile_image": "https://..."
      },
      "last_message": "I'll arrive by 10 AM",
      "last_message_by": "prov_xyz",
      "unread_count": 2,
      "last_updated": "2026-04-06T08:45:00Z"
    }
  ]
}
```

---

### GET `/chats/{chatId}/messages`
Get messages for a chat. Cursor-based pagination (newest first).

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `before` | timestamp | Cursor: fetch messages before this timestamp |
| `limit` | number | Default 50, max 100 |

```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": "msg_001",
      "sender_id": "uid_customer",
      "message": "Hello, are you available tomorrow?",
      "type": "text",
      "is_read": true,
      "timestamp": "2026-04-06T08:30:00Z"
    },
    {
      "id": "msg_002",
      "sender_id": "uid_provider",
      "message": "",
      "type": "image",
      "media_url": "https://storage.googleapis.com/...",
      "is_read": false,
      "timestamp": "2026-04-06T08:32:00Z"
    }
  ],
  "meta": { "has_more": true, "oldest_timestamp": "2026-04-06T08:30:00Z" }
}
```

> **Real-time delivery:** Use Firestore `StreamBuilder` in Flutter for live chat. This REST endpoint is for loading message history only.

---

### POST `/chats/{chatId}/messages`
Send a message.

```json
// Request (text)
{
  "message": "I'll be there by 10 AM.",
  "type": "text"
}

// Request (image)
{
  "message": "",
  "type": "image",
  "media_url": "https://storage.googleapis.com/..."
  // Upload image to Storage first, then send the URL
}

// Response 201
{
  "success": true,
  "data": { "message_id": "msg_003", "timestamp": "2026-04-06T09:00:00Z" }
}
```

---

### PATCH `/chats/{chatId}/read`
Mark all messages in this chat as read for the authenticated user.

```json
// Response 204 No Content
```

---

## ⭐ 6. Reviews

### POST `/reviews`
Submit a review for a completed booking.

**Validation rules:**
- Booking must have `status = "completed"`
- No existing review for this `booking_id`
- Only the customer of the booking can submit

```json
// Request
{
  "booking_id": "book_abc",
  "rating": 5,
  "comment": "Excellent work, arrived on time and cleaned up after."
}

// Response 201
{
  "success": true,
  "data": { "review_id": "rev_xyz" }
}

// Error (duplicate)
// 409 { "error": { "code": "REVIEW_ALREADY_EXISTS", ... } }

// Error (booking not completed)
// 400 { "error": { "code": "BOOKING_NOT_COMPLETED", ... } }
```

---

### GET `/providers/{id}/reviews`
Get reviews for a provider.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sort` | string | `recent` | `recent` \| `highest` \| `lowest` |
| `page` | number | `1` | |
| `limit` | number | `10` | Max: 50 |

```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": "rev_xyz",
      "customer": { "name": "Rahul K.", "profile_image": "https://..." },
      "rating": 5,
      "comment": "Excellent work!",
      "provider_reply": "Thank you!",
      "created_at": "2026-04-05T14:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 38, "has_next": true }
}
```

---

### POST `/reviews/{id}/reply`
Provider replies to a review. Only the provider of the reviewed booking can call this.

```json
// Request
{
  "reply": "Thank you for your kind words! Happy to help again."
}

// Response 200
{
  "success": true,
  "data": { "provider_reply": "Thank you for your kind words! Happy to help again." }
}
```

---

## 🔔 7. Notifications

### GET `/notifications`
Get notifications for the authenticated user.

**Query Parameters:** `page`, `limit`, `unread_only` (boolean)

```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": "notif_001",
      "title": "Booking Accepted",
      "body": "Ramesh Electricals accepted your booking for Apr 10.",
      "type": "booking_update",
      "is_read": false,
      "payload": { "screen": "booking_detail", "entity_id": "book_abc" },
      "created_at": "2026-04-06T09:05:00Z"
    }
  ],
  "meta": { "unread_count": 3 }
}
```

---

### PATCH `/notifications/{id}/read`
Mark a single notification as read.

```json
// Response 204 No Content
```

---

### PATCH `/notifications/read-all`
Mark all notifications as read for the authenticated user.

```json
// Response 204 No Content
```

---

## 🔑 8. Admin (Role: admin only)

All admin endpoints require a valid token with `role = "admin"`. Non-admin tokens receive `403 FORBIDDEN`.

### GET `/admin/providers/pending`
List providers awaiting verification.

### PATCH `/admin/providers/{id}/verify`
```json
// Request
{
  "is_verified": true,
  "notes": "Aadhaar card verified successfully."
}
```

### GET `/admin/bookings/disputes`
List all active disputed bookings.

### PATCH `/admin/bookings/{id}/resolve`
```json
// Request
{
  "resolution": "Refund issued to customer.",
  "status": "cancelled"
}
```

### GET `/admin/users`
```
Query: search (string), role, page, limit
```

### PATCH `/admin/users/{id}/deactivate`
Soft-delete a user (`is_active: false`).

### GET `/admin/analytics`
```json
// Response 200
{
  "success": true,
  "data": {
    "dau": 452,
    "mau": 3840,
    "bookings_today": 38,
    "bookings_this_month": 1140,
    "revenue_this_month_inr": 54720,
    "new_users_this_week": 87,
    "new_providers_this_week": 12,
    "top_categories": [
      { "category": "electrician", "bookings": 320 },
      { "category": "plumber", "bookings": 210 }
    ]
  }
}
```

### POST `/admin/notifications/broadcast`
Send a push notification to all users or a filtered segment.

```json
// Request
{
  "title": "Special Offer!",
  "body": "Get 20% off your next booking this weekend.",
  "target": "all",          // "all" | "customers" | "providers"
  "deep_link": { "screen": "home" }
}
```

---

## 📋 Implementation Checklist

- [ ] All endpoints return the standard response envelope (no raw objects)
- [ ] Input validated with a library (e.g. `zod` or `joi` in Cloud Functions)
- [ ] Rate limiting configured: 100 req/min per user, 5 OTPs/hr per phone
- [ ] JWT verified via Firebase Admin SDK on every request
- [ ] Role checked on all admin and role-restricted endpoints
- [ ] Pagination implemented on all list endpoints
- [ ] Firebase App Check headers validated in production
- [ ] All errors return machine-readable `code` string (not just HTTP status)
- [ ] API versioning: breaking changes go to `/api/v2/`

---

*API Design Version 2.0 | Last Updated: April 2026*
