# Spott – Complete API Documentation

---

This document provides complete documentation for all **19 API Endpoints** implemented in Spott.

All API responses follow a standardized JSON wrapper:
- **Success:** `{ "success": true, "data": <Payload> }`
- **Failure:** `{ "success": false, "error": "<Error Message>" }`

---

## Summary Table of Endpoints

| Category | Endpoint | Method | Auth | Description |
|----------|----------|--------|------|-------------|
| Auth | `/api/auth/register` | POST | Public | Register new user account |
| Auth | `/api/auth/login` | POST | Public | Authenticate user & set JWT cookie |
| Auth | `/api/auth/logout` | POST | Public | Clear authentication cookie |
| Auth | `/api/auth/me` | GET | Token | Get authenticated user details |
| Auth | `/api/auth/onboarding` | POST | Token | Update user location & interests |
| Events | `/api/events` | POST | Token | Create new event |
| Events | `/api/events/[slug]` | GET | Public | Fetch event details by slug |
| Events | `/api/events/[slug]` | DELETE | Token | Delete event & associated tickets |
| Events | `/api/events/my` | GET | Token | Fetch events created by current user |
| Events | `/api/events/explore` | GET | Public | Fetch featured, location, popular, or counts |
| Events | `/api/events/search` | GET | Public | Search events by title (regex) |
| AI | `/api/generate-event` | POST | Public | Generate event details via Groq AI |
| Tickets | `/api/registrations` | POST | Token | Register for an event (generate ticket) |
| Tickets | `/api/registrations` | GET | Token | Fetch user's registered tickets |
| Tickets | `/api/registrations/[id]` | DELETE | Token | Cancel a ticket registration |
| Tickets | `/api/registrations/check` | GET | Optional | Check if user is registered for an event |
| Tickets | `/api/registrations/check-in` | POST | Token | Organizer check-in via scanned QR code |
| Tickets | `/api/registrations/event/[eventId]` | GET | Token | Fetch attendee list for event |
| Dashboard| `/api/dashboard/[eventId]` | GET | Token | Get organizer analytics & stats |

---

## Detailed Endpoint Documentation

### 1. Authentication Endpoints

#### 1.1 `POST /api/auth/register`
- **Description:** Registers a new user, hashes password with bcrypt (10 rounds), generates JWT token, and sets `auth_token` HttpOnly cookie.
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
- **Validation Rules (Zod):**
  - `name`: String, min 2 chars
  - `email`: Valid email format
  - `password`: String, min 6 chars
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "66bc81...",
      "name": "John Doe",
      "email": "john@example.com",
      "hasCompletedOnBoarding": false,
      "freeEventsCreated": 0,
      "createdAt": "2026-08-18T10:00:00.000Z"
    }
  }
  ```
- **Error Responses:**
  - `422 Unprocessable Entity` — Email already in use / Validation failure
  - `500 Internal Server Error` — Database failure

---

#### 1.2 `POST /api/auth/login`
- **Description:** Validates user credentials, generates JWT token, sets `auth_token` HttpOnly cookie.
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "66bc81...",
      "name": "John Doe",
      "email": "john@example.com",
      "hasCompletedOnBoarding": true
    }
  }
  ```
- **Error Responses:**
  - `422 Unprocessable Entity` — Invalid credentials (email not found or password mismatch)

---

#### 1.3 `POST /api/auth/logout`
- **Description:** Clears the `auth_token` cookie from client browser.
- **Auth:** Public
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": { "message": "Logged out successfully" }
  }
  ```

---

#### 1.4 `GET /api/auth/me`
- **Description:** Retrieves the authenticated user profile (excluding password).
- **Auth:** Required (`auth_token` cookie)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "66bc81...",
      "name": "John Doe",
      "email": "john@example.com",
      "hasCompletedOnBoarding": true,
      "location": { "city": "Gurugram", "state": "Haryana", "country": "India" },
      "interests": ["tech", "gaming", "music"],
      "freeEventsCreated": 1
    }
  }
  ```
- **Error Response:** `401 Unauthorized` — Invalid or missing token

---

#### 1.5 `POST /api/auth/onboarding`
- **Description:** Updates user location and interests, setting `hasCompletedOnBoarding: true`.
- **Auth:** Required
- **Request Body:**
  ```json
  {
    "location": { "city": "Gurugram", "state": "Haryana", "country": "India" },
    "interests": ["tech", "gaming", "music"]
  }
  ```
- **Validation Rules:** `interests` must contain at least 3 categories, `city` required.
- **Success Response (200 OK):** Updated user object.

---

### 2. Events Endpoints

#### 2.1 `POST /api/events`
- **Description:** Creates a new event, increments user's `freeEventsCreated` counter, generates a unique slug.
- **Auth:** Required
- **Request Body:**
  ```json
  {
    "title": "React 19 Tech Meetup",
    "description": "Join us for an in-depth session on React 19 Actions and Compiler features.",
    "category": "tech",
    "startDate": 1787140800000,
    "endDate": 1787151600000,
    "locationType": "physical",
    "city": "Gurugram",
    "state": "Haryana",
    "capacity": 100,
    "ticketType": "free",
    "themeColor": "#1e3a8a"
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "66bc90...",
      "slug": "react-19-tech-meetup-1723987200000",
      "organizerId": "66bc81...",
      "organizerName": "John Doe",
      "registrationCount": 0
    }
  }
  ```

