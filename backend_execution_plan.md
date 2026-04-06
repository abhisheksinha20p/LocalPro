# LocalPro Backend Execution Plan (Separate)

## Scope
- Build and harden the LocalPro backend for MVP using Firebase Auth, Firestore, Cloud Functions (Node.js 20), Storage, and FCM.
- Deliver secure, versioned `/api/v1` endpoints aligned with PRD/API/schema docs.

## Architecture Baseline
- API style: REST over Cloud Functions with standardized response envelope.
- Auth: Firebase ID token (Bearer), refresh flow, OTP login.
- Data: Firestore collections (`users`, `providers`, `bookings`, `chats`, `reviews`, `notifications`, `categories`).
- Realtime: Firestore listeners for chat and booking updates.
- Security: role-aware Firestore rules, App Check, upload validation, rate limiting.

## Phased Plan (12 Weeks)

### Week 1 - Foundation
- Initialize Functions project structure (route modules, middleware, validators, services).
- Implement shared middleware: auth verification, error handling, request-id logging.
- Enforce API response envelope (`success/data/meta` and `success/error`).
- Configure environments (dev/prod), Firebase Emulator Suite, CI workflow.

### Week 2 - Authentication and Users
- Implement:
  - `POST /auth/send-otp`
  - `POST /auth/verify-otp`
  - `POST /auth/refresh`
  - `POST /auth/logout`
- Add `GET /users/me`, `PUT /users/me`, profile photo upload endpoint.
- Validate phone numbers in E.164 and enforce OTP throttling.

### Week 3 - Provider Module
- Implement provider discovery/list/detail/create/update endpoints.
- Add availability toggle endpoint.
- Add provider photo and verification-doc upload flows.
- Validate `category`, `sub_categories`, `price_range`, `work_radius_km`.
- Support geo-search with `location.geoHash` and required indexes.

### Week 4 - Booking Module
- Implement booking create/list/detail/status update/dispute endpoints.
- Enforce booking state machine and role-based transitions.
- Enforce cancellation reasons and dispute evidence handling.

### Week 5 - Chat and Messaging APIs
- Implement chat create/list/history/send/read endpoints.
- Support text and image message payloads.
- Update chat summaries (`last_message`, `last_updated`, unread state).

### Week 6 - Reviews and Ratings
- Implement review create and provider review list endpoints.
- Enforce one-review-per-booking and completed-booking-only constraints.
- Implement provider reply endpoint and permission checks.

### Week 7 - Notification APIs
- Implement notification list endpoint with pagination.
- Implement mark-single-read and mark-all-read endpoints.
- Ensure payloads contain navigation-safe IDs only.

### Week 8 - Cloud Function Automations
- Implement triggers/schedulers:
  - `onBookingCreated`
  - `onBookingStatusChanged`
  - `onReviewCreated`
  - `onMessageCreated`
  - `onProviderVerified`
  - `cleanupExpiredBookings` (scheduled)
  - `generateEarningsSummary` (scheduled)

### Week 9 - Admin APIs
- Implement admin provider verification queue and verification action.
- Implement dispute queue and dispute resolution action.
- Implement user search/deactivate APIs.
- Implement analytics and broadcast notifications APIs.

### Week 10 - Security Hardening
- Finalize Firestore/Storage rules with least privilege.
- Restrict sensitive assets (`verification_doc`) to admin-only reads.
- Enforce upload type/size limits and input sanitization.
- Add anti-abuse controls and structured audit logs.

### Week 11 - Testing and Quality Gates
- Unit tests for handlers, validators, and business rules.
- Emulator integration tests for critical flows and permission boundaries.
- Negative tests for invalid transitions, duplicate review, unauthorized access.

### Week 12 - Release Readiness
- Performance tuning (index and query optimization).
- SLO checks: p95 API < 300ms, stable error rates.
- Staging soak test, deployment checklist, rollback/runbook docs.

## Non-Functional Targets
- API p95 response time: < 300ms.
- OTP abuse resistance: 5 OTP/hour per phone + request throttling.
- Security posture: App Check enabled, strict rules, no permissive writes.
- Reliability: Cloud Function retries and idempotent trigger handlers.

## Deliverables
- Production-ready `/api/v1` backend endpoints.
- Firestore rules + indexes committed and deployed.
- Cloud Function trigger suite for booking/chat/review lifecycle.
- Automated tests in CI with Emulator Suite.
- Operational documentation (runbook, monitoring, incident response).

## Definition of Done
- All planned endpoints implemented with validation, auth, and role checks.
- Emulator and CI test suites passing.
- Security checks and rules verified in staging.
- Observability enabled (logs, metrics, error alerts).
- Documentation updated for API contracts and operations.

## References
- `doc/LocalPro_Updated_Dev_Plan.md`
- `doc/localpro_api_design_v2.md`
- `doc/firebase_schema_localpro_v2.md`
- `doc/localpro_prd_v2.md`
