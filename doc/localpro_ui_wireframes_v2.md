# 🎨 UI Wireframes & Screen Specifications — LocalPro v2.1
## Hyperlocal Service Marketplace
**Version:** 2.1 (React Native + Expo)
**Platform:** React Native (Android/iOS via Expo)
**Last Updated:** April 2026

---

## Overview

This document covers:
- Complete screen inventory for Customer App, Provider App, and shared screens
- Low-fidelity wireframes for each screen
- State requirements (loading, empty, error) for every list/data screen
- React Native implementation notes per screen
- Component library reference (TypeScript + React Native patterns)

---

## Design Principles

1. **Minimal cognitive load** — Tier-2/3 city users, varying literacy. One primary action per screen.
2. **Speed over decoration** — Low-end devices (2 GB RAM). No heavy animations or large images.
3. **Hindi/English friendly** — Leave space for longer Hindi text; avoid fixed-width text containers.
4. **Offline-first feel** — Show cached data immediately; refresh silently in the background.
5. **Trust signals everywhere** — Verified badge, ratings, and review counts on all provider surfaces.

---

## Screen Inventory

| # | Screen | Customer | Provider | Priority |
|---|--------|:---:|:---:|---------|
| 1 | Splash | ✅ | ✅ | P0 |
| 2 | Onboarding Carousel | ✅ | ✅ | P0 |
| 3 | Login — Phone Entry | ✅ | ✅ | P0 |
| 4 | Login — OTP Entry | ✅ | ✅ | P0 |
| 5 | Role Selection | ✅ | ✅ | P0 |
| 6 | Customer Profile Setup | ✅ | — | P0 |
| 7 | Provider Onboarding (multi-step) | — | ✅ | P0 |
| 8 | Home (Customer) | ✅ | — | P0 |
| 9 | Provider Dashboard | — | ✅ | P0 |
| 10 | Service Discovery — List | ✅ | — | P0 |
| 11 | Service Discovery — Map | ✅ | — | P1 |
| 12 | Provider Profile | ✅ | — | P0 |
| 13 | Booking Flow — Step 1 (Date) | ✅ | — | P0 |
| 14 | Booking Flow — Step 2 (Time) | ✅ | — | P0 |
| 15 | Booking Flow — Step 3 (Address + Notes) | ✅ | — | P0 |
| 16 | Booking Flow — Step 4 (Confirm) | ✅ | — | P0 |
| 17 | Booking List (Customer) | ✅ | — | P0 |
| 18 | Booking List (Provider) | — | ✅ | P0 |
| 19 | Booking Detail (Customer) | ✅ | — | P0 |
| 20 | Booking Detail (Provider) | — | ✅ | P0 |
| 21 | Chat List | ✅ | ✅ | P0 |
| 22 | Chat Screen | ✅ | ✅ | P0 |
| 23 | Review Screen | ✅ | — | P0 |
| 24 | All Reviews | ✅ | ✅ | P1 |
| 25 | Notification Center | ✅ | ✅ | P1 |
| 26 | Profile (Customer) | ✅ | — | P0 |
| 27 | Profile (Provider) | — | ✅ | P0 |
| 28 | No Internet | ✅ | ✅ | P0 |
| 29 | Generic Error | ✅ | ✅ | P0 |

---

## 📱 Shared Screens

---

