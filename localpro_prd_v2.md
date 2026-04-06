# 📄 Product Requirements Document (PRD)
## LocalPro — Hyperlocal Service Marketplace
**Version:** 2.1 (React Native + Expo)
**Platform:** Android/iOS (React Native + Expo) + Web Admin Panel
**Status:** MVP Planning
**Last Updated:** April 2026

---

## 1. Product Overview

**Product Name:** LocalPro
**Platform:** Android & iOS (React Native + Expo); Admin Panel (React Web)
**Target Version:** MVP v1.0
**Backend:** Firebase (Auth, Firestore, Functions, Storage, FCM)

### Objective
Build a mobile-first platform that connects customers in Tier-2/3 Indian cities with nearby, verified local service providers — enabling seamless discovery, booking, real-time communication, and service management through a simple and reliable mobile experience across Android and iOS.

### Target Market
- **Primary:** Tier-2 and Tier-3 cities in India (Patna, Lucknow, Indore, Bhopal, Nagpur, etc.)
- **Users:** Adults aged 18–55 with basic smartphone familiarity
- **Providers:** Electricians, plumbers, carpenters, tutors, cleaners, AC technicians, and other skilled local workers without an existing digital presence

---

## 2. Problem Statement

### Customer Pain Points
- No reliable way to discover and compare nearby service providers
- No trust or verification mechanism — word of mouth only
- Booking via phone calls is inefficient, untracked, and error-prone
- No visibility into pricing before a service visit
- No recourse or job history after work is done

### Provider Pain Points
- Customer reach is limited to their immediate neighborhood or contacts
- No tools to manage job requests, schedules, or earnings
- Entirely dependent on referrals with no digital presence
- Unable to showcase skills, ratings, or work history

---

## 3. Goals & Success Metrics

### Business Goals
| Goal | Target | Timeline |
|------|--------|----------|
| Registered Users | 1,000+ | Month 3 |
| Onboarded Providers | 200+ | Month 3 |
| Repeat Booking Rate | > 30% | Month 6 |
| Monthly Revenue | ₹2–5 Lakh | Month 6 |

### Product KPIs
| Metric | Description |
|--------|-------------|
| DAU / MAU | Daily and monthly active users |
| Bookings per Day | Volume of confirmed bookings |
| Booking Conversion Rate | Discovery → Booking |
| Provider Acceptance Rate | Bookings accepted vs. received |
| Time to Accept | Avg. time for provider to accept a booking |
| Chat Response Rate | % of bookings where chat is initiated |
| Review Submission Rate | % of completed bookings with a review |
| Crash-Free Rate | Target > 99.5% sessions |

---

## 4. User Personas

### 4.1 Priya — The Customer
- Age 28, homeowner in Patna
- Needs an electrician for a sudden repair; not very tech-savvy
- Wants to see ratings and price before booking
- Expects fast, simple UI and real-time booking status updates

### 4.2 Raju — The Service Provider
- Age 35, electrician with 10 years of experience
- No digital presence; gets jobs via word-of-mouth only
- Owns a basic Android smartphone (2–3 GB RAM)
- Wants consistent job flow and simple tools to accept/reject requests and track earnings

### 4.3 Admin — LocalPro Operations Team
- Manages provider verification and dispute resolution
- Needs analytics visibility and controls over platform content
- Uses the admin panel to approve providers, resolve disputes, and run promotions

---

## 5. Feature Specifications

### 5.1 Customer App

#### Authentication & Onboarding
- OTP-based phone login (Firebase Auth)
- New user: role selection → profile setup (name, photo, address, location)
- 3-screen onboarding carousel (skippable after first view)
- Location permission request with plain-language explanation

#### Service Discovery
- Home screen: dynamic category grid (from Firestore `/categories` collection)
- Full-text search on provider name, category, sub-category
- Map view + List view toggle
- Geo-based results via GeoFlutterFire Plus (radius: 5–50 km, user-configurable)
- Filters: min rating, max distance, price range, availability
- Sort: rating, distance, price ascending/descending

