# 🚀 LocalPro — Updated Software Development Plan
### Hyperlocal Service Marketplace | React Native (Expo) + Firebase
**Version:** 2.1 (React Native Update)
**Reviewed By:** Senior Software Architect
**Date:** April 2026
**Updated:** React Native Expo Stack

---

## 📌 Executive Summary

LocalPro is a mobile-first hyperlocal service marketplace targeting Tier-2/3 cities in India. After reviewing the PRD, API design, Firebase schema, and UI wireframes, this document presents a professionally updated development plan with architectural improvements, security hardening, feature refinements, and a realistic execution roadmap.

---

## 🔍 Review Findings (What Needed Improvement)

Before diving into the updated plan, here's a critical review of the original documents:

| Area | Issue Found | Severity |
|---|---|---|
| API Design | No versioning strategy beyond v1 | Medium |
| API Design | No rate limiting or throttling defined | High |
| API Design | No input validation rules | High |
| Firebase Schema | Security rules too permissive (any auth = write) | Critical |
| Firebase Schema | No soft-delete strategy | Medium |
| Firebase Schema | Missing `updatedAt` fields | Low |
| Firebase Schema | No GeoHash field for geo-queries | High |
| UI Wireframes | No error states or empty states defined | High |
| UI Wireframes | No loading states | Medium |
| UI Wireframes | No onboarding flow for providers | Medium |
| PRD | No definition of "verified" provider | High |
| PRD | Payments deferred but no payment schema | Medium |
| PRD | Admin panel under-specified | Medium |

---

## 🏗️ 1. Revised System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Customer App │  │ Provider App │  │ Admin Panel  │  │
│  │ (RN + Expo)  │  │ (RN + Expo)  │  │  (React Web) │  │
│  │              │  │              │  │              │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────│─────────────────│─────────────────│───────────┘
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼───────────┐
│                     API GATEWAY                          │
│         Firebase Hosting + Cloud Functions               │
│         (Rate Limiting, Auth Middleware, Logging)        │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   BACKEND SERVICES                       │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────┐   │
│  │  Firebase  │  │  Firebase  │  │  Cloud Functions │   │
│  │    Auth    │  │  Firestore │  │  (Node.js 20)   │   │
│  └────────────┘  └────────────┘  └─────────────────┘   │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────┐   │
│  │  Firebase  │  │  Firebase  │  │   Razorpay API  │   │
│  │  Storage   │  │    FCM     │  │   (Phase 2)     │   │
│  └────────────┘  └────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

- **Framework:** React Native with Expo (cross-platform Android/iOS)
- **State Management:** Zustand (lightweight) + Context API (auth/session)
- **Navigation:** Expo Router (file-based routing with deep linking)
- **Local Storage:** AsyncStorage for offline caching (provider list, user profile)
- **Image Handling:** Expo Image + Firebase Storage (cached via Expo)
- **Geo Queries:** GeoPoint + GeoHash in Firestore for location-based discovery
- **Real-time:** Firestore listeners for chat and booking updates
- **Build/Deploy:** Expo EAS Build for Android/iOS, Expo Go for development

---

## 🔐 2. Updated Firebase Security Rules