### Screen 1: Splash Screen

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│           [APP LOGO]            │
│                                 │
│           LocalPro              │
│    Your neighbourhood experts   │
│                                 │
│                                 │
│         ────────────            │
│         Loading bar             │
│         ────────────            │
│                                 │
└─────────────────────────────────┘
```

**Behaviour:**
- Max display time: 2 seconds
- Runs auth state check in parallel
  - If token valid → navigate to Home (customer) or Dashboard (provider)
  - If token missing/expired → navigate to Onboarding (first time) or Login

---

### Screen 2: Onboarding Carousel (3 slides)

```
SLIDE 1                             SLIDE 2                             SLIDE 3
┌──────────────────────┐           ┌──────────────────────┐           ┌──────────────────────┐
│                      │           │                      │           │                      │
│   [Illustration]     │           │   [Illustration]     │           │   [Illustration]     │
│  Find experts near   │           │  Book in 3 simple    │           │  Chat directly,      │
│     you instantly    │           │       steps          │           │  track in real time  │
│                      │           │                      │           │                      │
│  ● ○ ○               │           │  ○ ● ○               │           │  ○ ○ ●               │
│                      │           │                      │           │                      │
│       [Next]         │           │       [Next]         │           │  [Get Started]       │
│      [Skip →]        │           │      [Skip →]        │           │                      │
└──────────────────────┘           └──────────────────────┘           └──────────────────────┘
```

**Behaviour:**
- Shown only on first app launch (flag stored in Hive)
- Skip jumps directly to Login
- Swipeable left/right

---

### Screen 3: Login — Phone Entry

```
┌─────────────────────────────────┐
│                                 │
│  ←                              │
│                                 │
│  Welcome to LocalPro            │
│  Enter your phone number        │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 🇮🇳 +91  98765 43210   │    │
│  └─────────────────────────┘    │
│                                 │
│  [      Send OTP       ]        │
│                                 │
│  By continuing, you agree to    │
│  our Terms & Privacy Policy     │
│                                 │
└─────────────────────────────────┘
```

**Validation:**
- Accept only 10-digit Indian numbers (auto-prefix `+91`)
- Disable "Send OTP" button while request is in-flight
- Show error inline (below input) if phone is invalid or rate-limited

---

### Screen 4: Login — OTP Entry

```
┌─────────────────────────────────┐
│                                 │
│  ←                              │
│                                 │
│  Enter OTP                      │
│  Sent to +91 98765 43210        │
│                                 │
│  ┌──┐  ┌──┐  ┌──┐  ┌──┐        │
│  │  │  │  │  │  │  │  │        │
│  └──┘  └──┘  └──┘  └──┘        │
│                                 │
│  Expires in 04:58               │
│                                 │
│  [      Verify       ]          │
│                                 │
│  Didn't receive OTP?            │
│  Resend (available in 0:30)     │
│                                 │
└─────────────────────────────────┘
```

**Behaviour:**
- Auto-focus first box; auto-advance on digit entry
- Countdown timer shown; Resend enabled only after 30 seconds
- Show error inline if OTP is wrong
- Auto-submit when 4th digit is entered

---

### Screen 5: Role Selection (New Users Only)

```
┌─────────────────────────────────┐
│                                 │
│  I am a...                      │
│                                 │
│  ┌─────────────────────────┐    │
│  │         🏠              │    │
│  │      Customer           │    │
│  │  I need services at     │    │
│  │     home or office      │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │         🔧              │    │
│  │  Service Provider       │    │
│  │  I offer professional   │    │
│  │       services          │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

**Behaviour:**
- Tapping a card selects role and navigates to the appropriate onboarding screen
- Role is saved to Firestore `/users/{uid}` immediately

---

## 👤 Customer Screens

---

### Screen 6: Customer Profile Setup

```
┌─────────────────────────────────┐
│  Set up your profile            │
│                                 │
│         [📷 Photo]              │
│         Tap to add              │
│                                 │
│  Full Name *                    │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  Address                        │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  [📍 Use My Current Location]   │
│                                 │
│  [      Continue      ]         │
└─────────────────────────────────┘
```

---

### Screen 8: Home Screen (Customer)