#### Provider Profile
- Profile image, name, category, sub-categories, verified badge
- Star rating breakdown (1–5 star distribution)
- Price range (min/max, per job or per hour)
- Work radius, description, recent reviews (top 3 + "See All")
- **Book Now** CTA

#### Booking Flow
1. Select date (no past dates)
2. Select time slot (30-min slots, 8 AM–8 PM)
3. Confirm/enter address (auto-fill from profile or manual)
4. Optional notes (max 300 chars)
5. Review summary + estimated price → **Confirm**

- Status tracking: Pending → Accepted → In Progress → Completed
- Customer can cancel (with reason) before provider accepts
- Dispute flow available after acceptance if service not delivered

#### Chat
- Per-booking real-time messaging (Firestore listeners)
- Text + image messages
- Unread badge on navigation tab

#### Reviews
- Triggered only when booking status = Completed
- 1–5 star + optional text comment
- One review per booking (enforced server-side via Cloud Function)

#### Notifications
- FCM push: booking accepted/rejected, in progress, completed, new message, promotions
- In-app notification center with read/unread state

#### Profile
- Edit name, photo, address
- Booking history (filterable by status)
- Notification preferences

---

### 5.2 Provider App

#### Provider Onboarding (First Login)
1. Select category + sub-categories
2. Write description (50–500 chars)
3. Set price range and billing unit (per job / per hour)
4. Set work radius (slider: 5–50 km)
5. Optionally upload ID proof for verified badge (admin review required)
6. Submit → profile immediately visible; verified badge pending

#### Dashboard
- Prominent availability toggle (top of screen)
- Incoming job requests with Accept / Reject actions
- Active and upcoming bookings
- Earnings summary: today / this week / this month

#### Job Management
- Booking detail: customer name, address, date/time, notes
- Accept or Reject (optional message to customer)
- Mark In Progress on arrival
- Mark Completed when done
- Full booking history

#### Profile Management
- Edit description, price range, sub-categories, work radius
- View and respond to received reviews

---

### 5.3 Admin Panel

#### Provider Management
- View providers by status: Pending / Verified / Rejected
- Securely review verification documents
- Approve or reject with notes; deactivate policy-violating providers

#### User Management
- Search users by phone, name, or ID
- View booking history per user
- Soft-delete / deactivate accounts

#### Booking Management
- Filter bookings by status
- View and resolve disputed bookings
- Manually update booking status if needed

#### Analytics
- DAU/MAU charts, bookings per day/week/month
- Revenue (commission earned), top categories, top providers
- New user and provider growth over time

#### Promotions
- Broadcast push notifications (all users or filtered segments)
- Manage promo codes and featured provider listings

---

## 6. System Architecture

```
React Native App (Customer + Provider)  [iOS/Android via Expo]
         ↕  Firestore Listeners + Cloud Functions (HTTPS)
Firebase Backend
  ├── Firebase Auth       (OTP-based phone login)
  ├── Firestore           (primary DB + real-time updates)
  ├── Cloud Functions     (Node.js 20 — triggers, business logic)
  ├── Firebase Storage    (profile images, provider documents)
  ├── FCM                 (push notifications via Expo)
  └── Firebase Analytics + Crashlytics

Admin Panel (React Web)
         ↕  Firestore + Cloud Functions
```

**State Management:** Zustand (lightweight) + Context API (auth)
**Navigation:** Expo Router (file-based routing with deep linking)
**Local Cache:** AsyncStorage (offline: profile + booking history)
**Geo Queries:** Firestore GeoPoint + GeoHash for location-based discovery
**Build/Deploy:** Expo EAS Build (Android/iOS), Expo Go (development)

---