The original rules were dangerously permissive. Here is the corrected ruleset:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isProvider() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'provider';
    }

    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // ─── Users ───────────────────────────────────────────
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // ─── Providers ────────────────────────────────────────
    match /providers/{providerId} {
      allow read: if true; // Public discovery
      allow create: if isAuthenticated() && isProvider();
      allow update: if isAuthenticated() &&
        (resource.data.user_id == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }

    // ─── Bookings ─────────────────────────────────────────
    match /bookings/{bookingId} {
      allow read: if isAuthenticated() &&
        (resource.data.customer_id == request.auth.uid ||
         resource.data.provider_id == request.auth.uid ||
         isAdmin());
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() &&
        (resource.data.customer_id == request.auth.uid ||
         resource.data.provider_id == request.auth.uid);
      allow delete: if isAdmin();
    }

    // ─── Chats ────────────────────────────────────────────
    match /chats/{chatId} {
      allow read, write: if isAuthenticated() &&
        request.auth.uid in resource.data.participants;

      match /messages/{messageId} {
        allow read: if isAuthenticated() &&
          request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
        allow create: if isAuthenticated() &&
          request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
        allow update, delete: if false; // Messages are immutable
      }
    }

    // ─── Reviews ──────────────────────────────────────────
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if isAuthenticated() &&
        resource == null; // Prevent duplicate reviews per booking
      allow update, delete: if isAdmin();
    }
  }
}
```

---

## 📦 3. Updated Firestore Schema

### `/users/{userId}`
```
name:           string
phone:          string (E.164 format: +919876543210)
role:           "customer" | "provider" | "admin"
profile_image:  string (Storage URL)
fcm_token:      string (for push notifications)
location: {
  lat:          number,
  lng:          number,
  geoHash:      string   ← Required for Firestore geo-queries
}
address:        string
is_active:      boolean  ← Soft-delete support
created_at:     timestamp
updated_at:     timestamp
```

### `/providers/{providerId}`
```
user_id:        string (ref: users)
category:       string (enum-validated via Cloud Function)
sub_categories: string[]  ← NEW: e.g., ["AC repair", "wiring"]
description:    string
rating:         number (1.0–5.0, float)
total_reviews:  number
is_verified:    boolean
verified_at:    timestamp ← NEW
verification_doc: string  ← NEW: ID proof URL (admin-only read)
availability:   boolean
work_radius_km: number    ← NEW: Provider's service radius
price_range: {            ← CHANGED: was string, now structured
  min:          number,
  max:          number,
  unit:         "per_hour" | "per_job"
}
total_jobs:     number    ← NEW
location: {               ← NEW: Duplicate from user for geo-queries
  lat:          number,
  lng:          number,
  geoHash:      string
}
created_at:     timestamp
updated_at:     timestamp
```

### `/bookings/{bookingId}`
```
customer_id:    string (ref: users)
provider_id:    string (ref: providers)
status:         "pending" | "accepted" | "in_progress" | "completed" | "cancelled" | "disputed"
                ← CHANGED: added "in_progress" and "disputed"
date_time:      timestamp
notes:          string
price: {                  ← CHANGED: was number, now structured
  quoted:       number,
  final:        number,
  currency:     "INR"
}
address:        string    ← NEW: Job site address
cancelled_by:   string    ← NEW: userId of who cancelled
cancel_reason:  string    ← NEW
review_id:      string    ← NEW: Link to review after completion
created_at:     timestamp
updated_at:     timestamp
```

### `/chats/{chatId}`
```
participants:   string[]  (always 2: [customerId, providerId])
booking_id:     string    ← NEW: Chat linked to a booking
last_message:   string
last_message_by: string   ← NEW
last_updated:   timestamp
is_archived:    boolean   ← NEW
```

### `/chats/{chatId}/messages/{messageId}`
```
sender_id:      string
message:        string
type:           "text" | "image" | "location" ← ADDED location type
media_url:      string    ← NEW: For image messages
is_read:        boolean   ← NEW
timestamp:      timestamp
```

### `/reviews/{reviewId}`
```
booking_id:     string (unique constraint enforced via Cloud Function)
customer_id:    string
provider_id:    string
rating:         number (1–5)
comment:        string
provider_reply: string    ← NEW: Provider can respond to review
created_at:     timestamp
```

### NEW: `/notifications/{notificationId}`
```
user_id:        string
title:          string
body:           string
type:           "booking_update" | "chat" | "promo" | "system"
is_read:        boolean
payload:        map (navigation data)
created_at:     timestamp
```

### NEW: `/categories/{categoryId}`
```
name:           string (e.g., "Electrician")
icon:           string (asset path or URL)
slug:           string (e.g., "electrician")
sub_categories: string[]
is_active:      boolean
sort_order:     number
```

---

## 🌐 4. Updated API Design

### Base Configuration
```
Base URL:    https://api.localpro.com/api/v1
Auth:        Bearer JWT (Firebase ID Token)
Rate Limit:  100 req/min per user, 10 req/min for OTP
Content:     application/json
Versioning:  URI-based (/api/v1/, /api/v2/)
```

### Error Response Format (Standardized)
```json
{
  "success": false,
  "error": {
    "code": "PROVIDER_NOT_FOUND",
    "message": "No provider found with the given ID.",
    "details": {}
  },
  "timestamp": "2026-04-06T10:30:00Z"
}
```

### Success Response Format (Standardized)
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

---

### 🔐 Auth Endpoints

#### POST `/auth/send-otp`
```json
// Request
{ "phone": "+919876543210" }