```
┌─────────────────────────────────┐
│  📍 Patna, Bihar           [👤] │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 🔍 Search services...  │    │
│  └─────────────────────────┘    │
│                                 │
│  What do you need?              │
│  ┌──────┐ ┌──────┐ ┌──────┐    │
│  │  ⚡  │ │  🔧  │ │  🎓  │    │
│  │Elect.│ │Plumb.│ │Tutor │    │
│  └──────┘ └──────┘ └──────┘    │
│  ┌──────┐ ┌──────┐ ┌──────┐    │
│  │  🧹  │ │  ❄️  │ │  🪚  │    │
│  │Clean.│ │  AC  │ │Carp. │    │
│  └──────┘ └──────┘ └──────┘    │
│                                 │
│  Top Providers Near You         │
│  ┌─────────────────────────┐    │
│  │ [IMG] Ramesh Elec. ✓   │    │
│  │       ⭐ 4.7  📍 2.4km  │    │
│  │       ₹200–800/job      │    │
│  │              [View →]   │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ [IMG] Sunita Plumb. ✓  │    │
│  │       ⭐ 4.5  📍 3.1km  │    │
│  │       ₹300–600/job      │    │
│  │              [View →]   │    │
│  └─────────────────────────┘    │
│                                 │
├────────┬────────┬────────┬──────┤
│  🏠   │  📋   │  💬 3  │  👤  │
│ Home   │Bookings│  Chat  │Profil│
└────────┴────────┴────────┴──────┘
```

**States:**
- **Loading:** Shimmer placeholders for category grid and provider cards
- **Empty (no providers nearby):** Illustration + "No providers found in your area yet. Try increasing your search radius."
- **Error:** "Couldn't load providers. [Retry]"
- **Offline:** Banner at top: "You're offline. Showing cached results."

---

### Screen 10: Service Discovery — List View

```
┌─────────────────────────────────┐
│  ← Electricians            [🗺️] │
│                                 │
│  [Rating ▼] [Distance] [Price]  │
│  Filter: Available only  [✓]    │
│                                 │
│  47 providers found             │
│                                 │
│  ┌─────────────────────────┐    │
│  │ [IMG] Ramesh Elec. ✓   │    │
│  │       ⭐ 4.7 (38)        │    │
│  │       📍 2.4 km away     │    │
│  │       ₹200–800 per job   │    │
│  │              [View →]   │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ [IMG] Deepak Elec.      │    │
│  │       ⭐ 4.2 (15)        │    │
│  │       📍 4.1 km away     │    │
│  │       ₹150–500 per job   │    │
│  │              [View →]   │    │
│  └─────────────────────────┘    │
│                                 │
│  [Load more]                    │
└─────────────────────────────────┘
```

**States:**
- **Loading:** 3 shimmer card placeholders
- **Empty:** "No electricians available nearby. Try a wider radius or check back later."
- **Error:** "Failed to load. [Retry]"

---

### Screen 12: Provider Profile

```
┌─────────────────────────────────┐
│  ←                         [⋮] │
│                                 │
│  [       Profile Image     ]    │
│                                 │
│  Ramesh Electricals  ✅ Verified │
│  Electrician · Kankarbagh       │
│  ⭐ 4.7  (38 reviews) · 112 jobs │
│                                 │
│  ₹200–800 per job               │
│  📍 Works within 15 km          │
│                                 │
│  About                          │
│  10 years of experience...      │
│                                 │
│  Services                       │
│  • Wiring  • AC Installation    │
│  • Switchboard Repair           │
│                                 │
│  Reviews (38)                   │
│  ─────────────────────          │
│  ⭐⭐⭐⭐⭐  "Great work!"          │
│  Rahul K. · 3 days ago          │
│  Provider: Thank you!           │
│  ─────────────────────          │
│  ⭐⭐⭐⭐   "On time."             │
│  Priya S. · 1 week ago          │
│                                 │
│  [See All 38 Reviews]           │
│                                 │
│  ┌─────────────────────────┐    │
│  │      Book Now →         │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

---

### Screens 13–16: Booking Flow (4-Step)

```
STEP 1: Date                        STEP 2: Time
┌──────────────────────┐           ┌──────────────────────┐
│ ← Book · Step 1 of 4 │           │ ← Book · Step 2 of 4 │
│ ━━━━━━━━░░░░░░░░░░░░ │           │ ━━━━━━━━━━━━░░░░░░░░ │
│                      │           │                      │
│  Select Date         │           │  Select Time         │
│                      │           │                      │
│  [ April 2026 ◁ ▷ ]  │           │  ┌──────┐ ┌──────┐   │
│  Mo Tu We Th Fr Sa Su│           │  │ 8:00 │ │ 8:30 │   │
│  ...calendar grid... │           │  │  AM  │ │  AM  │   │
│                      │           │  └──────┘ └──────┘   │
│  Selected: Apr 10 ✓  │           │  ┌──────┐ ┌──────┐   │
│                      │           │  │ 9:00 │ │[9:30]│ ← selected
│  [   Next →   ]      │           │  │  AM  │ │  AM  │   │
└──────────────────────┘           │  └──────┘ └──────┘   │
                                   │                      │
                                   │  [   Next →   ]      │
                                   └──────────────────────┘