## 7. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| App cold start | < 2 seconds |
| Provider list load | < 1.5 seconds |
| Chat message delivery | < 500 ms |
| Bundle size (Android) | < 30 MB |
| Bundle size (iOS) | < 40 MB |
| Crash-free rate | > 99.5% |
| Minimum Android version | Android 8 (API 26) |
| Minimum iOS version | iOS 12+ |
| Minimum RAM | 2 GB |
| Offline support | Profile + booking history (AsyncStorage cache) |

---

## 8. Security & Compliance

- All traffic over HTTPS (Firebase Hosting enforced)
- Firebase App Check enabled in production (prevent API abuse)
- OTP rate limited: 5 attempts per phone per hour
- JWT expiry: 1 hour; refresh token: 30 days
- Provider ID documents stored in private Firebase Storage bucket (admin-read only)
- Input sanitization on all free-text fields
- No sensitive data in FCM payload body (reference IDs only)
- Compliant with India's **DPDP Act (2023)**: data minimization, user consent, right to erasure
- Privacy Policy and Terms of Service shown at onboarding

---

## 9. MVP Scope

| Feature | MVP (Phase 1) |
|---------|:---:|
| OTP Auth + Role Selection | ✅ |
| Customer & Provider Onboarding | ✅ |
| Service Discovery (List + Filters) | ✅ |
| Provider Profile | ✅ |
| Booking Flow (Create → Accept → Complete → Cancel) | ✅ |
| Real-time Chat (Text + Image) | ✅ |
| FCM Push Notifications | ✅ |
| Reviews & Ratings | ✅ |
| Provider Dashboard (Jobs + Earnings) | ✅ |
| Payments (Razorpay) | ❌ Phase 2 |
| Map View for Discovery | ❌ Phase 2 |
| Admin Panel | ❌ Phase 3 |
| Promo Codes / Featured Listings | ❌ Phase 3 |
| AI-based Provider Matching | ❌ Phase 4 |

---

## 10. Monetization Strategy

| Stream | Mechanism | Rate |
|--------|-----------|------|
| Commission | % of each completed booking value | 10–15% |
| Featured Listing | Provider promoted placement in search | ₹299–₹999/month |
| Verified Badge | One-time verification processing fee | ₹199 |
| Priority Support | Premium provider subscription | ₹99/month |
| Surge Pricing | Peak-hour booking premium | 5–20% |

**Month 6 Target:** ₹2–5 Lakh/month at ~500 daily bookings (avg. ₹400/booking, 12% commission).

---

## 11. Roadmap

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 0: Foundation | Week 1 | Firebase setup (dev + prod), CI/CD, design system, shared widgets |
| Phase 1: MVP | Weeks 2–6 | Auth, discovery, booking, chat, reviews, provider dashboard |
| Phase 2: Payments | Weeks 7–9 | Razorpay integration, refunds, disputes, enhanced reviews |
| Phase 3: Admin & Growth | Weeks 10–12 | Admin panel, verification workflow, analytics, promos |
| Phase 4: AI & Scale | Month 4+ | Smart matching, chatbot, Tier-1 expansion |

---

## 12. Definition of Done

A feature is **production-ready** when:
1. ✅ Unit tests written and passing
2. ✅ Tested on Firebase Emulator Suite
3. ✅ Empty, loading, and error states on all screens
4. ✅ Verified on a low-end device (2 GB RAM, Android 9)
5. ✅ No lint warnings or static analysis issues
6. ✅ PR reviewed and approved by at least one peer
7. ✅ Deployed to Firebase App Distribution (staging) and smoke-tested

---

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Low provider adoption | High | High | Offline onboarding support; referral incentives |
| Trust/safety concerns | Medium | High | Verified badge, reviews, dispute resolution |
| Poor performance on low-end devices | Medium | High | Test on 2 GB RAM device; minimize APK and Firestore reads |
| Firebase cost overrun | Low | Medium | Budget alerts; aggressive client-side caching |
| OTP spam / abuse | Medium | Medium | Rate limiting + Firebase App Check |

---

*PRD Version 2.0 | Last Updated: April 2026 | Next Review: After Phase 1 completion*
