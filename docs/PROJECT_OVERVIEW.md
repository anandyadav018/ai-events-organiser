# Spott – AI Events Organiser | Project Overview

---

## 🎯 30-Second Elevator Pitch

> **Spott** is a full-stack AI-powered event management platform built with **Next.js 16, React 19, MongoDB Atlas, and Groq AI**. It allows organizers to create events using natural language AI prompts, manage registrations with QR-based ticketing, and track real-time analytics — while attendees discover events through location-aware search and personalized categories. The system handles the entire event lifecycle from creation to check-in, featuring JWT cookie-based authentication, Zod schema validation, and a responsive dark-mode UI.

---

## 🗣️ 1-Minute Explanation

Spott solves the problem of fragmented event management. Existing solutions like Eventbrite and Meetup are either too complex for college/community events or lack AI-assisted creation.

**What it does:**
- Organizers describe their event idea in plain English → Groq AI auto-generates the title, description, category, and capacity
- Attendees discover events via location-based exploration, category browsing, and full-text search
- Upon registration, a unique QR code ticket is generated (format: `EVT-{timestamp}-{random}`)
- At the event venue, organizers use a live camera-based QR scanner (html5-qrcode) for check-in
- A real-time analytics dashboard shows capacity utilization, check-in rate, revenue, and time-to-event
- Onboarding flow captures user interests and location for personalized event recommendations

**Technical highlights:** Next.js App Router with route groups `(auth)`, `(main)`, `(public)`, MongoDB connection pooling via global cache, bcryptjs password hashing with salt rounds of 10, JWT tokens stored in HttpOnly cookies with 7-day expiry, and Zod validation on every API endpoint.

---

## 📋 3-Minute Interview Explanation

Spott is a full-stack event management web application I built from scratch using **Next.js 16 with the App Router**, **React 19**, **TypeScript**, **MongoDB Atlas with Mongoose**, and **Groq AI**.

### Problem
College students and community organizers struggle with event management. Existing platforms like Eventbrite are overkill for small events, Meetup requires subscriptions, and none of them offer AI-assisted event creation. There's no unified platform where you can create an event with AI, get QR tickets, scan check-ins, and view analytics.

### Solution Architecture
I designed a **monolithic full-stack architecture** using Next.js — the frontend and backend live in the same codebase. The App Router gives me file-based API routes under `/app/api/` and server-side rendering for pages.

**Database Design:** Three Mongoose models — `User`, `Event`, and `Registration` — with proper indexes. The Event model has a compound index on `{city, state}` for location queries, a text index on `{title}` for search, and individual indexes on `organizerId`, `category`, `startDate`, and `slug`. The Registration model has a compound unique index `{eventId, userId}` to prevent duplicate registrations at the database level.

**Authentication:** Custom JWT implementation using `jsonwebtoken` and `bcryptjs`. Passwords are hashed with 10 salt rounds. The JWT token is stored in an `HttpOnly`, `Secure`, `SameSite: strict` cookie with a 7-day expiry. A reusable `authenticateRequest()` guard extracts the token from cookies, verifies it, fetches the user from MongoDB (excluding the password field), and returns the authenticated user object.

**AI Integration:** The Groq API (`compound-mini` model) takes a natural language prompt and returns structured JSON — title, description, category, suggested capacity, and ticket type. The response is parsed with `JSON.parse()` with error handling for invalid AI output. There's also commented-out Gemini API code as a fallback integration.

**QR Ticketing:** On registration, a unique QR code string is generated: `EVT-{timestamp}-{random_alphanumeric}`. The attendee views this as a visual QR code (rendered by `react-qr-code`). At check-in, the organizer scans via `html5-qrcode` (using the device camera), the system looks up the Registration by `qrCode`, verifies the organizer owns the event, checks for duplicate check-ins, and marks `checkedIn: true` with a timestamp.

**Analytics Dashboard:** The `/api/dashboard/[eventId]` endpoint calculates total registrations, checked-in count, pending count, check-in rate percentage, total revenue (for paid events), hours until event, and whether the event is happening today or has passed.

---

## 📌 Problem Statement

| Aspect | Detail |
|--------|--------|
| **Problem** | Event organizers lack a simple, AI-powered platform to create, manage, and track events with QR-based ticketing |
| **Target Users** | College students, community organizers, small-scale event managers |
| **Pain Points** | Manual event creation, no AI assistance, no built-in QR check-in, scattered tools for registration and analytics |
| **Impact** | Time-consuming event setup, no real-time attendee tracking, no unified dashboard |

---

## 🏢 Existing Solutions & Why Spott is Different

