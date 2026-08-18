# Spott – Quality Assurance & Manual Testing Report

---

This document outlines the testing strategy, test scenarios, manual test cases, and edge-case validations executed for **Spott – AI Events Organiser**.

---

## 1. Testing Strategy Overview

The testing strategy covers:
- **Authentication & Authorization Security** — JWT cookie validation, session persistence, unauthorized route access attempts.
- **API Functional Testing** — Verification of all 19 REST endpoints across success and error conditions.
- **Business Logic Rules** — Capacity limits, duplicate registration prevention, freemium limits.
- **Hardware Integration** — Camera-based QR code scanning across devices.
- **AI Integration Integrity** — JSON formatting parsing and prompt handling.

---

## 2. Manual Test Case Matrix

### 2.1 Authentication & User Onboarding

| Test Case ID | Feature | Scenario | Input Data | Expected Result | Status |
|--------------|---------|----------|------------|-----------------|--------|
| `TC-AUTH-01` | Registration | Valid user registration | Name: "Test User", Email: "test@example.com", Password: "password123" | User created (201), JWT `auth_token` cookie set in browser, redirected | PASSED |
| `TC-AUTH-02` | Registration | Existing email registration | Email: "test@example.com" | HTTP 422 error: "Email is already in use" | PASSED |
| `TC-AUTH-03` | Registration | Short password (< 6 chars) | Password: "123" | Validation error: "Password must be at least 6 characters" | PASSED |
| `TC-AUTH-04` | Login | Valid login credentials | Email: "test@example.com", Password: "password123" | User authenticated (200), cookie updated, welcome toast shown | PASSED |
| `TC-AUTH-05` | Login | Incorrect password | Incorrect password | HTTP 422 error: "Invalid credentials" | PASSED |
| `TC-AUTH-06` | Logout | Click Log Out button | N/A | `auth_token` cookie deleted, user redirected to `/sign-in` | PASSED |
| `TC-AUTH-07` | Onboarding | Select < 3 interests | 2 interests selected | Toast notification: "Please select at least 3 interests" | PASSED |
| `TC-AUTH-08` | Onboarding | Complete onboarding | 3 interests + State: "Haryana", City: "Gurugram" | User `hasCompletedOnBoarding: true`, saved to DB | PASSED |

---

### 2.2 Event Management & AI Generation

| Test Case ID | Feature | Scenario | Input Data | Expected Result | Status |
|--------------|---------|----------|------------|-----------------|--------|
| `TC-EVT-01` | Event Create | Create valid event | Title: "Tech Talk", Capacity: 50, Date: Future | Event created in DB, user redirected to `/my-events` | PASSED |
| `TC-EVT-02` | Event Create | End date before start date | Start: Tomorrow, End: Today | Error toast: "End date/time must be after start date/time" | PASSED |
| `TC-EVT-03` | AI Generator| Prompt to AI | "React conference in Delhi" | Auto-fills Title, Description, Category, Capacity fields | PASSED |
| `TC-EVT-04` | AI Generator| Empty prompt submission | "" | Toast error: "Please describe your event" | PASSED |
| `TC-EVT-05` | Delete Event| Organizer deletes event | Click Delete -> Confirm | Event and associated registrations purged, count decremented | PASSED |
| `TC-EVT-06` | Delete Event| Non-organizer attempts delete | Direct API call to `DELETE /api/events/[slug]` | HTTP 403 Forbidden: "You are not authorized to delete this event" | PASSED |

---

### 2.3 Ticket Registration & QR Validation

| Test Case ID | Feature | Scenario | Input Data | Expected Result | Status |
|--------------|---------|----------|------------|-----------------|--------|
| `TC-REG-01` | Register | Valid event registration | Name: "Attendee", Email: "att@example.com" | Registration doc created, ticket QR generated, count +1 | PASSED |
| `TC-REG-02` | Register | Duplicate registration attempt | Same user registering twice | HTTP 400 Error: "You are already registered for this event" | PASSED |
| `TC-REG-03` | Register | Event at full capacity | Register when `registrationCount === capacity` | HTTP 400 Error: "Event is full" | PASSED |
| `TC-REG-04` | Check-in | Organizer scans valid QR code | Valid `EVT-...` QR string | Attendee marked `checkedIn: true`, toast success | PASSED |
| `TC-REG-05` | Check-in | Rescan already checked-in QR | Previously scanned QR | Response message: "Already checked in", no error | PASSED |
| `TC-REG-06` | Check-in | Scan invalid/random QR string | "INVALID-CODE-123" | HTTP 400 Error: "Invalid QR code" | PASSED |
| `TC-REG-07` | Check-in | Non-organizer scans QR code | Non-organizer user token | HTTP 403 Forbidden: "You are not authorized to check in attendees" | PASSED |
| `TC-REG-08` | Ticket Cancel| Attendee cancels registration | Click cancel on ticket card | Ticket status updated to `cancelled`, event count -1 | PASSED |

---

## 3. Edge Case Testing & Defensive Guard Validation

### 3.1 Network & Database Edge Cases
- **Database Disconnection Handling:** When `MONGODB_URI` string is invalid or network drops, `connectToDatabase()` catches the error, sets `cached.promise = null`, and throws a clean error response without crashing Node process.
- **Unauthenticated API Access:** Accessing protected endpoints (`GET /api/events/my`, `POST /api/events`) without `auth_token` cookie returns HTTP 401 Unauthorized.

### 3.2 UI & Responsive Behavior
- **Search Dropdown Click Outside:** Clicking outside `search-location-bar` automatically dismisses the real-time search dropdown via `mousedown` event listener.
- **Unsplash API Failure:** If Unsplash API rate limit is exceeded or network fails, `UnsplashImagePicker` catches error gracefully and displays empty search state without breaking the form.
