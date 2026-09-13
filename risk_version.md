# FacilityFlow — Feature Modules & Visual Direction Implementation

Five phases from `risk_version.md`, implementing sequentially. E2E tests run after each phase.

---

## Phase 0 — Audit `providerId` on ServiceRequest

**Finding: `providerId` does NOT exist on `ServiceRequest`.** After reviewing the full Prisma schema (lines 385–419), the `ServiceRequest` model has no `providerId` field whatsoever. The architecture is clean:

- `ServiceRequest` → multiple `Quotation`s → org accepts one → `quotations.service.ts` auto-creates a `Contract` with `providerId` from the winning quotation
- The provider linkage lives exclusively on `Contract.providerId`
- No dead scaffolding, no denormalized field — this field was never introduced

**Action**: No schema changes needed. Will document this finding in the walkthrough. ✅

---

## Phase 1 — Visual Direction: "Ocean & Sand"

Replace all "Earthy Industrial" colors with the new "Ocean & Sand" palette via CSS variables and Tailwind tokens. No hardcoded hex in components.

### Color Mapping (Old → New)

| Token | Old (Earth) | New (Ocean & Sand) |
|---|---|---|
| `sand` (background) | `#F3EFE7` | `#FBF6EF` |
| `ivory` (cards) | `#FFFDF8` | `#FFFFFF` (white) |
| `pine` (sidebar/brand) | `#173F38` | `#0E3B4D` |
| `pine-light` | `#1F534A` | `#145A6E` |
| `pine-darker` | `#0F2B26` | `#082A38` |
| `terracotta` (primary CTA) | `#B9553D` | `#F2A65A` |
| `terracotta-hover` | `#96432F` | `#D9903E` |
| `terracotta-soft` | `#F6E3DC` | `#FEF3E2` |
| `brass` (accent) | `#C9A66B` | `#7FA9B8` (inactive icons) |
| `brass-soft` | `#F2E8D5` | `#DCEEF0` (verified badge bg) |
| `charcoal` (body text) | `#172522` | `#1F2D33` |
| `sage` (muted text) | `#66736D` | `#8C8171` |
| `border` | `#E5E0D5` | `#E2DDD5` |
| `input` | `#DCD6C8` | `#D8D3CA` |
| `ring` | `#173F38` | `#0E3B4D` |
| `destructive` | `#A93226` | `#C0392B` (standard red) |
| `muted` | `#EDE8DD` | `#EDE8DD` (unchanged) |
| `accent` | `#F2E8D5` | `#DCEEF0` |

### Files to Modify

#### [MODIFY] [globals.css](file:///c:/Users/Admin/Desktop/ANUM/Facility%20Service%20App/frontend/src/app/globals.css)
- Update all `:root` CSS variable values
- Update scrollbar thumb colors
- Update skeleton shimmer background

#### [MODIFY] [tailwind.config.js](file:///c:/Users/Admin/Desktop/ANUM/Facility%20Service%20App/frontend/tailwind.config.js)
- Update all color hex values to match new palette
- Update `card` shadow to `0 1px 4px rgba(0,0,0,.06)` per spec

#### [MODIFY] [utils.ts](file:///c:/Users/Admin/Desktop/ANUM/Facility%20Service%20App/frontend/src/lib/utils.ts)
- Update `statusStyles` — swap earth-tone hex literals for the new ocean palette equivalents
- `VERIFIED` badge: `bg-[#DCEEF0] text-[#0E5B6F]` per spec
- All danger/breach statuses use red, never orange

#### [MODIFY] [Sidebar.tsx](file:///c:/Users/Admin/Desktop/ANUM/Facility%20Service%20App/frontend/src/components/layout/Sidebar.tsx)
- Colors flow through Tailwind tokens (pine, brass, etc.) so the rebrand is automatic
- Verify inactive icons use `brass` (now `#7FA9B8`)
- Verify active nav uses the new primary accent

#### [MODIFY] [kit.tsx](file:///c:/Users/Admin/Desktop/ANUM/Facility%20Service%20App/frontend/src/components/ui/kit.tsx)
- `Badge` variant colors: update `success` to use ocean-pine, `danger` to use red (not orange/terracotta)
- All other components reference design tokens, so they auto-update

#### [MODIFY] [button.tsx](file:///c:/Users/Admin/Desktop/ANUM/Facility%20Service%20App/frontend/src/components/ui/button.tsx)
- Colors flow through tokens. Primary = terracotta (now `#F2A65A`). Secondary = pine (now `#0E3B4D`).
- Update `destructive` to use standard red, separate from primary orange

---

## Phase 2 — Notification Bell (horizontal top bar)

> [!IMPORTANT]
> Currently there is NO top bar on desktop. The Sidebar provides the only nav chrome. Phase 2 adds a persistent horizontal top bar on every authenticated page.

### New Component

#### [NEW] [TopBar.tsx](file:///c:/Users/Admin/Desktop/ANUM/Facility%20Service%20App/frontend/src/components/layout/TopBar.tsx)
- Left side: page title / breadcrumb (derived from `usePathname()`)
- Right side: Bell icon with unread-count badge (e.g. "2")
- Click bell → dropdown with latest 5 notifications + "View all → /notifications"
- Reuse `notificationsApi.list()` for data; poll every 30s
- Each item shows title, time ago, unread dot
- Mark-as-read on click; "Mark all read" in dropdown header

### Layout Integration

