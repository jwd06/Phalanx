# Legal Docs — Review Notes (Archived)

Archived verbatim from the "Reviewer Notes (remove before publishing)" sections
that lived at the bottom of [privacy-policy.html](privacy-policy.html) and
[terms-and-conditions.html](terms-and-conditions.html), then stripped from
those pages before publishing. Kept here as the audit trail and punch list.

All placeholder items referenced below **have since been resolved** in the
published docs:

| Placeholder | Resolved to |
|---|---|
| `[Effective Date]` | August 5, 2026 |
| `[Your Full Legal Name]` | Jawad Hossain |
| `[Contact Email]` | t3mpmail000@gmail.com |
| `[Legal Name / Address]` | Jawad Hossain (no physical address published — not legally required for a sole proprietor; email is sufficient contact) |
| `[State/Country]` (Terms) | Province of Ontario, Canada |
| `[Venue]` (Terms) | Courts located in the Province of Ontario, Canada |

---

## From privacy-policy.html

This draft was generated from a direct, evidence-based audit of the current
codebase (two rounds: a general codebase audit and a follow-up targeting
analytics/tracking, permissions, Sentry configuration, and data-export/
encryption gaps), plus clarifying answers (global audience; name vendors
specifically) and the note that the app is iOS-only.

**Confirmed and applied:**
- Audience is global (Canada-based, worldwide app) — draft includes GDPR/UK-GDPR, CCPA/CPRA, and PIPEDA references rather than a US-only policy.
- Third-party sub-processors are named specifically (OpenRouter, FatSecret, Sentry, Upstash, Clerk, Supabase, RevenueCat) rather than described only by generic category.
- App is iOS-only — all Android-specific references removed.
- Operator treated as an individual/sole proprietor based in Canada.

**Material discrepancies found vs. the in-app `src/app/privacy-policy.tsx` (corrected in this draft):**
- The in-app policy claims users can "Export your information" (`privacy-policy.tsx:115`) — **no export feature exists in the code.** This draft describes export as a manual request instead.
- The in-app policy lists third parties only by generic category (`privacy-policy.tsx:75-85`) — this draft names OpenRouter and FatSecret specifically. Consider updating the in-app screen to match.
- Neither the in-app policy nor `CLAUDE.md`/`AGENTS.md` mention Sentry is configured with `sendDefaultPii: true` (`src/app/_layout.tsx:23`), meaning users' IP addresses are sent to Sentry with every event — undisclosed prior to this draft.
- Neither mentions the Sentry feedback widget (`Sentry.showFeedbackWidget()`, wired at `src/app/(tabs)/profile.tsx:176`) as a channel collecting name/email/message/screenshot directly into Sentry.

**Gaps/action items surfaced by the audit, not fixed (read-only investigation):**
- **"Delete Account" row in Profile has no handler** — account deletion is not self-service today. Draft phrases the right as "contact us" rather than an in-app button.
- **Food photos not covered by the automated diary-entry deletion job** — the migration purging diary entries after ~35 days has an acknowledged TODO noting photo cleanup isn't built yet.
- **Microphone and Face ID/biometric permission strings exist in `Info.plist`/`app.json` but are unused by any feature.** Mic looks like an unremoved default from the `expo-camera` config plugin; Face ID string looks like unused boilerplate. Recommend removing both from `app.json` to shrink the permission footprint.
- **No `Sentry.setUser()` call exists**, so crash reports aren't linked to an account ID — reduces support-ticket usefulness but also reduces PII exposure; a deliberate decision either way, not a code accident to blindly fix.

**Legal judgment calls not determinable from code:**
- Whether a formal EU/UK representative or Data Protection Officer is needed given GDPR's territorial scope.
- Whether current provider agreements (Clerk, Supabase, RevenueCat, Sentry, Upstash, OpenRouter, FatSecret) actually have GDPR-adequate transfer mechanisms in place (e.g., Standard Contractual Clauses) — requires checking each vendor's own DPA.

---

## From terms-and-conditions.html

This draft was generated from a direct audit of the current codebase, not
from the project's own documentation — several discrepancies were found
between `CLAUDE.md`/`AGENTS.md` and the actual implementation; the Terms
reflect **actual code behavior**:

- **FatSecret**, not USDA FoodData Central (as `CLAUDE.md` incorrectly states), is the live nutrition database provider (`src/app/api/food-search+api.ts`, `src/lib/fatsecret.ts`).
- The food-photo AI runs through **OpenRouter** calling a Google Gemma model (`src/app/api/analyze-food+api.ts`), not OpenAI or Gemini directly as `AGENTS.md` describes. Named generically as "a third-party AI vision provider" in the published Terms since the underlying model is an implementation detail subject to change — confirm with counsel whether to name OpenRouter explicitly.
- The Workout tab is a **static, hardcoded exercise library** (`src/data/exercises.ts`), not an AI-generated program as `AGENTS.md`'s "weekly split" concept implies — no AI disclaimer applied. Revisit if/when workout generation is actually built.
- **Account deletion is not currently self-service** — the in-app "Delete Account" button has no handler wired up. Sections 6 and 14 promise deletion "on request" rather than instant in-app deletion.
- **Food photo retention lags diary-entry retention** — diary entries auto-purge after ~35 days + a 2-day grace period, but the migration explicitly notes photo cleanup isn't built yet, so photos can currently outlive their diary entry indefinitely.
- Rate limits (15 requests/10 min generally, 5 requests/10 min for AI photo scans, per `src/lib/rateLimiter.ts`) are described qualitatively rather than as fixed numbers, since they're config values that may change without a Terms update.
- The in-app `src/app/privacy-policy.tsx` lists third parties only by generic category (e.g., "AI processing providers," "authentication providers"). Consider updating it to name FatSecret and the AI vision provider explicitly for consistency, and wiring the in-app "Terms and Conditions" row (`src/app/(tabs)/profile.tsx`) to actually link to the published document — currently it renders but does nothing when tapped.

**Confirmed and applied:**
- App is iOS-only — all Google Play Store / Android references removed.
- Minimum age: 13+.
- Dispute resolution: standard governing-law/venue clause, no arbitration or class-action waiver.
- Contracting party: an individual/sole proprietor, not a registered company.
- Liability cap: amount paid in the preceding 12 months.

---

## Standing disclaimer (applies to both documents)

**These documents are drafts prepared from a code audit and are not legal
advice.** They should be reviewed by a qualified attorney licensed in the
relevant jurisdiction, particularly regarding:

- GDPR obligations for a Canada-based individual serving EU/UK users, and whether the health/nutrition data collected qualifies as a "special category"/sensitive data class requiring stronger consent mechanics than currently implemented.
- Whether Canadian provincial law (e.g., Quebec's Law 25) imposes additional requirements beyond PIPEDA.
- Liability cap and warranty disclaimer enforceability under Ontario law.
- Apple subscription-disclosure compliance for the specific App Store listing.
- Any health-data-specific regulatory obligations (e.g., HIPAA-adjacent state health-privacy laws) that may apply given the App's nutrition and fitness data handling.

## Outstanding product gaps (still real as of the last audit)

- Account deletion has no handler in Profile.
- Food photo cleanup job doesn't exist yet (diary entries purge, photos don't).
- Unused Microphone / Face ID permission entries in `app.json`.
- `sendDefaultPii: true` in Sentry config sends user IPs with every crash event.
- No `Sentry.setUser()` — crash reports aren't linked to accounts.
- In-app "Terms and Conditions" row in Profile doesn't link anywhere.
- In-app `privacy-policy.tsx` still names vendors generically instead of by name, and still claims an "export your information" feature that doesn't exist.
