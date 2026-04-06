# LocalPro Mobile App Execution Plan (Separate)

## Scope
- Build the React Native Android MVP for both Customer and Provider journeys using Expo.
- Ship onboarding, discovery, booking lifecycle, chat, reviews, notifications, and provider dashboard.
- Ensure robust loading, empty, error, and offline behavior across all data screens.

## Technical Baseline
- Framework: React Native (Expo).
- State management: Zustand (lightweight state) + Context API (auth/session).
- Navigation: Expo Router (file-based routing).
- Backend integration: Firebase Auth, Firestore, Storage, FCM.
- Offline cache: AsyncStorage.
- Networking/utility: Axios, React Query, Expo Image Cache.

## Phased Plan (12 Weeks)

### Week 1 - App Foundation
- Set up Expo project with TypeScript.
- Define design tokens (colors, spacing, typography, status colors) in a theme file.
- Build shared components (`Button`, `TextField`, `Card`, `LoadingState`, `ErrorState`, `EmptyState`).
- Configure Expo Router file-based routing and role-based root navigation.

### Week 2 - Auth and Onboarding
- Implement splash, onboarding carousel, phone OTP, OTP verify, and role selection screens.
- Implement customer profile setup and provider onboarding entry flow.
- Persist onboarding seen state and auth session bootstrap.
- Register and sync `fcm_token` on login.

### Week 3 - Customer Home and Discovery
- Build customer home with dynamic categories and search.
- Implement provider listing with filters/sort and pagination.
- Add provider profile details with trust indicators (rating, verified, reviews).
- Wire geo-based discovery with radius and category filters.

### Week 4 - Booking Flow (Customer)
- Implement 4-step booking wizard (date, time, address/notes, confirm).
- Add booking list and booking detail with live status updates.
- Implement cancel and dispute entry points with validation.

### Week 5 - Provider Core Experience
- Implement provider dashboard with prominent availability toggle.
- Build provider job list/detail with Accept/Reject/In Progress/Completed actions.
- Add earnings summary cards and active request handling.

### Week 6 - Chat Experience
- Build chat list with unread counts.
- Build real-time chat thread with text/image messages.
- Implement image upload + message send flow.
- Implement read state and timestamp grouping UX.

### Week 7 - Reviews and Notifications
- Implement review screen gated to completed bookings.
- Add review listing/reply surface where applicable.
- Build notification center with read/unread and read-all actions.
- Add deep-link navigation from notification payload.

### Week 8 - Offline and Resilience
- Cache profile, categories, and booking history in Hive.
- Add global no-internet overlay and stale-data indicators.
- Implement retry UX patterns for failed fetches/actions.

### Week 9 - Performance Optimization
- Optimize re-renders with React.memo and useMemo.
- Improve startup path and reduce blocking init work.
- Tune image cache and memory usage for low-end devices.
- Validate bundle size target and remove bloat.
- Profile with React Native Debugger or Flipper.

### Week 10 - Testing
- Unit tests for utility functions and state mutations.
- Component tests for shared components and screens using React Native Testing Library.
- Integration tests for critical journeys:
  - Customer: register -> discover -> book -> chat -> review
  - Provider: register -> accept -> in_progress -> complete -> earnings
- Regression checks on small and standard screen sizes.

### Week 11 - UX Polish and Accessibility
- Ensure all list/data screens have loading/empty/error states.
- Validate keyboard-safe forms and back navigation behavior.
- Verify text scaling (1.3x), touch targets, and readability.
- Final pass on copy consistency and interaction polish.

### Week 12 - Release Readiness
- End-to-end UAT on Android 9+ devices (including low-RAM phones).
- Crashlytics + analytics event verification.
- Staging rollout via App Distribution and smoke test.
- Final release checklist and launch sign-off.

## Screen Coverage Targets
- Shared: splash, onboarding, auth, role select, no-internet, generic error.
- Customer: home, discovery list/map (map can be post-MVP), provider profile, booking flow, booking list/detail, chat, review, notifications, profile.
- Provider: onboarding, dashboard, jobs list/detail, chat, notifications, profile.

## Non-Functional Targets
- Cold start: < 2 seconds.
- Provider list load: < 1.5 seconds.
- Chat delivery UX latency: < 500ms perceived update.
- APK size: < 25 MB.
- Crash-free sessions: > 99.5%.

## Deliverables
- Role-aware React Native app with complete MVP journeys.
- Reusable component library for consistent UX.
- Offline cache behavior for essential data via AsyncStorage.
- Unit + component test suite.
- Release-ready Android build via Expo EAS Build.

## Definition of Done
- All P0 screens implemented with loading/empty/error/offline handling.
- Core user journeys pass integration tests.
- Performance and device compatibility targets met.
- No critical/high bugs in staging.
- Documentation updated for routes, providers, and feature behavior.

## References
- `doc/LocalPro_Updated_Dev_Plan.md`
- `doc/localpro_ui_wireframes_v2.md`
- `doc/localpro_prd_v2.md`
- `doc/localpro_api_design_v2.md`