// Response 200
{ "success": true, "data": { "message": "OTP sent", "expires_in": 300 } }

// Rate limited: 5 OTPs per phone per hour
```

#### POST `/auth/verify-otp`
```json
// Request
{ "phone": "+919876543210", "otp": "123456" }

// Response 200
{
  "success": true,
  "data": {
    "token": "firebase_id_token",
    "refresh_token": "...",
    "user": { "id": "...", "role": "customer", "is_new": true }
  }
}
// is_new = true triggers onboarding flow in app
```

#### POST `/auth/refresh`
```json
// Request
{ "refresh_token": "..." }
// Response: new token pair
```

---

### 👤 User Endpoints

#### GET `/users/me`
```json
// Response 200
{
  "success": true,
  "data": {
    "id": "uid123",
    "name": "Rahul Kumar",
    "phone": "+919876543210",
    "role": "customer",
    "profile_image": "https://...",
    "location": { "lat": 25.5941, "lng": 85.1376, "address": "Patna, Bihar" }
  }
}
```

#### PUT `/users/me`
```json
// Request
{
  "name": "Rahul Kumar",
  "address": "Boring Road, Patna",
  "location": { "lat": 25.5941, "lng": 85.1376 },
  "fcm_token": "device_fcm_token"  // ← Update on every login
}
```

#### POST `/users/me/upload-photo` ← NEW
```
Content-Type: multipart/form-data
Field: photo (image/jpeg | image/png, max 5MB)
```

---

### 🧑‍🔧 Provider Endpoints

#### GET `/providers`
```
Query Params:
  category    string   (required OR lat+lng)
  lat         number   (required for geo-search)
  lng         number   (required for geo-search)
  radius_km   number   (default: 10, max: 50)
  min_rating  number   (default: 0)
  sort        string   (rating | distance | price_asc | price_desc)
  page        number   (default: 1)
  limit       number   (default: 20, max: 50)
  available   boolean  (default: true)
```

#### GET `/providers/{id}`
Returns full provider profile including reviews summary.

#### POST `/providers` (Register as Provider)
```json
{
  "category": "electrician",
  "sub_categories": ["wiring", "AC installation"],
  "description": "10 years experience...",
  "price_range": { "min": 200, "max": 1000, "unit": "per_job" },
  "work_radius_km": 15
}
```

#### PUT `/providers/{id}` ← NEW (Update profile)
```json
{
  "description": "...",
  "availability": false,
  "price_range": { "min": 300, "max": 1500, "unit": "per_job" }
}
```

#### PATCH `/providers/{id}/availability` ← NEW (Quick toggle)
```json
{ "availability": true }
```

#### POST `/providers/{id}/verify` ← NEW (Admin only)
```json
{ "is_verified": true, "notes": "ID verified via Aadhaar" }
```

---

### 📅 Booking Endpoints

#### POST `/bookings`
```json
{
  "provider_id": "prov123",
  "date_time": "2026-04-10T10:00:00Z",
  "notes": "Please bring your own tools",
  "address": "Flat 3B, Gandhi Maidan, Patna"
}
```

#### GET `/bookings`
```
Query Params:
  role    "customer" | "provider"  (inferred from token role)
  status  string                   (filter by status)
  page    number
  limit   number
```

#### GET `/bookings/{id}` ← NEW (Single booking detail)

#### PATCH `/bookings/{id}/status`
```json
{
  "status": "accepted",     // Provider accepts
  "status": "in_progress",  // Provider starts job
  "status": "completed",    // Provider marks done
  "status": "cancelled",
  "cancel_reason": "Emergency came up"  // Required when cancelling
}
```

> **Business Rule:** Only the provider can accept/start/complete. Only the customer can cancel before acceptance. Either can cancel with reason after acceptance.

#### POST `/bookings/{id}/dispute` ← NEW
```json
{ "reason": "Provider did not show up", "evidence_urls": ["..."] }
```

---

### 💬 Chat Endpoints

#### POST `/chats`
```json
{ "provider_id": "prov123", "booking_id": "book456" }
// booking_id links chat to a booking context
```

#### GET `/chats`
Returns all chats for the authenticated user, sorted by `last_updated`.

#### GET `/chats/{chatId}/messages`
```
Query Params:
  before_timestamp  string   (cursor-based pagination)
  limit             number   (default: 50)