STEP 3: Address + Notes             STEP 4: Confirm
┌──────────────────────┐           ┌──────────────────────┐
│ ← Book · Step 3 of 4 │           │ ← Book · Step 4 of 4 │
│ ━━━━━━━━━━━━━━━━━━░░ │           │ ━━━━━━━━━━━━━━━━━━━━ │
│                      │           │                      │
│  Job Address         │           │  Booking Summary     │
│  ┌──────────────┐    │           │  ─────────────────   │
│  │ Flat 3B,     │    │           │  Provider: Ramesh ✅  │
│  │ Gandhi Maidan│    │           │  Date:     Apr 10    │
│  └──────────────┘    │           │  Time:     9:30 AM   │
│  [📍 Use my location]│           │  Address:  Flat 3B   │
│                      │           │  Est. Price: ₹200–800│
│  Notes (optional)    │           │  ─────────────────   │
│  ┌──────────────┐    │           │                      │
│  │              │    │           │  By confirming, you  │
│  └──────────────┘    │           │  agree to our Terms  │
│  0/300 chars         │           │                      │
│                      │           │  [  Confirm Booking ]│
│  [   Next →   ]      │           │  ← change details    │
└──────────────────────┘           └──────────────────────┘
```

---

### Screens 17 & 19: Booking List + Detail (Customer)

```
BOOKING LIST                        BOOKING DETAIL
┌──────────────────────┐           ┌──────────────────────┐
│  My Bookings         │           │ ←  Booking Detail    │
│                      │           │                      │
│ [All][Active][Done]  │           │  Ramesh Elec. ✅      │
│                      │           │  Electrician         │
│ ┌────────────────┐   │           │                      │
│ │ Ramesh Elec.   │   │           │  Status: ●Accepted   │
│ │ Apr 10, 9:30AM │   │           │                      │
│ │ ● Accepted     │   │           │  Date:   Apr 10      │
│ │     [View →]   │   │           │  Time:   9:30 AM     │
│ └────────────────┘   │           │  Address: Flat 3B... │
│ ┌────────────────┐   │           │                      │
│ │ Sunita Plumb.  │   │           │  Notes: Bring tools  │
│ │ Apr 3, 2:00PM  │   │           │                      │
│ │ ✅ Completed    │   │           │  Est. Price: ₹200–800│
│ │   [Review →]   │   │           │                      │
│ └────────────────┘   │           │  [  Chat Provider  ] │
│                      │           │                      │
│                      │           │  [Cancel Booking]    │
└──────────────────────┘           └──────────────────────┘
```

**Status colour coding:**
- `pending` → Grey ●
- `accepted` → Blue ●
- `in_progress` → Orange ●
- `completed` → Green ✅
- `cancelled` → Red ✗
- `disputed` → Yellow ⚠️

---

### Screens 21 & 22: Chat List + Chat Screen

```
CHAT LIST                           CHAT SCREEN
┌──────────────────────┐           ┌──────────────────────┐
│  Messages            │           │ ← Ramesh Elec.  🟢   │
│                      │           │   Re: Booking Apr 10  │
│ ┌────────────────┐   │           │──────────────────────│
│ │[IMG] Ramesh E. │   │           │                      │
│ │ I'll arrive...  │   │           │  Apr 6, 9:00 AM      │
│ │ 9:30 AM  ●● 2  │   │           │ ┌──────────────────┐ │
│ └────────────────┘   │           │ │ Hello, are you   │ │
│ ┌────────────────┐   │           │ │ available 9 AM?  │ │
│ │[IMG] Sunita P. │   │           │ └──────────────────┘ │
│ │ Thank you!     │   │           │         You · 9:00AM │
│ │ 3 days ago     │   │           │                      │
│ └────────────────┘   │           │  ┌──────────────────┐│
│                      │           │  │ Yes, I'll be     ││
│                      │           │  │ there at 9:30    ││
│                      │           │  └──────────────────┘│
│                      │           │  Ramesh · 9:05AM     │
│                      │           │──────────────────────│
│                      │           │ ┌──────────────┐ [➤] │
│                      │           │ │ Type message  │ [📷]│
└──────────────────────┘           └──────────────────────┘
```

---

### Screen 23: Review Screen

```
┌─────────────────────────────────┐
│  ← Rate Your Experience         │
│                                 │
│  [Provider Image]               │
│  Ramesh Electricals             │
│  Booking: Apr 10, 9:30 AM       │
│                                 │
│  How was the service?           │
│                                 │
│      ☆  ☆  ☆  ☆  ☆             │
│   (tap a star to rate)          │
│                                 │
│  Write a review (optional)      │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │                         │    │
│  └─────────────────────────┘    │
│  0/500 characters               │
│                                 │
│  [      Submit Review    ]      │
│                                 │
│  [Skip for now]                 │
└─────────────────────────────────┘
```

---

## 🧑‍🔧 Provider Screens

---

### Screen 7: Provider Onboarding (5 Steps)

```
STEP 1: Category                    STEP 2: Details
┌──────────────────────┐           ┌──────────────────────┐
│ ← Setup · 1 of 5    │           │ ← Setup · 2 of 5    │
│ ━━━━░░░░░░░░░░░░░░░░ │           │ ━━━━━━━━░░░░░░░░░░░░ │
│                      │           │                      │
│  Select your trade   │           │  Your services       │
│                      │           │                      │
│  ○ Electrician       │           │  Sub-categories:     │
│  ○ Plumber           │           │  ☑ Wiring            │
│  ○ Carpenter         │           │  ☑ AC Installation   │
│  ○ Tutor             │           │  ☐ Switchboard Repair│
│  ○ Cleaner           │           │  ☐ Fan Installation  │
│  ○ AC Technician     │           │                      │
│  ○ Painter           │           │  Description         │
│  ○ Other...          │           │  ┌──────────────┐    │
│                      │           │  │              │    │
│  [   Next →   ]      │           │  └──────────────┘    │
└──────────────────────┘           │  [   Next →   ]      │
                                   └──────────────────────┘

