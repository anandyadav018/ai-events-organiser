# Spott – Engineering Methodology & Development Lifecycle

---

This document outlines the end-to-end development methodology followed for **Spott – AI Events Organiser**, structured as a software engineering project report.

---

## Phase 1: Requirement Analysis

### Objective
Identify the pain points of college and community event management, define target personas, specify functional and non-functional requirements, and prioritize features.

### Implementation
- **Problem Discovery:** Conducted surveys among college society heads and event hosts. Identified key friction points: manually drafting descriptions, managing attendee lists in spreadsheets, lack of check-in verification, and poor location discovery.
- **User Personas:**
  1. *Organizer:* Needs quick event setup, custom themes, QR check-in capabilities, and real-time attendance analytics.
  2. *Attendee:* Needs simple event discovery based on location/category, fast one-click registration, and instant digital QR tickets.
- **Specification Matrix:**
  - *Functional:* JWT Auth, AI Event Creator, Location Filtering, Search, QR Generation, Camera Scanner, Analytics Dashboard.
  - *Non-Functional:* Sub-200ms API response time, zero double-registrations, responsive mobile layout, dark mode by default.

### Output
- Requirements Specification Document detailing 12 core features.
- Initial wireframes for Event Creation, Discovery, and Dashboard pages.

---

## Phase 2: System Architecture & Tech Stack Selection

### Objective
Design an extensible, performant, and developer-friendly architecture while selecting the optimal tech stack.

### Implementation
- **Framework Selection:** Selected **Next.js 16 (App Router)** over standalone React + Node.js express backend to maintain a unified monolithic codebase with serverless API route handlers.
- **UI Stack:** Adopted **React 19**, **Tailwind CSS v4**, and **Radix UI / shadcn components** to achieve high aesthetic design standards with customizable dark mode gradients and blur effects.
- **Database Selection:** Chosen **MongoDB Atlas** with **Mongoose ODM** for schema flexibility, nested location/interests arrays, atomic counters (`$inc`), and built-in indexing support.
- **State Management Architecture:** Designed a lightweight client state system using custom React hooks (`useAuth`, `useQuery`, `useMutation`, `useOnboarding`) with Context API instead of heavy state management libraries like Redux.

### Output
- System Architecture Diagram mapping Client, Next.js Serverless Layer, MongoDB, and External APIs (Groq, Unsplash).
- Folder structure design organizing routes by route groups `(auth)`, `(main)`, and `(public)`.

---

## Phase 3: UI/UX Design & Design System

### Objective
Create a visually impressive, modern, dark-themed user interface with smooth transitions, custom colors, and accessible components.

### Implementation
- **Design System:** Created standard tokens in `app/globals.css` using Tailwind CSS v4. Defined custom background gradients (`from-gray-950 via-zinc-900 to-stone-900`) and ambient glow effects (`blur-3xl`).
- **Dynamic Theming:** Implemented dynamic theme colors on event detail and event creation pages where background colors update dynamically based on the selected `event.themeColor` (e.g., `#1e3a8a`), calculated using a custom color-darkening utility function (`darkenColor()`).
- **Interactive Modals:** Built accessible modals for Onboarding, Registration, QR Code Display, QR Scanner, Unsplash Picker, and Pricing Upgrades using `@radix-ui/react-dialog`.

### Output
- Responsive mobile & desktop layouts.
- Reusable UI component library in `components/ui/` (Button, Card, Dialog, Select, Popover, Badge, Progress, Tabs).

---

## Phase 4: Database Design & Modeling

### Objective
Model relational data in MongoDB using Mongoose, implement validation constraints, and define indexes for query performance.

### Implementation
- **Schema Development:**
  - `User` schema: Hashed password, location object, interests array, and freemium tracking.
  - `Event` schema: Category, timestamps, capacity, price, location, denormalized organizer name, and registration counter.
  - `Registration` schema: Foreign keys (`eventId`, `userId`), attendee metadata, QR code string, check-in status.
- **Index Optimization:**
  - Added single-field indexes on `email`, `organizerId`, `category`, `startDate`, `slug`, `qrCode`.
  - Added compound index `{ city: 1, state: 1 }` on `Event` model for location-filtered explore queries.
  - Added compound unique index `{ eventId: 1, userId: 1 }` on `Registration` model to enforce single registration per user at database level.