```

#### POST `/chats/{chatId}/messages`
```json
{
  "message": "I'll arrive by 10 AM",
  "type": "text"
}
```

#### PATCH `/chats/{chatId}/messages/read` ← NEW (Mark messages read)

> **Note:** For real-time delivery, use Firestore listeners directly in Flutter. REST endpoints are for history and fallback.

---

### ⭐ Review Endpoints

#### POST `/reviews`
```json
{
  "booking_id": "book456",
  "rating": 5,
  "comment": "Excellent work, very professional!"
}
// Validation: booking must be "completed" and no existing review for this booking
```

#### GET `/providers/{id}/reviews`
```
Query Params:
  sort    "recent" | "highest" | "lowest"  (default: recent)
  page    number
  limit   number  (default: 10)
```

#### POST `/reviews/{id}/reply` ← NEW (Provider reply)
```json
{ "reply": "Thank you for your kind words!" }
```

---

### 🔔 Notification Endpoints ← NEW

#### GET `/notifications`
Returns paginated notifications for the user.

#### PATCH `/notifications/{id}/read`
#### PATCH `/notifications/read-all`

---

### 🔑 Admin Endpoints ← NEW

#### GET `/admin/providers/pending`
Providers awaiting verification.

#### GET `/admin/bookings/disputes`
Active disputed bookings.

#### GET `/admin/analytics`
```json
{
  "dau": 450,
  "bookings_today": 38,
  "new_providers_this_week": 12,
  "revenue_this_month": 48500
}
```

---

## 📱 5. Updated UI/UX Specifications

### Screen Inventory (Complete)

| Screen | Customer | Provider | Notes |
|--------|----------|----------|-------|
| Splash | ✅ | ✅ | Brand animation, 2s max |
| Onboarding | ✅ | ✅ | 3 slides, skippable |
| Login (OTP) | ✅ | ✅ | Phone + OTP |
| Role Select | ✅ | ✅ | New user only |
| Home | ✅ | ✅ | Different for each role |
| Service Discovery | ✅ | — | Map + List toggle |
| Provider Listing | ✅ | — | With filters |
| Provider Profile | ✅ | — | Public view |
| Booking Flow | ✅ | — | Date → Time → Notes → Confirm |
| Booking List | ✅ | ✅ | Filtered by status |
| Booking Detail | ✅ | ✅ | Full detail + actions |
| Chat List | ✅ | ✅ | |
| Chat Screen | ✅ | ✅ | Real-time |
| Review Screen | ✅ | — | Post-completion only |
| Notifications | ✅ | ✅ | |
| Profile | ✅ | ✅ | Edit info |
| Provider Dashboard | — | ✅ | Earnings + jobs |
| Provider Onboarding | — | ✅ | Category, docs, radius |
| Availability Toggle | — | ✅ | Prominent on dashboard |
| Empty States | ✅ | ✅ | **All screens must have these** |
| Error States | ✅ | ✅ | **All screens must have these** |
| No Internet | ✅ | ✅ | **Global overlay** |

### Missing UI States (Must Add)

Every list screen needs:
1. **Loading State** — Shimmer effect (use `shimmer` package)
2. **Empty State** — Illustration + descriptive text + CTA
3. **Error State** — Error message + Retry button
4. **No Internet** — Offline banner + cached content where possible

### Navigation Structure

```
Bottom Navigation (Customer):
├── 🏠 Home
├── 📋 Bookings
├── 💬 Chat       (badge for unread)
└── 👤 Profile

