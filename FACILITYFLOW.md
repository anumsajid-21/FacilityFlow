# FacilityFlow — Feature & Status Overview

*Accurate as of the final verification phase. Only features actually implemented and tested are listed.*

---

## Authentication / RBAC

- **JWT auth** (`@nestjs/jwt`) with `access_token`, validated by `JwtAuthGuard` on all `/api/v1` routes.
- **Password policy enforced on the backend** (`RegisterDto`): `bcrypt`-hashed, must be ≥ 8 chars with 1 uppercase, 1 lowercase, 1 number and 1 special character. The register form mirrors the same rules with Zod.
- **Roles:** `ADMIN`, `HIRING_ORG`, `PROVIDER`. Enforced on both sides:
  - Frontend: sidebar links filtered by role; unmatched routes redirect to `/login`.
  - Backend: `RolesGuard` returns **403** for role mismatch (e.g., a provider hitting `/facilities/buildings` or `/admin/*`).
- Registration of `HIRING_ORG` auto-creates an Organization + an `organizationMember(ADMIN)`; registration of `PROVIDER` auto-creates a Provider (verified by default).
- Login/register throttled in-memory (`@Throttle`, per IP) to limit abuse.
- Existing seeded demo accounts keep working: `hiring@facilityflow.app`, `provider@facilityflow.app`, `admin@facilityflow.app`.

## Features by Role

### Admin
- **Admin dashboard** (`/admin`, ADMIN-only) with live counts: Organizations, Providers, Service Requests, Active Contracts.
- Tabs: Organizations, Providers (with verification-status update via modal), Service Requests, Buildings, Users.
- **Recent activity** from the audit log (`AuditService`).
- Admin-only access is enforced on the backend (`@Roles("ADMIN")`); verified with 403 tests for non-admin tokens.

### Hiring Organization
- Facilities (buildings/floors/areas), Service Requests (create, submit, archive).
- View providers and their reviews; **offers quotations** (compare and accept).
- **Contracts** (auto-created on quotation acceptance; active/archived).
- **Jobs** — create, schedule, view details; **approve completed jobs** and **request rework** with a reason.
- **Reviews** — submit 1–5 star review + comment after an approved job; see a table of submitted reviews; duplicate reviews blocked.
- **Invoices** — view all, open detail, record payment (amount, date, reference, method) → invoice flips to **Paid**.
- **Notifications** — view and mark read / mark-all-read.

### Provider
- **Service Requests** browse (open requests available for quoting via `/quotations/open-requests`).
- **Quotations** — create and submit (price, workers, duration, terms, notes); withdraw drafts; view their quotations.
- **Contracts** — list their active contracts.
- **Workers** — manage team; assign workers to jobs (overlap-enforced).
- **Jobs** — start, upload proof of work (provider note, completion note, before/after photos), complete, and **resubmit after rework**.
- **Invoices** — see issued invoices and their statuses; provider can update status (`ISSUED`/`DRAFT`/…).
- **Reviews** — see reviews written about them (average + list).
- **Notifications** — read and mark notifications.

### Worker
- Workers are managed by their provider; worker assignments are stored per job (`WorkerAssignment`). There is no separate worker login — worker interaction happens through the provider (documented limitation).

---

## Main Workflows (implemented & tested end-to-end)

1. **Registration → Login** (weak password rejected; strong password accepted; seeded accounts still work).
2. **Request → Quotation → Contract:** Org creates a service request → Provider sees it (open) → Provider submits a quotation → Org accepts → Contract auto-created (with `ContractVersion`), competing quotations rejected.
3. **Job signup → Worker → Completion:** Org creates a job on the contract → Provider creates / assigns a worker → Provider starts job (`Scheduled/Assigned → In Progress`) → uploads proof (notes + before/after photos) → completes job (`In Progress → Completed`).
4. **Approval / Rework:** Org can **approve** a completed/awaiting-approval job (transitions, generates invoice) or **request rework** (sets `REWORK`, records `ReworkRequest` with attempt number). Provider can `start` a `REWORK` job and resubmit proof → org approves.
5. **Invoice → Payment:** Approval auto-issues an invoice (`INV-<CONTRACT>-<JOB>`, provider/org, service, amount, due date). Hiring org records payments; once paid in full the invoice status becomes `PAID`.
6. **Review:** After an approved job, the org submits a 1–5 star review + comment; duplicate/unauthorized reviews are blocked (409/403).
7. **Notifications:** In-app notifications are created for quotations, worker assignment, job completion, approval, rework, payment and invoice-paid. Users list and mark them read.

---

## Database-connected functionality

