# FacilityFlow — Feature Modules & Visual Direction

Senior software engineer + PM (20+ yrs combined) continuing FacilityFlow (Next.js/NestJS/Prisma/PostgreSQL). Additive only — don't touch prior bug-fix/settings/worker-role work. After each phase: re-run `e2e-test.mjs` + `e2e-flow-test.mjs`, confirm no regressions.

---

## Phase 0 — Audit `providerId` on ServiceRequest
Correct flow: request → multiple quotations → org accepts one → `Contract` links the provider, not the request. Check if `providerId` on `ServiceRequest` is dead scaffolding, a denormalized "winning provider" convenience field, or backs a real "direct hire" feature. Remove if unused; if kept, make it write-only from contract-creation logic and rename to `awardedProviderId`. Report which case it was.

## Phase 1 — Visual direction: "Ocean & Sand"
Replace Earthy Industrial via CSS variables/tokens (no hardcoded hex):
- Sidebar: `#0E3B4D` · inactive icons `#7FA9B8`
- Primary accent (buttons/CTAs/active nav): `#F2A65A` — reserve for primary actions only, secondary buttons stay neutral/outlined
- Background: `#FBF6EF` · Cards: white, soft shadow `0 1px 4px rgba(0,0,0,.06)` instead of flat border
- Text: `#1F2D33` (body) / `#8C8171` (muted)
- Verified badge: bg `#DCEEF0` text `#0E5B6F` · Danger/breach: standard red (never reuse orange — orange=action, red=alert)
Apply consistently across sidebar, buttons, badges, stat cards, empty states.

## Phase 2 — Notification Bell (horizontal top bar)
New top bar on every authenticated page: title/breadcrumb left, bell icon + unread-count badge right (e.g. "2"). Click opens dropdown with latest 5 notifications + "View all" link. Reuse existing notification data/polling — UI only. Keep primary nav (Dashboard/Requests/Jobs/etc.) in the sidebar, not this bar, so it can become a mobile bottom tab bar later without reworking notifications.

## Phase 3 — Payment & Activity History
- Org "Payment history" page: all payments across contracts/providers, filterable by date/provider/category, CSV export.
- Provider "Earnings history" page: mirror, provider-side.
- Contract/Job detail: scoped chronological activity timeline (status changes, approvals, rework, payments) — reuse existing audit log model, simplify for non-admin roles.
- Read-only, derived from existing tables (Invoice, Payment, ReworkRequest, Approval) — no new source-of-truth model.

## Phase 4 — Seed Data
Extend the existing seed script (not a new one): multi-org/provider/worker data, varied statuses (verification, invoices, jobs incl. rework and SLA breach), enough spread-out payment history to make Phase 3 pages look realistic. Print seeded login credentials per role at the end.

---

## Ground Rules
- No paid third-party APIs.
- Additive Prisma migrations only — no dropping/renaming existing columns.
- Match existing folder structure/component library; extend design tokens, no one-off styling.
- If ambiguous, make the senior call and state your assumption; only stop and ask if it risks breaking existing functionality.

## Final Step
Before finishing: boot backend + frontend, confirm no crashes/unhandled errors, and click through login + one page per role. Fix any breakage before handing back — never leave the app in a non-running state.
