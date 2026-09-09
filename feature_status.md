# FacilityFlow — Feature Status Report
> Generated: 2026-09-07 | E2E Test Status: ✅ ALL PASSING (e2e-test.mjs + e2e-flow-test.mjs)

---

## ✅ Features Currently Working (Production-Ready)

### 🔐 Authentication & Authorization
- [x] User registration with strong-password enforcement (weak passwords rejected with 400)
- [x] JWT-based login for all roles (`HIRING_ORG`, `PROVIDER`, `ADMIN`, `WORKER`)
- [x] Role-Based Access Control (RBAC) on every API endpoint via `@Roles()` guards
- [x] Account activation check on every request (revoked accounts stop working immediately)
- [x] Anonymous request rejection (401)
- [x] Cross-role endpoint blocking (e.g., providers blocked from org facilities → 403)
- [x] Worker JWT login with scoped `workerId` attached to every request

---

### 👤 User Settings
- [x] Fetch own profile (`GET /settings/me`)
- [x] Update profile name, phone, avatar URL (`PATCH /settings/profile`)
- [x] Change password (with current-password verification and strength rules)
- [x] Fetch notification preferences (`GET /settings/notifications`)
- [x] Update notification preferences — `inApp`, `email` toggles, per-category settings
- [x] Settings UI: tabbed page (Profile / Security / Notifications / Business & Payouts)
- [x] Optimistic UI updates with instant global auth store synchronization

---

### 🏢 Organization & Facilities Management (Hiring Org)
- [x] Create, list, and archive **Buildings** (with address, city, type, floor count)
- [x] Add **Floors** to buildings
- [x] Add **Areas** to floors (with category tag)
- [x] Building soft-delete (isArchived flag)
- [x] Facilities list/detail pages with full CRUD UI

---

### 📋 Service Requests
- [x] Create service requests (all optional fields: category, floor, area, budget, preferred date, frequency, priority)
- [x] Empty-string foreign key sanitization (no more 500 crashes on optional fields)
- [x] Submit draft → OPEN transition
- [x] Archive service requests
- [x] Service request list with status badges and filters
- [x] Service request detail page
- [x] **Suggested Provider Matches** displayed on service request detail (matching by category/location)

---

### 💼 Provider Management
- [x] Provider registration and profile (name, description, contact info, logo, service areas)
- [x] Provider profile fields: bank name, account number, routing number (for payouts)
- [x] Provider public profile page
- [x] Provider list for hiring orgs (filterable by category, city)
- [x] Provider shortlisting (ProviderShortlist model)
- [x] Provider verification status display (`UNVERIFIED`, `UNDER_REVIEW`, `VERIFIED`, etc.)

---

### 📄 Quotations
- [x] Provider creates quotation on an open service request
- [x] Provider submits quotation (DRAFT → SUBMITTED)
- [x] Provider withdraws quotation
- [x] Hiring org sees quotations with provider name and request info
- [x] Hiring org accepts quotation → auto-creates contract
- [x] Quotation detail (price, labor/material cost, SLA, warranty, expiry)
- [x] Open requests list for providers to browse

---

### 📝 Contracts
- [x] Auto-generated contract on quotation acceptance
- [x] Contract detail (org, provider, building, price, dates, SLA, payment terms)
- [x] Contract list for both sides
- [x] Contract versioning (ContractVersion model with snapshot + changes)
- [x] Contract status lifecycle (DRAFT → ACTIVE → EXPIRING → EXPIRED/CANCELLED/TERMINATED)

---

### 🔨 Jobs
- [x] Create jobs on active contracts (with building, floor, area, time slots)
- [x] Job list — scoped per role:
  - Hiring org: sees jobs on their contracts
  - Provider: sees jobs from their contracts
  - **Worker: sees only jobs assigned to them** ✅
- [x] Job detail with full related data (contract, workers, checklists, proof, approvals, invoices)
- [x] Job status lifecycle: `SCHEDULED → ASSIGNED → IN_PROGRESS → COMPLETED → AWAITING_APPROVAL`
- [x] **Start job** (`POST /jobs/:id/start`)
- [x] **Complete job** (`POST /jobs/:id/complete`) — auto-creates approval record
- [x] **Rework** flow: org requests rework, provider restarts, resubmits proof, org re-approves
- [x] Job calendar view (daily)
- [x] Job detail page with status badges and action buttons

---