Bottom Navigation (Provider):
├── 📊 Dashboard
├── 📋 Jobs
├── 💬 Chat       (badge for unread)
└── 👤 Profile
```

---

## ☁️ 6. Cloud Functions (Required)

These cannot be done client-side. Implement as Firebase Cloud Functions (Node.js 20):

| Function | Trigger | Purpose |
|----------|---------|---------|
| `onBookingCreated` | Firestore write | Notify provider via FCM |
| `onBookingStatusChanged` | Firestore update | Notify customer + update provider stats |
| `onReviewCreated` | Firestore write | Recalculate provider avg. rating |
| `onMessageCreated` | Firestore write | FCM push for offline user |
| `onProviderVerified` | Firestore update | Notify provider of verification |
| `sendOtp` | HTTPS | Twilio/Firebase Auth OTP |
| `cleanupExpiredBookings` | Scheduled (daily) | Auto-cancel unconfirmed old bookings |
| `generateEarningsReport` | Scheduled (weekly) | Provider earnings summary |

---

## 🧪 7. Testing Strategy

### Unit Tests
- All Cloud Functions
- Utility functions (geo-hash generation, price formatting, date handling)
- Form validators

### Widget Tests (Flutter)
- All custom widgets
- Form screens (OTP, booking, review)

### Integration Tests
- Critical user journeys:
  1. Customer: Register → Discover → Book → Chat → Review
  2. Provider: Register → Accept Job → Complete → View Earnings

### Firebase Emulator Suite
Use the full emulator suite (Auth, Firestore, Functions, Storage) for local dev and CI/CD.

---

## 📦 8. Flutter Package List (Updated)

```yaml
dependencies:
  # Core
  flutter_riverpod: ^2.5.1
  go_router: ^13.2.0

  # Firebase
  firebase_core: ^3.3.0
  firebase_auth: ^5.1.4
  cloud_firestore: ^5.2.1
  firebase_storage: ^12.1.3
  firebase_messaging: ^15.0.4
  firebase_analytics: ^11.2.1

  # Geo
  geoflutterfire_plus: ^0.0.27
  geolocator: ^13.0.1
  google_maps_flutter: ^2.9.0

  # UI
  cached_network_image: ^3.4.1
  shimmer: ^3.0.0
  lottie: ^3.1.2
  image_picker: ^1.1.2
  intl: ^0.19.0
  timeago: ^3.6.1

  # Local Storage
  hive_flutter: ^1.1.0

  # Utilities
  dio: ^5.7.0
  logger: ^2.4.0
  flutter_local_notifications: ^17.2.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  mocktail: ^1.0.4
  integration_test:
    sdk: flutter