All data is persisted via **Prisma / PostgreSQL** (embedded dev DB, `postgres:5432`). Models include: `User`, `Organization`, `Provider`, `Building`, `Floor`, `Area`, `ServiceRequest`, `Quotation`, `Contract`, `ContractVersion`, `Job`, `Worker`, `WorkerAssignment`, `ProofOfWork`, `Approval`, `ReworkRequest`, `Invoice`, `Payment`, `Review`, `Notification`, `AuditLog`, and more. Every workflow is verified with real DB round-trips (see `backend/e2e-test.mjs`).

---

## Implemented (in this final phase)

- **Job rework:** a `REWORK` job can be restarted and proof resubmitted (`start` accepts `REWORK`).
- **Notifications for counterparts** (not just the actor): provider completion → org notified to approve; org approval / rework → provider notified; worker assignment → org notified; quotation submit → org notified; payment recorded / invoice paid → provider notified.
- **Invoices + Payments UI:** detail modal (provider, organization, service, amount, due date, status, recorded-payment list with date/amount/reference/method) and a **record payment** panel for hiring org.
- **Reviews:** backend `GET /reviews` (hiring-org) + frontend table **Hiring Organization | Provider | Rating | Comment | Date**; provider auto-fills from selected job.
- **Notifications UI:** `/notifications` route + sidebar entry; read / mark-all-read; unread count.
- **Admin dashboard:** `/admin` route + sidebar entry; live counts, provider verification update, service requests, buildings, organizations, users, and audit-driven recent activity. Admin-only enforcement re-verified (403).

---

## Fixed (major fixes during this task)

- **Invoice field mismatch:** `taxAmount` → `tax` (Prisma `Invoice.tax`).
- **Reviews crash on provider detail:** `byProvider()` returns `{ items }` — frontend consumes `items ?? []`; no crash on empty.
- **Provider could not browse open requests** (403 on `/service-requests`); added `/quotations/open-requests` and used it in the Provider Quotations browse tab.
- **Proof-of-work photo uploads rejected** by `forbidNonWhitelisted` validation — added `@IsArray()` DTO fields for `beforePhotoIds`/`afterPhotoIds`.
- **Reviews list 500:** removed a non-existent `job` include on `Review` (no such Prisma relation).
- **Review submission 400/500:** added `jobId`/`providerId` to `ReviewDto` so whitelist validation accepted the body.
- **Invoice payment `finalStatus` scope bug** and notifications scope references fixed.
- **Frontend type-checks** (Tabs `key`, `addPayment` optional `date`) so `next build` passes.
---

## Remaining Issues / Limitations

- **No gateway / no real payment integration** — payments are manually recorded (by design).
- **No standalone Worker login** — workers are managed by providers, not authenticated directly.
- **Rate limiting** (auth requests/min per IP) is in-memory and can momentarily block rapid account creation in dev; safe for a single production instance but not horizontally scalable.
- **Notifications are not real-time** (poll on page load; no WebSocket/SSE).
- Auto-creating an `APPROVED` approval on job completion can make approval history misleading even though manual org approval is still expected (see "Suggested fixes").

---

## Suggested fixes for remaining issues

- **Honor manual approval semantics:** do not create an `APPROVED` approval on completion; record a `SUBMITTED` rework-able entry and only write `APPROVED` when the hiring org actually approves.
- **Make approve/payment idempotent under concurrency** (firmer DB-level guards than the current 403/409 checks).
- **Add a "Worker" role / login** if standalone worker interaction is desired.
- **Swap the in-memory `RateLimitGuard`** for a shared store (e.g., Redis) before scaling.
- **Use WebSockets/SSE** so notifications arrive without a refresh.
- **Add image previews** for proof-of-work photos in the UI (currently shown as download links).

---

## Recommended future features / improvements

- Payment gateway integration (Stripe/etc.) with real capture + receipts.
- Enable the existing plug-in `EmailProvider` (`EMAIL_PROVIDER=smtp`) for transactional email.
- Expose service-request matching suggestions (the `matching` module exists).
- Calendar and recurring-contract scheduling UI.
- CSV/PDF invoice export via the `pdfkit` dependency.
- Audit-log viewer with entity drill-down for compliance.
- i18n / multi-currency support, soft-archiving of closed contracts, CI test coverage.

---

### Verification status

- Backend build: **PASS** (`npm run build`).
- Frontend build + type-check: **PASS** (`npm run build`).
- Running application: backend on `http://localhost:3001`, frontend (`next start`) on `http://localhost:3000`.
- Full end-to-end workflow **tested against the real DB** (`backend/e2e-test.mjs`) — all checks green.
