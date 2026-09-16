# FacilityFlow — Part 2: Data Cleanup, Account Isolation & Reliability/Performance

Senior engineer + PM continuing FacilityFlow. Fix only what's listed below. Do not change anything else, do not break existing structure/flows. Re-run e2e tests after. This is Part 2 of 2 — Part 1 (separate file) covers bug fixes/privacy/admin/auth/security; that work is assumed already done or being done separately, don't redo it here.

## Data cleanup & account isolation
1. Reduce seed data to exactly:
   - **Providers**: TotalCare (user-created, keep as-is), SparkleClean, Prime HVAC. Remove all other seeded providers.
   - **Organizations**: Folio3 (user-created, keep as-is), Metro Healthcare Group, and rename "Demo Facilities Co" to **QX Industry**. Remove all other seeded organizations.
   - Print login credentials (email/password) for SparkleClean, Prime HVAC, Metro Healthcare Group, and QX Industry so they can be managed.
2. Demo data (contracts, jobs, invoices, quotations, reviews, etc.) should exist ONLY inside: Metro Healthcare Group, QX Industry, SparkleClean, and Prime HVAC. Folio3 and TotalCare (the user's own accounts) should NOT have fake pre-seeded contracts/invoices — clean those out if present, leave them as normal accounts.
3. New account behavior (apply going forward, for any future signup too): a newly registered org/provider should see the marketplace (list of existing providers/orgs, open requests, etc.) but must start with ZERO contracts, jobs, invoices, or quotations. Real data for that account only appears once they actually transact with another real account on the platform (e.g. a real quotation/contract between two real users) — never auto-generated demo data on signup.

## Reliability & Performance
4. App is slow overall — profile and fix obvious performance issues (N+1 queries, missing indexes, unnecessary re-fetches/re-renders).
5. Add proper error handling on all API calls (no silent failures/generic "Something went wrong").
6. Add loading states on all data-fetching UI (if missing anywhere).
7. Add empty states on all lists/tables (if missing anywhere).
8. Handle failed requests gracefully (retry or clear error message, no app crash).
9. Handle API/external call timeouts (esp. the free-tier AI API calls) without blocking the UI.
10. Prevent duplicate form submissions (e.g. double-click on "Submit Quotation," "Accept," "Pay").
11. Prevent duplicate payment recording on the same invoice.
12. Optimize slow DB queries (ties into #4 above — same root-cause investigation).
13. Add DB indexes on frequently-queried/filtered columns (jobs, invoices, requests, etc.).
14. Paginate any list that can grow large (jobs, invoices, providers, notifications, messages).
15. Compress uploaded files/images where reasonable (proof-of-work photos, provider documents).
16. Limit max upload file size (confirm and enforce if not already).
17. Cache repeat/expensive queries where safe (e.g. analytics aggregations).
18. Add basic uptime/error monitoring using free tools only (even a simple health-check endpoint + logging).
19. Add structured error logging (backend) so issues can be diagnosed without guessing.
20. Test behavior under 2+ simultaneous users interacting with the same data (e.g. two providers quoting the same request at once) — confirm no race conditions.
21. Test that a DB backup/restore actually works (don't just assume it does).

## Ground rules
- Do not touch anything not explicitly listed above.
- Do not restructure existing working features/flows.
- Verify app runs without errors after all changes; spot-check each fixed item actually works.
