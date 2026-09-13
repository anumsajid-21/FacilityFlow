# FacilityFlow — AI Features (3)

Senior engineer + PM continuing FacilityFlow. Use a free-tier LLM API (e.g. Google Gemini API free tier, or any other genuinely free/no-cost API key/plugin available) — do NOT use a paid API or assume a budget. Get a free API key from the provider's console and store it as an env var. Additive only, don't break existing flow. Re-run e2e tests after each feature.

## 1. Quote Comparison Summary
- Trigger: Service Request has 2+ submitted quotations.
- On Quotations page (Hiring side), add "AI Summary" button/section above the list.
- Send all quotations' price, labor/material cost, SLA, warranty, expiry to LLM; return a short plain-English summary of key differences and risks (e.g. cheapest vs longest warranty vs fastest SLA).
- Display as a card, not a modal. Cache result per request until a new quotation is added/withdrawn (don't re-call API on every page load).

## 2. Review Sentiment Flagging
- On new Review submission (backend), send comment text to LLM, classify sentiment (positive/neutral/negative) + short reason if negative.
- Store sentiment on the Review record (additive field).
- Admin provider list/detail: show a "Trending negative" flag if a provider has 2+ negative-sentiment reviews in the last 30 days, even if star rating hasn't dropped.
- Don't expose raw sentiment score to orgs/providers — admin-only signal.

## 3. Photo Sanity-Check (Proof of Work)
- On proof-of-work photo upload, send before/after images to a free vision-capable API (Gemini free tier supports vision) with the job's category/description.
- Return a simple flag: "looks consistent" or "review recommended" + one-line reason.
- Show as a small badge on the Proof of Work card (Job Detail) for the org reviewer — advisory only, never auto-approve/reject.
- If API fails/times out/rate-limited, skip silently (don't block job completion flow).

## Ground rules
- No paid APIs anywhere — use free-tier keys/plugins only; if a feature can't work within free-tier limits, flag it instead of switching to paid.
- All 3 are advisory/assistive only — no auto-decisions (no auto-reject quote, provider, or job).
- Log API failures/rate-limit hits; degrade gracefully (feature simply doesn't show if API call fails).
- Reuse existing UI components/design tokens.
- Verify app runs without errors after implementation.