| Platform | Limitation | Spott's Advantage |
|----------|-----------|-------------------|
| **Eventbrite** | Complex for small events, expensive paid plans | Free-first model, simpler UX |
| **Meetup** | Subscription required, no AI features | AI-powered event creation |
| **Google Forms** | No ticketing, no QR codes | Built-in QR generation + scanner |
| **Luma** | Limited free tier, US-focused | India-first (state/city selection), location-aware |
| **Manual (WhatsApp/Email)** | No tracking, no analytics | Real-time dashboard with check-in rates |

### Spott's Unique Differentiators
1. **AI Event Creation** — Describe in natural language → get complete event details
2. **QR Ticketing Pipeline** — Generate → Display → Scan → Validate → Prevent duplicates
3. **Location-Aware Discovery** — Onboarding captures city/state, explore shows local events first
4. **Real-Time Analytics** — Capacity %, check-in rate, revenue, time countdown
5. **Full-Stack Monolith** — Single Next.js codebase for frontend + backend + API

---

## ✨ Key Features

| # | Feature | Implementation |
|---|---------|----------------|
| 1 | AI Event Creation | Groq API generates title, description, category, capacity from natural language |
| 2 | JWT Authentication | Custom login/register with bcryptjs hashing, HttpOnly cookies, 7-day tokens |
| 3 | User Onboarding | 2-step modal: select interests (≥3 categories) + location (state/city) |
| 4 | Event Discovery | Featured carousel, local events, category browsing, popular events nationwide |
| 5 | Full-Text Search | Debounced search with regex matching on event titles, real-time dropdown results |
| 6 | Event Creation Form | Category selector, date/time pickers, state/city dropdowns, Unsplash cover images |
| 7 | QR Ticket Generation | Unique code `EVT-{ts}-{rand}`, rendered as QR via `react-qr-code` |
| 8 | QR Check-In Scanner | Camera-based scanning via `html5-qrcode`, with organizer authorization |
| 9 | Analytics Dashboard | Capacity utilization, check-in rate, revenue, time-to-event, attendee management |
| 10 | Attendee Management | Tabbed view (All/Checked-In/Pending), search, CSV export, manual check-in |
| 11 | Unsplash Integration | Image search and selection for event covers via Unsplash API |
| 12 | Location-Based Events | Country-state-city cascading dropdowns, location slug URL routing |

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js (App Router) | 16.0.10 | Full-stack React framework |
| **UI Library** | React | 19.2.1 | Component-based UI |
| **Language** | TypeScript + JavaScript | — | Type-safe APIs and models |
| **Styling** | Tailwind CSS | v4 | Utility-first CSS |
| **UI Components** | Radix UI + shadcn/ui | — | Accessible, composable components |
| **Database** | MongoDB Atlas | — | Cloud-hosted NoSQL database |
| **ODM** | Mongoose | 8.24.2 | Schema modeling, validation, indexes |
| **Auth (Token)** | jsonwebtoken | 9.0.3 | JWT sign/verify |
| **Auth (Hashing)** | bcryptjs | 3.0.3 | Password hashing |
| **Validation** | Zod | 4.3.5 | Schema-based request validation |
| **AI (Primary)** | Groq API | REST | AI event generation |
| **AI (Fallback)** | Google Generative AI (Gemini) | 0.24.1 | Fallback AI provider (commented) |
| **Images** | Unsplash API | REST | Event cover image search |
| **QR Generation** | react-qr-code | 2.0.18 | Client-side QR rendering |
| **QR Scanning** | html5-qrcode | 2.3.8 | Camera-based QR decoding |
| **Forms** | react-hook-form + @hookform/resolvers | 7.70.0 | Form state management |
| **Date Handling** | date-fns | 4.1.0 | Date formatting and manipulation |
| **Geo Data** | country-state-city | 3.2.1 | India state/city data |
| **Carousel** | embla-carousel-react | 8.6.0 | Featured events carousel |
| **Notifications** | sonner | 2.0.7 | Toast notifications |
| **Theming** | next-themes | 0.4.6 | Dark/light mode |
| **Deployment** | Vercel | — | Serverless deployment platform |

---

## 📝 Resume Description

### 3-Line ATS-Optimized

> Developed **Spott**, a full-stack AI-powered event management platform using **Next.js 16, React 19, MongoDB Atlas, Groq AI, and JWT authentication**, enabling organizers to create events via natural language AI prompts, manage QR-based ticketing, and track real-time analytics. Engineered **17 RESTful API endpoints** with Zod validation, implemented compound MongoDB indexes for optimized location-based queries, and built a camera-based QR check-in system preventing duplicate entries. Designed a responsive dark-mode UI with Tailwind CSS v4 and Radix UI components, featuring event discovery with debounced search, category browsing, and personalized location-aware recommendations.