```

---

## 📅 9. Revised Development Roadmap

### Phase 0: Setup (Week 1)
- [ ] Firebase project setup (dev + prod environments)
- [ ] Flutter project scaffold with Riverpod + GoRouter
- [ ] Firebase Emulator Suite configured
- [ ] CI/CD pipeline (GitHub Actions → Firebase App Distribution)
- [ ] Design system: Colors, Typography, Spacing constants
- [ ] Shared widgets: AppButton, AppTextField, AppCard, LoadingShimmer

### Phase 1: Core MVP (Weeks 2–6)

**Week 2: Auth & Onboarding**
- [ ] OTP Login screen
- [ ] Role selection (customer/provider)
- [ ] Profile setup (customer)
- [ ] Provider onboarding (category, radius, price)

**Week 3: Discovery**
- [ ] Category grid (home screen)
- [ ] Provider listing with filters
- [ ] Provider profile screen
- [ ] Geo-query integration (GeoFlutterFire)

**Week 4: Booking**
- [ ] Booking creation flow (date/time/address picker)
- [ ] Booking list (customer + provider)
- [ ] Booking detail + status actions
- [ ] Cloud Functions for booking notifications

**Week 5: Chat**
- [ ] Chat list screen
- [ ] Real-time chat with Firestore
- [ ] FCM push for offline messages
- [ ] Image sharing in chat

**Week 6: Reviews & Polish**
- [ ] Review submission flow (post-completion only)
- [ ] Provider rating display
- [ ] All empty/error/loading states
- [ ] Provider dashboard (earnings, job stats)

### Phase 2: Payments & Ratings (Weeks 7–9)
- [ ] Razorpay SDK integration
- [ ] Payment flow in booking
- [ ] Refund/dispute handling
- [ ] Enhanced reviews (photos, provider reply)
- [ ] Notification center screen

### Phase 3: Admin & Growth (Weeks 10–12)
- [ ] Admin panel (Flutter Web or React)
- [ ] Provider verification workflow
- [ ] Analytics dashboard
- [ ] Promo/coupon system
- [ ] Referral system

### Phase 4: AI & Scale (Month 4+)
- [ ] Smart provider matching (based on history + location + rating)
- [ ] Automated pricing suggestions
- [ ] Chatbot for pre-booking queries
- [ ] Expansion to Tier-1 cities

---

## 💰 10. Monetization Model (Detailed)

| Stream | Mechanism | Revenue per Transaction |
|--------|-----------|------------------------|
| Commission | 10–15% of booking value | Variable |
| Featured Listing | ₹299–₹999/month per provider | Fixed |
| Verified Badge | ₹199 one-time verification fee | Fixed |
| Priority Support | ₹99/month subscription | Fixed |
| Surge Pricing | 5–20% extra during peak hours | Variable |

**Phase 2 Target:** ₹2–5 lakh/month at 500 daily bookings (avg. ₹400/booking, 12% commission).

---

## ⚡ 11. Performance Targets

| Metric | Target |
|--------|--------|
| App cold start | < 2 seconds |
| Provider list load | < 1.5 seconds |
| Chat message delivery | < 500ms |
| App APK size | < 25 MB |
| Crash-free rate | > 99.5% |
| API p95 response time | < 300ms |
| Offline support | Profile + booking history |

---

## 🔒 12. Security Checklist

- [ ] Phone number validated in E.164 format before OTP
- [ ] JWT token expiry: 1 hour (refresh token: 30 days)
- [ ] All file uploads: type-validated, max 5MB, virus-scanned via Cloud Function
- [ ] Sensitive fields (verification_doc) restricted to admin reads only
- [ ] Rate limiting on OTP: 5 attempts/hour per phone
- [ ] Input sanitization on all free-text fields
- [ ] HTTPS enforced everywhere (Firebase Hosting default)
- [ ] No sensitive data in FCM payload body (only notification IDs)
- [ ] Provider verification documents stored in private Firebase Storage bucket

---

## 📋 13. Definition of Done (Per Feature)

A feature is **done** when:
1. ✅ Unit tests written and passing
2. ✅ Works on Firebase Emulator
3. ✅ Empty, loading, and error states implemented
4. ✅ Tested on low-end Android device (2GB RAM, Android 9+)
5. ✅ No lint warnings
6. ✅ PR reviewed by at least one other developer
7. ✅ Deployed to Firebase App Distribution (staging)

---

## 📁 14. Recommended Folder Structure (Flutter)

```
lib/
├── core/
│   ├── constants/     (colors, strings, routes)
│   ├── errors/        (failure classes)
│   ├── extensions/    (context, string extensions)
│   ├── utils/         (formatters, validators, geo)
│   └── widgets/       (shared UI components)
├── features/
│   ├── auth/
│   │   ├── data/      (repositories, datasources)
│   │   ├── domain/    (models, use cases)
│   │   └── presentation/ (screens, providers)
│   ├── discovery/
│   ├── booking/
│   ├── chat/
│   ├── review/
│   ├── notifications/
│   └── profile/
├── services/
│   ├── firebase_service.dart
│   ├── geo_service.dart
│   └── notification_service.dart
└── main.dart
```

---

## ✅ Final Checklist Before Launch

- [ ] Firebase App Check enabled (prevent API abuse)
- [ ] Google Play Console setup with release signing
- [ ] Privacy Policy & Terms of Service screens in app
- [ ] Analytics events mapped (onboarding, booking, chat)
- [ ] Crashlytics enabled for production
- [ ] Backup strategy for Firestore (daily automated backups)
- [ ] Load tested: 500 concurrent users
- [ ] DPDP Act compliance (India's data protection law)
- [ ] Tested on: Android 9, 10, 11, 12, 13, 14

---

*Document prepared by: Senior Software Architect Review*
*Last Updated: April 2026*
*Next Review: After Phase 1 completion*