#### [MODIFY] [(dashboard)/layout.tsx](file:///c:/Users/Admin/Desktop/ANUM/Facility%20Service%20App/frontend/src/app/(dashboard)/layout.tsx)
- Insert `<TopBar />` between Sidebar and page content
- Structure: `<div flex><Sidebar /><div flex-col flex-1><TopBar /><main>...</main></div></div>`

### Design decisions:
- Primary nav (Dashboard/Requests/Jobs/etc.) stays in sidebar — never in top bar
- Top bar won't duplicate mobile sidebar hamburger; on mobile the top bar shows only bell + breadcrumb, hamburger stays in Sidebar's mobile top bar

---

## Phase 3 — Payment & Activity History

### Backend: New Endpoints

#### [MODIFY] [invoices.controller.ts](file:///c:/Users/Admin/Desktop/ANUM/Facility%20Service%20App/backend/src/invoices/invoices.controller.ts)
- `GET /api/v1/invoices/payment-history` — org-scoped payment history across all invoices (filterable by date range, providerId, category)
- `GET /api/v1/invoices/payment-history/csv` — CSV export

#### [MODIFY] [invoices.service.ts](file:///c:/Users/Admin/Desktop/ANUM/Facility%20Service%20App/backend/src/invoices/invoices.service.ts)
- `paymentHistory(orgId | providerId, filters)` — joins Payment → Invoice → Contract → ServiceRequest → category, aggregated
- `paymentHistoryCsv()` — streams CSV

#### [NEW] Activity timeline endpoint
- `GET /api/v1/contracts/:id/activity` and `GET /api/v1/jobs/:id/activity`
- Queries AuditLog + derived events from Invoice, Payment, ReworkRequest, Approval filtered by entityId
- Returns chronological array of `{ type, description, actor, timestamp }`

#### [MODIFY] [contracts.controller.ts](file:///c:/Users/Admin/Desktop/ANUM/Facility%20Service%20App/backend/src/contracts/contracts.controller.ts) & [contracts.service.ts](file:///c:/Users/Admin/Desktop/ANUM/Facility%20Service%20App/backend/src/contracts/contracts.service.ts)
- Add `GET :id/activity` route

#### [MODIFY] [jobs.controller.ts](file:///c:/Users/Admin/Desktop/ANUM/Facility%20Service%20App/backend/src/jobs/jobs.controller.ts) & [jobs.service.ts](file:///c:/Users/Admin/Desktop/ANUM/Facility%20Service%20App/backend/src/jobs/jobs.service.ts)
- Add `GET :id/activity` route

### Frontend: New Pages

#### [NEW] [payment-history/page.tsx](file:///c:/Users/Admin/Desktop/ANUM/Facility%20Service%20App/frontend/src/app/(dashboard)/payment-history/page.tsx)
- **Org view**: "Payment History" — all payments across contracts/providers
- **Provider view**: "Earnings History" — mirror page, provider-side
- Filterable by date range, provider (org view) / org (provider view), category
- CSV export button
- Table: Date, Invoice #, Provider/Org, Category, Amount, Method, Reference, Status

#### Sidebar entry
- [MODIFY] [Sidebar.tsx](file:///c:/Users/Admin/Desktop/ANUM/Facility%20Service%20App/frontend/src/components/layout/Sidebar.tsx) — add "Payment History" / "Earnings" nav item for HIRING_ORG and PROVIDER

#### Activity timeline on detail pages
- [MODIFY] [contracts/[id]/page.tsx](file:///c:/Users/Admin/Desktop/ANUM/Facility%20Service%20App/frontend/src/app/(dashboard)/contracts/[id]/page.tsx) — add "Activity" tab with chronological timeline
- [MODIFY] [jobs/[id]/page.tsx](file:///c:/Users/Admin/Desktop/ANUM/Facility%20Service%20App/frontend/src/app/(dashboard)/jobs/[id]/page.tsx) — add "Activity" tab with chronological timeline

---

## Phase 4 — Seed Data

#### [MODIFY] [seed.mjs](file:///c:/Users/Admin/Desktop/ANUM/Facility%20Service%20App/backend/prisma/seed.mjs)
Extend (not replace) with:
- **2nd hiring org**: "Metro Healthcare Group" with 2 buildings, multiple floors/areas
- **Additional providers**: 2 more providers with varied verification statuses (VERIFIED, DOCUMENTS_SUBMITTED, UNDER_REVIEW)
- **More workers**: 2 more workers under different providers
- **Varied pipeline data**:
  - Service requests in every status (DRAFT, OPEN, QUOTATIONS_RECEIVED, UNDER_REVIEW, PROVIDER_SELECTED, CANCELLED, CLOSED)
  - Quotations in all statuses
  - Multiple contracts with different statuses
  - Jobs including REWORK and SLA breach scenarios
  - Invoices across all statuses with payment history spanning 6+ months
  - Reviews, notifications, audit log entries
- **Print credentials**: At the end, print a formatted table of all login credentials per role

---

## Verification Plan

### After Each Phase
- Run `node backend/e2e-test.mjs` and `node backend/e2e-flow-test.mjs`
- Confirm no regressions

### Final Step
- Boot backend (`npm run start:dev` in backend/)
- Boot frontend (`npm run dev` in frontend/)
- Confirm no crashes or unhandled errors
- Click through login + one page per role (HIRING_ORG, PROVIDER, ADMIN, WORKER)
- Fix any breakage before handing back

### Manual Verification
- Visual check that Ocean & Sand palette is applied consistently
- Bell icon visible and functional on top bar
- Payment history pages load with filtered data
- Seed data makes pages look realistic
