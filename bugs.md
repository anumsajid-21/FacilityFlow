# FacilityFlow — Part 1: Bug Fixes, Privacy, Admin, Auth & Security

Senior engineer + PM continuing FacilityFlow. Fix only what's listed below. Do not change anything else, do not break existing structure/flows. Re-run e2e tests after. This is Part 1 of 2 — a separate Part 2 covers data cleanup and reliability/performance; do not do that work here.

## Bug fixes
1. Reviews: average rating not calculating — fix aggregation.
2. Quotations: 2 quotations can end up "accepted" on one service request — should be impossible. Accepting one must auto-reject/close all others on that request (this was originally built, appears regressed — find and fix).
3. Analytics: "Spend over time" graph — fix rendering/data so it's visually correct and readable.
4. Analytics (Buildings): shows 0 floors/0 areas for every building — data isn't being fetched/joined correctly, fix the query.
5. Profile picture: once updated, must show next to the user's name everywhere in the app (nav, comments, etc.), not just on the profile page.
6. Provider portal: quotations list shows duplicates — dedupe.
7. Jobs / Proof of Work: add a working photo upload option on the upload UI (if missing/broken, fix it).
8. Settings: submitting proof of work fails — debug and fix (check if this is actually the Job Detail flow being referenced from Settings/worker view — fix wherever the real submit action lives).
9. Providers tab: profile card shows "2 services" but opening the profile shows none — fix the count to reflect actual linked services, or fix the missing services data, whichever is the real bug.
10. Notification badge count logic: badge shows a count (e.g. 3) that includes already-opened/read threads — badge must only count genuinely unread items, and disappear once read. Verify this works correctly across ALL portals (Admin, Org, Provider, Worker), not just Messages.

## Privacy
11. Admin portal currently shows the actual message content of private conversations between orgs and providers (e.g. "confirm next lobby cleaning date"). Admin should not read private message content — remove full message content from admin view; admin can see that a thread exists/metadata (participants, timestamps, count) for support/audit purposes only, not the messages themselves.

## Admin
12. "Verification Queue" section in admin portal is empty/non-functional — wire it up to actually list pending provider verification documents (the backend model already exists per earlier report), or remove it if truly out of scope — confirm which before deciding.

## Auth
13. Add "Forgot password" flow: a link on the Login page, and a way to trigger it from Settings' password-change section too. Standard flow — request reset (email via existing notification/email system) → reset link/token → set new password.

## Security (priority subset)
Since this pass touches auth, admin visibility, and file uploads, also confirm/fix these while in that code:
- No API keys/secrets exposed client-side or committed to git; all in env vars.
- Admin routes protected server-side (not just hidden in UI) — relevant given items #11/12 above.
- Auth + role/permission checks enforced on backend for every endpoint touched in this pass.
- Sanitize inputs on any form touched here; confirm no raw SQL/XSS risk introduced.
- Secure file uploads (type/size validation, scoped access) — relevant to proof-of-work upload fix (#7).
- Rate limiting on auth endpoints (relevant to new forgot-password flow, #13).
- Secure cookies (HttpOnly/Secure/SameSite) and disabled debug mode in production.
(Full 20-item security audit lives in the separate legal/accessibility prompt — this is just the subset relevant to what's being touched here.)

## Ground rules
- Do not touch anything not explicitly listed above.
- Do not restructure existing working features/flows.
- Verify app runs without errors after all changes; spot-check each fixed item actually works.