### 👷 Worker Role (Phase 3 — Complete)
- [x] `WORKER` role in Prisma enum and JWT strategy
- [x] Provider adds workers (name, skills, certifications, availability)
- [x] **Email invitation** — provider sends invite, auto-provisions worker user account with temp credentials (`Worker123!`)
- [x] Worker app login (full JWT authentication)
- [x] Worker sees only assigned jobs (scoped query enforced)
- [x] Provider can **activate / deactivate** workers (`PATCH /workers/:id/status`)
- [x] Worker profile linked to User account (`userId` on Worker model, invite status badge)
- [x] Workers management page: invite modal, login status indicator, activate/deactivate toggles
- [x] **Mobile job view** (`/m/jobs`) — start, photo upload, complete job flow
- [x] Worker can submit proof of work on assigned jobs
- [x] Worker-aware sidebar navigation (Dashboard, Jobs, Notifications, Settings)

---

### ✅ Job Checklists
- [x] Create checklists (with items, category, provider)
- [x] Fetch checklists by category
- [x] Save checklist results per job (interactive checkboxes)
- [x] Fetch job checklist results
- [x] Checklist card on job detail page (completion % badge for hiring org, interactive for provider)

---

### 📸 Proof of Work
- [x] Provider/Worker submits proof (`POST /jobs/:id/proof`)
- [x] Before/after photo upload (linked via File IDs)
- [x] Provider note and completion note fields
- [x] Worker name recorded on proof
- [x] Hiring org views submitted proof
- [x] Proof of work card on job detail page with photo previews

---

### 🗳️ Approvals & Rework
- [x] Hiring org approves completed job
- [x] Hiring org requests rework (with reason)
- [x] Approval history retrievable per job
- [x] ReworkRequest model with attempt tracking and resolution
- [x] Notification triggered to org on job completion and to provider on approval

---

### 🧾 Invoices
- [x] Auto-generated invoice on job approval
- [x] Invoice detail (provider, organization, due date, line items: amount, tax, discount, total)
- [x] Invoice status transitions: `DRAFT → ISSUED → PAID → OVERDUE`
- [x] Manual status update
- [x] **PDF Invoice Export** — downloadable PDF via `GET /invoices/:id/pdf` (pdfkit)
- [x] "Download PDF" button in invoice detail modal
- [x] Invoice list for both org and provider roles
- [x] Invoice binary stream bypass (TransformInterceptor crash fix applied)

---

### 💳 Payments
- [x] Record payment against invoice (`POST /invoices/:id/payments`)
- [x] Payment reference, method, date fields
- [x] Invoice auto-transitions to `PAID` when fully settled
- [x] Payment list visible on invoice detail

---

### ⭐ Reviews
- [x] Hiring org submits review after job approval (quality, timeliness, professionalism, value, overall rating, comments)
- [x] Duplicate review blocked (409)
- [x] Provider review summary (by provider ID)
- [x] Reviews visible to org, blocked for provider (403)

---

### 🔔 Notifications
- [x] In-app notification creation on key events (job scheduled, worker assigned, job completed, rework, invoice issued, payment recorded)
- [x] Notification list with unread count
- [x] Mark single notification as read
- [x] Mark all notifications as read
- [x] Notifications page in dashboard
- [x] SMTP email notification with ConsoleEmailProvider fallback when SMTP unconfigured
- [x] Notification preference respected (inApp / email toggles)

---

### 📁 File Uploads
- [x] File upload endpoint (`POST /files/upload/:kind`)
- [x] File kinds: `PROVIDER_DOCUMENT`, `CONTRACT_DOCUMENT`, `JOB_PHOTO`, `SERVICE_REPORT`, `SERVICE_REQUEST_ATTACHMENT`, `OTHER`
- [x] File download endpoint
- [x] Photo upload in mobile worker flow

---

### 🛡️ Admin Panel
- [x] Admin dashboard (total counts: organizations, providers, service requests, active jobs)
- [x] Admin recent activity log
- [x] Admin lists: organizations, providers, service requests, buildings
- [x] Admin-only endpoint enforcement (403 for other roles)
- [x] Admin login with seeded credentials (`admin@facilityflow.app`)

---

### 📊 Analytics / Dashboards
- [x] Hiring org dashboard (overview metrics)
- [x] Provider hiring dashboard (isArchived filter applied)
- [x] Role-specific dashboard data scoping

---

### 🏗️ Provider Verification Documents
- [x] Upload verification documents (`VerificationDocument` model)
- [x] Document review workflow (admin marks reviewed, sets status)
- [x] `VerificationStatus` on Provider: `UNVERIFIED → DOCUMENTS_SUBMITTED → UNDER_REVIEW → VERIFIED/REJECTED/SUSPENDED`

---

### 🎨 UI / UX
- [x] Earth + Industrial theme: warm sage, deep pine, charcoal, brass color palette
- [x] Reusable component library: `Button`, `Card`, `Modal`, `Field`, `Input`, `Badge`, `StatusBadge`, `PageHeader`, `EmptyState`, `Loading`
- [x] Collapsible/responsive sidebar with mobile drawer
- [x] Toast notification system
- [x] Mobile-optimized worker job flow (`/m/jobs`)
- [x] Status badges across all entity lists