---

#### 2.2 `GET /api/events/[slug]`
- **Description:** Retrieves event by unique URL slug.
- **Auth:** Public
- **Success Response (200 OK):** Event JSON document.
- **Error Response:** `404 Not Found` if slug does not exist.

---

#### 2.3 `DELETE /api/events/[slug]`
- **Description:** Deletes event, purges all associated registrations, and decrements user's `freeEventsCreated`.
- **Auth:** Required (Must be event organizer)
- **Success Response (200 OK):** `{ "success": true, "message": "Event deleted successfully" }`
- **Error Response:** `403 Forbidden` if user is not event organizer.

---

#### 2.4 `GET /api/events/my`
- **Description:** Fetches all events created by the logged-in user sorted by creation date descending.
- **Auth:** Required
- **Success Response (200 OK):** Array of event objects.

---

#### 2.5 `GET /api/events/explore`
- **Description:** Dynamic explore endpoint supporting parameters: `type` (`featured`, `popular`, `location`, `category`, `counts`), `city`, `state`, `category`, `limit`.
- **Auth:** Public
- **Query Examples:**
  - `/api/events/explore?type=featured&limit=3` — Returns top registered upcoming events.
  - `/api/events/explore?type=location&city=Gurugram&limit=4` — Returns upcoming events in specified city.
  - `/api/events/explore?type=counts` — Returns category counts map `{ "tech": 5, "music": 2 }`.

---

#### 2.6 `GET /api/events/search`
- **Description:** Performs case-insensitive regex title search on upcoming events.
- **Auth:** Public
- **Query Params:** `query` (min 2 chars), `limit` (default 5).
- **Success Response (200 OK):** Array of matching event summaries.

---

### 3. AI Endpoint

#### 3.1 `POST /api/generate-event`
- **Description:** Generates structured event details from natural language prompt using Groq AI REST API.
- **Auth:** Public
- **Request Body:** `{ "prompt": "A Bangalore hackathon about Generative AI" }`
- **Success Response (200 OK):**
  ```json
  {
    "title": "Bangalore GenAI Hackathon 2026",
    "description": "Compete with top developers to build generative AI solutions in 24 hours.",
    "category": "tech",
    "suggestedCapacity": 100,
    "suggestedTicketType": "free"
  }
  ```

---

### 4. Ticket & Registration Endpoints

#### 4.1 `POST /api/registrations`
- **Description:** Registers user for event, generates unique QR code string `EVT-{ts}-{random}`, increments event `registrationCount`.
- **Auth:** Required
- **Request Body:**
  ```json
  {
    "eventId": "66bc90...",
    "attendeeName": "Jane Smith",
    "attendeeEmail": "jane@example.com"
  }
  ```
- **Error Checks:**
  - `400 Bad Request` — Event capacity reached
  - `400 Bad Request` — User already registered (`eventId + userId` duplicate)

---

#### 4.2 `GET /api/registrations`
- **Description:** Fetches all ticket registrations for the authenticated user, populated with event details.
- **Auth:** Required

---

#### 4.3 `DELETE /api/registrations/[id]`
- **Description:** Cancels ticket registration (`status = "cancelled"`), decrements event `registrationCount`.
- **Auth:** Required (User must own ticket)

---

#### 4.4 `GET /api/registrations/check?eventId=<id>`
- **Description:** Checks if current user is confirmed registered for given event ID. Returns registration object or `null`.

---

#### 4.5 `POST /api/registrations/check-in`
- **Description:** Scans attendee QR code, verifies organizer authorization, marks `checkedIn: true` and `checkedInAt: timestamp`.
- **Auth:** Required (Organizer of event only)
- **Request Body:** `{ "qrCode": "EVT-1723987200-A8B9C" }`
- **Responses:**
  - `200 OK` `{ success: true, message: "Check-in successful" }`
  - `200 OK` `{ success: false, message: "Already checked in" }`
  - `403 Forbidden` — Scanned by non-organizer

---

#### 4.6 `GET /api/registrations/event/[eventId]`
- **Description:** Returns full attendee list for event (organizer only).

---

### 5. Dashboard Endpoint

#### 5.1 `GET /api/dashboard/[eventId]`
- **Description:** Aggregates analytics metrics for organizer event dashboard.
- **Auth:** Required (Event organizer only)
- **Success Response (200 OK):**
  ```json
  {
    "event": { ... },
    "stats": {
      "totalRegistrations": 45,
      "checkedInCount": 30,
      "pendingCount": 15,
      "capacity": 100,
      "checkInRate": 67,
      "totalRevenue": 0,
      "hoursUntilEvent": 14,
      "isEventToday": true,
      "isEventPast": false
    }
  }
  ```