### Output
- Complete Mongoose model definitions in `/models/` (`User.ts`, `Event.ts`, `Registration.ts`).
- ER Diagram and index strategy documentation.

---

## Phase 5: Authentication & Security Implementation

### Objective
Build a secure, stateless authentication pipeline using JWT, password hashing, and HTTP cookies.

### Implementation
- **Security Utilities:** Developed `lib/jwt.ts` for signing and verifying tokens, and `lib/auth-guard.ts` for route protection.
- **Password Hashing:** Integrated `bcryptjs` to generate salt (10 rounds) and hash passwords during registration (`POST /api/auth/register`).
- **Token Handling:** JWT payload containing `{ userId, email, name }` is stored in an `HttpOnly`, `SameSite: strict`, `Secure` cookie named `auth_token` with 7-day expiration.
- **Route Guard Middleware:** `authenticateRequest()` validates the cookie, queries MongoDB excluding the password field (`select("-password")`), and returns authenticated user context or HTTP 401.

### Output
- Fully functional authentication endpoints (`register`, `login`, `logout`, `me`).
- Global `useAuth` hook and `AuthProvider` wrapper managing logged-in state across pages.

---

## Phase 6: AI Integration

### Objective
Incorporate natural language event generation to eliminate manual input overhead for organizers.

### Implementation
- **API Integration:** Implemented `/api/generate-event/route.js` connecting to **Groq API** (`https://api.groq.ai/v1/compound-mini/completions`).
- **Prompt Engineering:** Designed strict system prompt forcing JSON response output containing `title`, `description`, `category`, `suggestedCapacity`, and `suggestedTicketType`.
- **Parsing & Error Handling:** Sanitized AI output, wrapped parsing in `try-catch`, and handled malformed responses gracefully. Added fallback Gemini code reference in comments.
- **Client Auto-Fill:** Form auto-fills form inputs (`setValue`) on receiving generated JSON.

### Output
- AI Event Creator modal component (`ai-event-creator.jsx`) with one-click form auto-fill.

---

## Phase 7: QR Ticketing & Scanner Pipeline

### Objective
Implement end-to-end ticketing, from generation to client-side QR rendering and camera-based validation.

### Implementation
- **Code Generation:** Uniquely formatted ticket string `EVT-{timestamp}-{random}` generated on `POST /api/registrations`.
- **Ticket Rendering:** Rendered QR code vector graphics on ticket modal using `react-qr-code`.
- **Scanner Integration:** Embedded `html5-qrcode` in `qr-scanner-modal.jsx`. Managed media device permission requests (`getUserMedia`) and fallback error messaging.
- **Check-In API:** `POST /api/registrations/check-in` validates QR code, verifies organizer ownership of event (`organizerId === user._id`), checks duplicate status, and updates `checkedIn: true` with timestamp.

### Output
- Working QR code display on `/my-tickets`.
- Live web-cam scanner for organizers on `/my-events/[eventId]`.

---

## Phase 8: Testing & Verification

### Objective
Validate functional workflows, performance constraints, and edge case handling.

### Implementation
- **Authentication Testing:** Verified invalid credentials, short passwords, existing email attempts, and cookie deletion on logout.
- **Business Logic Verification:** Tested duplicate registrations, capacity overflow, unauthorized check-in attempts, and past event restrictions.
- **Camera & Device Testing:** Tested QR scanner across desktop webcam and mobile browser camera interfaces.
- **Edge Cases:** Validated AI json parsing fallbacks, database connection retries, and missing environment variables.

### Output
- Comprehensive Manual Test Case Matrix (`TESTING.md`).

---

## Phase 9: Deployment & Production Optimization

### Objective
Deploy the application to cloud platforms with environment isolation, database pooling, and assets optimization.

### Implementation
- **Database Provisioning:** Deployed MongoDB Atlas M0 cluster, configured IP access rules, and established database URI connection string.
- **Hosting:** Configured Vercel deployment project, set production environment variables (`MONGODB_URI`, `JWT_SECRET`, `GROQ_API_KEY`, `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY`).
- **Build Optimization:** Verified Next.js production build (`npm run build`), updated `next.config.mjs` with remote image domains (`images.unsplash.com`), and enabled static page caching where appropriate.

### Output
- Live deployed production URL on Vercel backed by MongoDB Atlas.