---

## ❌ Features Not Yet Implemented

### Phase 4 — Planned but Not Built

#### 📋 Compliance & Verification Queue
- [x] Admin approval queue UI for verification documents
- [x] "Verified" badge on provider cards visible to hiring orgs
- [x] Document expiry tracking and re-submission flow
- [x] Bulk approve/reject with admin notes

#### 💬 In-App Messaging
- [x] `MessageThread` and `Message` models in schema
- [x] Thread creation (between hiring org and provider on a contract/request)
- [x] Message polling-ready API with read tracking
- [x] Unread message count API
- [x] Message inbox UI page

#### 📉 SLA & Performance Tracking
- [x] `SlaPolicy` and `JobSla` models in schema
- [x] SLA deadline calculation on job creation (based on contract SLA string)
- [x] Breach detection API and periodic evaluator
- [x] SLA status available for job cards/API
- [x] SLA compliance score in analytics scorecards

#### 🔁 Recurring Services / Contract Schedules
- [x] `ContractSchedule` model in schema
- [x] Periodic recurring job generator (auto-creates jobs based on contract frequency)
- [x] Generated jobs appear in the existing calendar view
- [x] Pause/resume schedule controls

#### 📈 Org Analytics Dashboard
- [x] Spend-over-time chart
- [x] Spend breakdown by category
- [x] Spend breakdown by provider
- [x] Provider performance scorecards (avg rating, SLA breaches, rework rate)
- [x] Analytics date-range API (defaults to last 365 days)
- [x] Export analytics as CSV

---

### Phase 5 — Seed Data & Demo

#### 🌱 Comprehensive Seed Data
- [x] Extended `backend/prisma/seed.mjs` with realistic multi-org, multi-provider, multi-worker data
- [x] Pre-seeded contracts, jobs, invoices, reviews across multiple providers
- [x] Multiple worker accounts with varied skill sets
- [x] Demo credentials printed as a table at end of seed run

---

### Other Missing / Nice-to-Have Features

#### 🔑 Security & Access
- [ ] Worker password change flow (currently uses default `Worker123!`)
- [ ] Worker-specific settings page (change password, update profile photo, name, phone)
- [ ] Refresh token support (current JWTs have no refresh flow)
- [ ] Password reset via email (forgot password flow)

#### 📱 Mobile Worker App
- [ ] Push notification support for workers (job assignment alerts)
- [ ] Worker location check-in (GPS stamp on job start)
- [ ] Offline mode (cache jobs for areas with no connectivity)
- [ ] Worker availability calendar (worker sets own availability)

#### 💼 Provider Self-Service
- [ ] Provider onboarding wizard (step-by-step profile completion)
- [ ] Provider service area management UI (currently backend-only)
- [ ] Provider document upload UI (for verification)
- [ ] Certificate expiry reminders (via notification cron)

#### 🏢 Organization Self-Service
- [ ] Org member management (invite org users, assign roles within org)
- [ ] Asset management full UI (Assets exist in schema, no frontend page)
- [ ] Asset history timeline view
- [ ] Multi-building dashboard/map view

#### 📬 Notifications
- [ ] Real SMTP configuration UI in settings (currently requires env vars)
- [ ] Notification center with grouping and pagination
- [ ] Email digest mode (daily/weekly summary email)
- [ ] Browser push notifications (Web Push API)

#### 🔍 Search & Filters
- [ ] Global search across contracts, jobs, providers, invoices
- [ ] Advanced filters on all list pages (date ranges, status multi-select)
- [ ] Provider discovery map view (pin providers on a map)

#### 📤 Export & Reporting
- [ ] Export job report as PDF
- [ ] Export contract as PDF/Word
- [ ] Bulk invoice export (zip of PDFs)
- [ ] Monthly summary report email

---

## 📊 Progress Summary

| Phase | Description | Status |
|---|---|---|
| Phase 0 | Critical Bug Fixes | ✅ Complete |
| Phase 1 | Settings Module | ✅ Complete |
| Phase 2 | Surface Backend Features (matching, PDF, checklists, SMTP) | ✅ Complete |
| Phase 3 | Worker Role & Field Management | ✅ Complete |
| Phase 4 | New Feature Modules (Messaging, SLA, Recurring, Analytics) | ✅ Complete |
| Phase 5 | Seed Data & Demo Credentials | ✅ Complete |

**E2E Coverage**: 60 passing assertions across `e2e-test.mjs` + 23 passing across `e2e-flow-test.mjs`.
