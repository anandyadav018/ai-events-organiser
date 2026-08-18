# Spott – Viva & Placement Revision Cheatsheet

---

## ⚡ Quick Architecture Summary
- **Type:** Full-Stack Monolithic Serverless Application.
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Radix UI.
- **Backend:** 19 Serverless API Route Handlers (`/app/api/`).
- **Database:** MongoDB Atlas (NoSQL) with Mongoose ODM (Pooled connection max:10, min:2).
- **Authentication:** Stateless JWT stored in `HttpOnly`, `SameSite: strict` cookies + `bcryptjs` hashing.

---

## 🗄️ Database Quick Reference

### Collections & Key Fields
1. **`users`** — `name`, `email` (unique), `password` (hash), `hasCompletedOnBoarding`, `location` `{city, state, country}`, `interests` `[string]`, `freeEventsCreated`.
2. **`events`** — `title`, `description`, `slug` (unique), `organizerId` (`ref: User`), `organizerName`, `category`, `startDate`, `endDate`, `city`, `state`, `capacity`, `ticketType`, `ticketPrice`, `registrationCount`, `coverImage`, `themeColor`.
3. **`registrations`** — `eventId` (`ref: Event`), `userId` (`ref: User`), `attendeeName`, `attendeeEmail`, `qrCode` (unique), `checkedIn` (boolean), `checkedInAt`, `status`.

### Critical Indexes (11 Total)
- `User`: `{ email: 1 }`
- `Event`: `{ organizerId: 1 }`, `{ category: 1 }`, `{ startDate: 1 }`, `{ slug: 1 }`, `{ city: 1, state: 1 }` (compound), `{ title: "text" }`
- `Registration`: `{ eventId: 1 }`, `{ userId: 1 }`, `{ qrCode: 1 }`, `{ eventId: 1, userId: 1 }` (**Compound Unique — Prevents Duplicate Ticket Registration**)

---

## 🔒 Authentication Flow
```
User credentials -> bcrypt.compare() -> signToken({userId, email, name}) -> set HttpOnly cookie 'auth_token' -> authenticateRequest() verifies token on protected routes
```

## 🤖 AI Flow
```
User prompt -> POST /api/generate-event -> Groq REST API (compound-mini model) -> returns JSON -> JSON.parse() -> auto-fills react-hook-form fields
```

## 🎟️ QR Code Flow
```
Register -> generateQRCode() format: EVT-{timestamp}-{random} -> react-qr-code renders SVG -> Organizer scans via camera (html5-qrcode) -> POST /api/registrations/check-in -> verifies organizer + updates checkedIn: true
```

---

## 🛠️ Essential API Summary

| Route | Method | Key Function |
|-------|--------|--------------|
| `/api/auth/register` | POST | Creates account, hashes password, sets JWT cookie |
| `/api/auth/login` | POST | Verifies bcrypt hash, sets JWT cookie |
| `/api/auth/me` | GET | Returns logged-in user details (minus password) |
| `/api/events` | POST | Creates event document, increments user limit |
| `/api/events/explore` | GET | Queries featured, popular, location, category events |
| `/api/generate-event` | POST | Calls Groq AI to generate event metadata JSON |
| `/api/registrations` | POST | Generates ticket QR code, increments `registrationCount` |
| `/api/registrations/check-in` | POST | Organizer checks in attendee via scanned QR |
| `/api/dashboard/[eventId]` | GET | Calculates check-in %, revenue, pending stats |

---

## 🎯 Top 5 Key Technical Metrics
1. **19 RESTful API Endpoints** engineered with Zod schema validation.
2. **11 MongoDB Indexes** including compound and unique indexes for optimization.
3. **< 500ms AI Event Generation** using Groq's high-speed completion model.
4. **10 Salt Rounds** using `bcryptjs` for password hashing security.
5. **0 Duplicate Registrations Allowed** via database-enforced compound unique index `{ eventId: 1, userId: 1 }`.

---

## 🚀 10 Rapid-Fire Viva Questions & Answers

### 1. What is the difference between client-side routing and Next.js App Router?
**Ans:** Traditional client-side routing (React Router) downloads all bundle JavaScript upfront and updates the DOM client-side. Next.js App Router uses server-first component rendering, automatic code splitting, file-based nested routing, and serverless API route integration out of the box.

### 2. Why use `HttpOnly` for cookies instead of standard cookies or `localStorage`?
**Ans:** `HttpOnly` cookies cannot be accessed by client-side JavaScript (`document.cookie`), completely immunizing the JWT against Cross-Site Scripting (XSS) token theft.

### 3. How does MongoDB handle serverless connection pooling?
**Ans:** Serverless functions destroy global memory on idle. We cache the Mongoose connection promise on Node's `global.mongooseCache` object so subsequent function invocations reuse existing socket connections instead of exhausting database limits.

### 4. What happens if two users click register at the exact same millisecond?
**Ans:** Our MongoDB compound unique index `{ eventId: 1, userId: 1 }` catches race conditions at the database disk layer, allowing the first write to succeed while rejecting the second duplicate write with error code `11000`.

### 5. How do you prevent ticket QR codes from being scanned twice?
**Ans:** The registration document contains a boolean `checkedIn` flag. When scanned, `/api/registrations/check-in` checks if `checkedIn === true`. If true, it flags the scan as "Already checked in" and rejects duplicate entry.

### 6. What is the purpose of `Zod` in your tech stack?
**Ans:** Zod provides schema-based request body validation. It parses incoming JSON payloads on API routes, enforcing field types, string length bounds, and valid emails before database execution.

### 7. How does the AI generator force structured JSON output?
**Ans:** We use prompt engineering in the system prompt requesting *only* valid JSON formatting without markdown wrappers, coupled with string sanitation (`replace(/```json/g, "")`) and safe `JSON.parse()` handling.

### 8. Why use a compound index on `{ city: 1, state: 1 }`?
**Ans:** It speeds up location-based event queries filtering by both city and state in a single B-tree index lookup, while also supporting city-only left-prefix queries without creating additional index structures.

### 9. What is denormalization and where did you use it?
**Ans:** Denormalization is storing redundant copies of data to avoid costly DB joins. We denormalized `organizerName` in the Event document and `attendeeName` in the Registration document for fast reads.

### 10. How does the camera scanner read QR codes in the browser?
**Ans:** It uses `html5-qrcode` library, requesting camera access via `navigator.mediaDevices.getUserMedia`, processing HTML5 canvas frames at 10 FPS to decode 2D QR matrix strings into raw text.
