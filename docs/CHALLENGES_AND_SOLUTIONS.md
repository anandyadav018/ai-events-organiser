# Spott – Engineering Challenges & Solutions

---

This document outlines **10 genuine technical challenges** encountered during the architecture, design, and implementation of **Spott**, alongside their concrete engineering solutions and underlying technical rationale.

---

## Technical Challenges Overview

| # | Challenge | Solution | Technical Reason |
|---|-----------|----------|------------------|
| 1 | Serverless Database Connection Overheating | Implemented global Mongoose connection caching in `lib/mongodb.ts` | Serverless Next.js route handlers instantiate new modules on invocation; global caching reuses existing connection pools instead of exhausting MongoDB socket limits. |
| 2 | Malformed / Non-JSON AI Responses | Formulated explicit JSON system prompts with string escaping & wrapped response handling in `try-catch` | LLMs like Groq/Gemini sometimes surround JSON outputs with markdown codeblocks (````json ... ````) or include unescaped raw newlines inside string values. |
| 3 | Concurrent Duplicate Registrations (Race Condition) | Created a Mongoose compound unique index `{ eventId: 1, userId: 1 }` | Application-level `findOne()` checks can be bypassed if two requests hit concurrently; database-level unique indexes guarantee atomicity. |
| 4 | QR Ticket Replay & Duplicate Check-in Attacks | Implemented state validation (`checkedIn: boolean`) & verified `organizerId` ownership on every scan | Unchecked QR codes could be re-scanned multiple times by bad actors or scanned by malicious non-organizers attempting to alter attendee statuses. |
| 5 | Search Query Thrashing (API Rate Overload) | Built debounced client-side input (300ms buffer) & set 2-character minimum threshold | Firing database requests on every keystroke causes redundant network roundtrips and high CPU load on database regex evaluations. |
| 6 | JWT Security vs Client Accessibility | Saved JWT in `HttpOnly`, `SameSite: strict` cookie & provided `/api/auth/me` endpoint | Storing tokens in `localStorage` exposes them to XSS attacks. `HttpOnly` cookies isolate tokens from client JS while endpoint exposes safe user state. |
| 7 | Cross-Origin External Image Optimization Failures | Explicitly configured remote domain hosts in `next.config.mjs` | Next.js `<Image />` component blocks rendering images from unconfigured remote domains (e.g., `images.unsplash.com`) for security and optimization reasons. |
| 8 | Browser Camera Access Failures for QR Scanning | Handled media device permission errors asynchronously with manual check-in fallbacks | Browsers deny camera access over non-HTTPS connections or if user denies permissions; application must handle rejected promises gracefully. |
| 9 | Next.js Hydration Mismatch with Client Date/Time | Wrapped date formatting components in `'use client'` & aligned server-client rendering timestamps | Server-side rendered HTML timestamps differ from client browser local timezones, leading to React hydration errors. |
| 10 | Location Slug Parsing Ambiquity (Multi-word Cities/States) | Designed custom reverse string parser (`parseLocationSlug`) matched against `country-state-city` database | Slugs like `new-delhi-delhi` contain multiple hyphens; standard `split('-')` fails without splitting by state suffix index. |

---

## Detailed Technical Case Studies

### 1. Serverless Database Connection Reuse (`lib/mongodb.ts`)
- **Problem:** In Next.js serverless execution, each API request can trigger a new function instance. Calling `mongoose.connect()` without caching creates a new database connection per request, eventually exceeding MongoDB Atlas connection pool limits.
- **Solution:** Maintained a cached connection on Node's `global` object:
  ```typescript
  interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  }
  const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
  ```
- **Result:** Connection pool is established once and reused across serverless invocations.

---

### 2. Guarding Against Malformed AI Output (`app/api/generate-event/route.js`)
- **Problem:** LLMs can occasionally return markdown wrappers (```json ... ```) or introduce unescaped newlines within JSON string values, causing `JSON.parse()` to throw syntax errors.
- **Solution:**
  1. Engineered prompt to demand strict single-line JSON string formatting.
  2. Implemented string cleaning regex prior to parsing:
     ```javascript
     let cleanedText = text.trim()
       .replace(/```json\n?/g, "")
       .replace(/```\n?/g, "");
     ```
  3. Wrapped `JSON.parse` in `try-catch` returning a user-friendly HTTP 500 error on failure.

---

### 3. QR Ticket Fraud Prevention & Authorization (`app/api/registrations/check-in/route.ts`)
- **Problem:** Malicious users could try to reuse an existing QR code or unauthorized users could attempt to trigger check-ins for events they don't own.
- **Solution:** Three-tier validation pipeline:
  1. **QR Existence Check:** Look up `Registration` document matching scanned `qrCode`.
  2. **Organizer Authorization Check:** Verify `event.organizerId.toString() === authResult.user._id.toString()`. Return `403 Forbidden` if false.
  3. **Replay Prevention:** Inspect `registration.checkedIn`. If `true`, return early response `{ success: false, message: "Already checked in" }`.

---

### 4. Robust Location Slug Parsing (`lib/location-utils.js`)
- **Problem:** Creating slugs like `gurugram-haryana` or `south-delhi-delhi` makes splitting by hyphen ambiguous (e.g. `["south", "delhi", "delhi"]`).
- **Solution:**
  ```javascript
  const stateSlug = parts[parts.length - 1];
  const citySlug = parts.slice(0, parts.length - 1).join("-");
  ```
  The parser extracts the state from the trailing slice, recombines the remaining parts for the city, converts them to proper title case, and validates both against the `country-state-city` database.