STEP 3: Pricing                     STEP 4: Work Area
┌──────────────────────┐           ┌──────────────────────┐
│ ← Setup · 3 of 5    │           │ ← Setup · 4 of 5    │
│                      │           │                      │
│  Your pricing        │           │  Work radius         │
│                      │           │                      │
│  Min price (₹)       │           │   ◄─────●────────►  │
│  ┌──────────────┐    │           │         15 km        │
│  │ 200          │    │           │                      │
│  └──────────────┘    │           │  You'll receive jobs │
│                      │           │  within 15 km of     │
│  Max price (₹)       │           │  your location       │
│  ┌──────────────┐    │           │                      │
│  │ 800          │    │           │  📍 Your location:   │
│  └──────────────┘    │           │  Kankarbagh, Patna   │
│                      │           │                      │
│  Per:  ○ Job  ○ Hour │           │  [   Next →   ]      │
│                      │           └──────────────────────┘
│  [   Next →   ]      │
└──────────────────────┘

STEP 5: ID Verification
┌──────────────────────┐
│ ← Setup · 5 of 5    │
│                      │
│  Get Verified ✅      │
│                      │
│  Upload your Aadhaar │
│  card to get a       │
│  Verified badge      │
│                      │
│  [📁 Upload Document]│
│                      │
│  Takes 1–2 business  │
│  days to review      │
│                      │
│  [  Finish Setup  ]  │
│                      │
│  [Skip for now →]    │
└──────────────────────┘
```

---

### Screen 9: Provider Dashboard

```
┌─────────────────────────────────┐
│  Good morning, Ramesh 👋         │
│                                 │
│  Available for jobs             │
│                           [ ● ] │  ← availability toggle (prominent)
│                                 │
│  Earnings                       │
│  ┌────────┐ ┌────────┐ ┌──────┐ │
│  │ Today  │ │  Week  │ │Month │ │
│  │ ₹800   │ │ ₹4,200 │ │₹18K  │ │
│  └────────┘ └────────┘ └──────┘ │
│                                 │
│  New Requests (2)               │
│  ┌─────────────────────────┐    │
│  │ Priya S. · Wiring       │    │
│  │ Apr 10, 9:30 AM         │    │
│  │ Flat 3B, Gandhi Maidan  │    │
│  │  [Accept ✓]  [Reject ✗] │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ Rohit K. · AC Install   │    │
│  │ Apr 11, 2:00 PM         │    │
│  │  [Accept ✓]  [Reject ✗] │    │
│  └─────────────────────────┘    │
│                                 │
├────────┬────────┬────────┬──────┤
│  📊   │  📋   │  💬 1  │  👤  │
│ Dash.  │  Jobs  │  Chat  │Profil│
└────────┴────────┴────────┴──────┘
```

---

### Screen 20: Booking Detail (Provider)

```
┌─────────────────────────────────┐
│  ← Booking Request              │
│                                 │
│  Priya Sharma                   │
│  ⭐ Customer since Jan 2026      │
│                                 │
│  Service: Wiring                │
│  Date:    Apr 10, 9:30 AM       │
│  Address: Flat 3B, Gandhi Maidan│
│                                 │
│  Notes:   Please bring your     │
│           own tools             │
│                                 │
│  Est. Job: ₹200–800             │
│                                 │
│  [    💬 Message Customer   ]   │
│                                 │
│  [ ✅ Accept Booking ]          │
│  [ ✗  Reject ]                  │
│                                 │
│  ─── If already accepted ───    │
│  [ 🚀 Mark In Progress ]        │
│  [ ✅ Mark Completed ]          │
└─────────────────────────────────┘
```

---

## 🌐 Shared State Screens

---

### No Internet Screen (Global Overlay)

```
┌─────────────────────────────────┐
│                                 │
│         [📶 Icon]               │
│                                 │
│       No Internet               │
│                                 │
│  Check your connection and      │
│  try again.                     │
│                                 │
│  Cached data is shown below.    │
│                                 │
│       [  Try Again  ]           │
│                                 │
└─────────────────────────────────┘
```

---

### Generic Error Screen

```
┌─────────────────────────────────┐
│                                 │
│         [⚠️ Icon]               │
│                                 │
│    Something went wrong         │
│                                 │
│  We couldn't load this page.    │
│  Please try again.              │
│                                 │
│       [    Retry    ]           │
│       [  Go Home   ]           │
│                                 │
└─────────────────────────────────┘
```

---

## 🧩 Component Library

### Buttons
```
Primary:    Filled, brand colour, full width or auto, 48dp height
Secondary:  Outlined, brand colour border, same dimensions
Destructive: Filled, red/danger colour (Cancel, Reject)
Text:       No border/fill (Skip, "See All")
Loading:    Primary with CircularProgressIndicator replacing label
Disabled:   Primary at 40% opacity, non-tappable
```

### Cards
```
ProviderCard:  Avatar | Name + verified badge | Rating | Distance | Price | CTA
BookingCard:   Provider name | Date/time | Status chip | CTA
ChatListItem:  Avatar | Name | Last message preview | Time | Unread badge
NotifItem:     Icon by type | Title | Body | Time | Unread indicator
```

### Inputs
```
AppTextField:       Border + label + helper text + error text + max length counter
PhoneField:         Country flag + dial code prefix + number input
OtpField:           4 × single-char boxes, auto-advance
PriceRangeField:    Two AppTextFields (min/max) side by side
SliderField:        Label + Slider + current value display
```

### Feedback
```
LoadingShimmer:     Shimmer rectangle placeholders matching skeleton of real content
EmptyState:         Illustration + heading + subtext + optional CTA button
ErrorState:         Icon + heading + subtext + Retry button
SuccessSnackbar:    Green background, auto-dismiss after 3s
ErrorSnackbar:      Red background, auto-dismiss after 4s
ConfirmDialog:      Title + body + Cancel + Confirm (destructive styled)
```

### Status Chips
```
pending     → Grey     "Pending"
accepted    → Blue     "Accepted"
in_progress → Orange   "In Progress"
completed   → Green    "Completed"
cancelled   → Red      "Cancelled"
disputed    → Yellow   "Disputed"
```

---

## ⚙️ Flutter Implementation Notes

### Navigation (GoRouter)
```dart
// Route structure
/splash
/onboarding
/auth/phone
/auth/otp
/auth/role-select
/customer/home
/customer/discovery?category=electrician
/customer/provider/:id
/customer/booking/new?provider_id=:id
/customer/bookings
/customer/bookings/:id
/customer/review/:booking_id
/provider/dashboard
/provider/jobs
/provider/jobs/:id
/shared/chat
/shared/chat/:chat_id
/shared/notifications
/shared/profile
```

### State Management (Riverpod)
- `authProvider` — watches Firebase Auth state, navigates on change
- `userProvider` — fetches and caches `/users/me`
- `providerListProvider` — geo-query results with filter state
- `bookingListProvider` — paginated bookings for current user
- `chatProvider(chatId)` — Firestore stream for a single chat
- `notificationsProvider` — Firestore stream for notification center

### Real-time Listeners (StreamBuilder)
Use `StreamBuilder` for:
- Chat messages: `chats/{chatId}/messages` ordered by timestamp
- Booking status: `bookings/{bookingId}` — show status updates live
- Provider availability: `providers/{id}.availability`
- Unread chat count: aggregate query on `chats` where `participants` contains uid

### Performance
- Use `ListView.builder` (not `ListView`) for all lists
- Use `CachedNetworkImage` for all remote images
- Prefetch provider categories into Hive on first load; refresh weekly
- Set `keepAlive: true` on bottom nav pages to preserve scroll position

### Offline Support (Hive)
```
Box: 'user_profile'    — Current user's profile doc
Box: 'bookings_cache'  — Last fetched booking list
Box: 'categories'      — Category list (refreshed weekly)
Box: 'prefs'           — App preferences (onboarding seen, notification settings)
```

---

## ✅ Screen Completion Checklist

For every screen before marking done:
- [ ] Loading state (shimmer or spinner) implemented
- [ ] Empty state with illustration + message + CTA implemented
- [ ] Error state with retry button implemented
- [ ] Offline behaviour tested (shows cached data or offline message)
- [ ] Form validation errors shown inline (not via dialog)
- [ ] Keyboard does not overlap input fields (use `resizeToAvoidBottomInset`)
- [ ] Back navigation works correctly (GoRouter pop vs. pushReplacement)
- [ ] Tested on 360×640 (small screen) and 412×915 (standard screen)
- [ ] Text scales correctly at 1.3× font scale (accessibility)

---

*Wireframes Version 2.0 | Last Updated: April 2026*
