# Spott – Architecture Documentation

---

## 1. High-Level System Architecture

Spott follows a **monolithic full-stack architecture** where the frontend (React), backend (API routes), and database layer all exist within a single Next.js 16 application. This design choice simplifies deployment (single Vercel project), eliminates CORS issues, and enables shared TypeScript types between frontend and backend.

```mermaid
graph TB
    subgraph Client["🖥️ Client Browser"]
        UI["React 19 UI<br/>Tailwind CSS v4"]
        AuthCtx["AuthProvider Context"]
        Hooks["Custom Hooks<br/>useQuery / useMutation / useAuth"]
    end

    subgraph NextJS["⚡ Next.js 16 App Router"]
        subgraph Pages["📄 Pages (Route Groups)"]
            Auth["(auth)<br/>sign-in, sign-up"]
            Main["(main)<br/>create-event, my-events, my-tickets"]
            Public["(public)<br/>explore, events/[slug]"]
        end

        subgraph API["🔌 API Routes (/app/api/)"]
            AuthAPI["Auth API<br/>register, login, logout, me, onboarding"]
            EventsAPI["Events API<br/>CRUD, explore, search, [slug]"]
            RegAPI["Registrations API<br/>register, check, check-in, cancel"]
            DashAPI["Dashboard API<br/>[eventId] analytics"]
            AIAPI["Generate Event API<br/>Groq AI"]
        end

        subgraph Lib["📚 Library Layer"]
            JWT["jwt.ts<br/>sign, verify, getCookie"]
            AuthGuard["auth-guard.ts<br/>authenticateRequest"]
            MongoDB["mongodb.ts<br/>Connection Pool"]
            Validation["validations.ts<br/>Zod Schemas"]
            ApiResp["api-response.ts<br/>Response Helpers"]
        end
    end

    subgraph External["☁️ External Services"]
        MongoAtlas["MongoDB Atlas<br/>Cloud Database"]
        GroqAI["Groq API<br/>AI Event Generation"]
        Unsplash["Unsplash API<br/>Cover Images"]
    end

    UI --> Hooks
    Hooks --> API
    API --> Lib
    Lib --> MongoAtlas
    AIAPI --> GroqAI
    UI --> Unsplash
    AuthGuard --> JWT
    AuthGuard --> MongoDB
```

---

## 2. Frontend Architecture

### 2.1 App Router Folder Structure

```
app/
├── layout.js              # Root layout (ThemeProvider, AuthProvider, Header, Footer)
├── page.jsx               # Landing page (/)
├── globals.css            # Global styles (Tailwind CSS v4)
├── favicon.ico
│
├── (auth)/                # Auth route group (no layout nesting prefix)
│   ├── layout.js          # Centered layout wrapper
│   ├── sign-in/page.jsx   # Login form
│   └── sign-up/page.jsx   # Registration form
│
├── (main)/                # Authenticated route group
│   ├── create-event/
│   │   ├── page.jsx       # Event creation form + AI generator
│   │   └── _components/
│   │       └── ai-event-creator.jsx
│   ├── my-events/
│   │   ├── page.jsx       # Organizer's event list
│   │   └── [eventId]/
│   │       ├── page.jsx   # Event dashboard (analytics + attendees)
│   │       └── _components/
│   │           ├── qr-scanner-modal.jsx
│   │           └── attendee-card.jsx
│   └── my-tickets/
│       └── page.jsx       # Attendee's ticket list + QR display
│
├── (public)/              # Public route group
│   ├── explore/
│   │   ├── page.jsx       # Event discovery (featured, local, categories, popular)
│   │   └── [slug]/page.jsx # Dynamic: category or location-based events
│   └── events/
│       └── [slug]/
│           ├── page.jsx   # Event detail page + registration
│           └── _components/
│               └── register-modal.jsx
│
└── api/                   # Backend API routes
    ├── auth/              # Authentication endpoints
    ├── events/            # Event CRUD + discovery
    ├── registrations/     # Ticket management
    ├── dashboard/         # Analytics
    └── generate-event/    # AI generation
```

### 2.2 Route Groups Explained

| Route Group | Purpose | Layout | Auth Required |
|-------------|---------|--------|---------------|
| `(auth)` | Login/Register pages | Centered flex layout | No |
| `(main)` | Organizer/Attendee dashboards | Root layout with Header | Yes (via `useAuth`) |
| `(public)` | Event discovery and details | Root layout with Header | No (optional for registration) |

> **Design Decision:** Route groups `()` in Next.js App Router allow organizing pages without affecting the URL structure. `(auth)/sign-in` maps to `/sign-in`, not `/auth/sign-in`.

### 2.3 Component Architecture

```mermaid
graph TB
    RootLayout["RootLayout<br/>ThemeProvider + AuthProvider + Header"]
    
    subgraph Shared["Shared Components"]
        Header["header.jsx<br/>Nav + Search + Auth Menu"]
        EventCard["event-card.jsx<br/>Grid/List/Compact variants"]
        SearchBar["search-location-bar.jsx<br/>Debounced search + City/State"]
        Onboarding["onboarding-modal.jsx<br/>2-step interests + location"]
        UnsplashPicker["unsplash-image-picker.jsx<br/>Image search dialog"]
        UpgradeModal["upgrade-modal.jsx<br/>Pro pricing placeholder"]
    end

    subgraph UILib["UI Library (shadcn/ui + Radix)"]
        Button & Card & Dialog & Select & Tabs & Badge & Input & Calendar
    end

    subgraph Hooks["Custom Hooks"]
        useAuth["useAuth<br/>Context: user, login, logout"]
        useQuery["useQuery<br/>GET with auto-fetch + refetch"]
        useMutation["useMutation<br/>POST/PUT/DELETE with loading"]
        useOnboarding["useOnboarding<br/>Conditional onboarding flow"]
    end

    RootLayout --> Header
    Header --> SearchBar
    Header --> Onboarding
    Shared --> UILib
    Shared --> Hooks
```

### 2.4 State Management

Spott uses **React Context + Custom Hooks** (no Redux/Zustand):

| State | Management | Scope |
|-------|-----------|-------|
| Authentication | `AuthContext` via `useAuth` | Global |
| Server Data | `useQuery` hook (fetch-based) | Per component |
| Mutations | `useMutation` hook | Per action |
| Form State | `react-hook-form` + Zod | Per form |
| UI State | `useState` | Per component |

---

## 3. Backend Architecture

### 3.1 API Layer

All API routes are Next.js **Route Handlers** under `/app/api/`. Each route exports HTTP method functions (`GET`, `POST`, `DELETE`).

```
app/api/
├── auth/
│   ├── register/route.ts    # POST - User registration
│   ├── login/route.ts       # POST - User login
│   ├── logout/route.ts      # POST - Clear auth cookie
│   ├── me/route.ts          # GET  - Current user
│   └── onboarding/route.ts  # POST - Complete onboarding
├── events/
│   ├── route.ts             # POST - Create event
│   ├── [slug]/route.ts      # GET  - Event by slug, DELETE - Delete event
│   ├── my/route.ts          # GET  - Organizer's events
│   ├── explore/route.ts     # GET  - Featured/Popular/Location/Category events
│   └── search/route.ts      # GET  - Search events by title
├── registrations/
│   ├── route.ts             # POST - Register for event, GET - User's registrations
│   ├── [id]/route.ts        # DELETE - Cancel registration
│   ├── check/route.ts       # GET  - Check if user is registered
│   ├── check-in/route.ts    # POST - QR check-in
│   └── event/[eventId]/route.ts  # GET - Event's registrations (organizer only)
├── dashboard/
│   └── [eventId]/route.ts   # GET  - Event analytics
└── generate-event/
    └── route.js             # POST - AI event generation
```

### 3.2 Request Lifecycle

```mermaid
sequenceDiagram
    participant C as Client
    participant R as Route Handler
    participant V as Zod Validator
    participant A as Auth Guard
    participant J as JWT Module
    participant DB as MongoDB
    participant AI as Groq AI

    C->>R: HTTP Request
    R->>V: Validate request body
    alt Validation fails
        V-->>R: ZodError
        R-->>C: 422 Validation Error
    end
    R->>A: authenticateRequest(req)
    A->>J: Extract cookie & verifyToken()
    alt Token invalid
        J-->>A: null
        A-->>R: 401 Unauthorized
        R-->>C: 401 Response
    end
    A->>DB: User.findById(userId)
    alt User not found
        DB-->>A: null
        A-->>R: 401 User not found
    end
    A-->>R: { user, payload }
    R->>DB: Business Logic Query
    DB-->>R: Result
    R-->>C: 200 successResponse(data)
```

### 3.3 API Response Pattern

Every API endpoint uses a consistent response format:

```typescript
// Success: { success: true, data: <payload> }
// Error:   { success: false, error: "<message>" }

successResponse(data, status?)     // 200
errorResponse(message, status?)    // 500
unauthorizedResponse(message?)     // 401
forbiddenResponse(message?)        // 403
notFoundResponse(message?)         // 404
validationErrorResponse(message?)  // 422
```

---

## 4. Authentication Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as Auth API
    participant B as bcryptjs
    participant J as JWT
    participant DB as MongoDB
    participant C as Cookie Store

    Note over U,C: Registration Flow
    U->>F: Fill name, email, password
    F->>API: POST /api/auth/register
    API->>DB: Check existing user by email
    alt User exists
        DB-->>API: User found
        API-->>F: 422 "Email already in use"
    end
    API->>B: genSalt(10) + hash(password)
    B-->>API: hashedPassword
    API->>DB: User.create({ name, email, hashedPassword })
    DB-->>API: newUser
    API->>J: signToken({ userId, email, name })
    J-->>API: JWT (7-day expiry)
    API->>C: Set HttpOnly cookie "auth_token"
    API-->>F: 201 { user object without password }
    F->>F: AuthContext.login(user)

    Note over U,C: Login Flow
    U->>F: Fill email, password
    F->>API: POST /api/auth/login
    API->>DB: User.findOne({ email })
    API->>B: bcrypt.compare(password, hash)
    alt Password mismatch
        B-->>API: false
        API-->>F: 422 "Invalid credentials"
    end
    API->>J: signToken({ userId, email, name })
    API->>C: Set HttpOnly cookie
    API-->>F: 200 { user }
```

### Cookie Configuration

| Property | Value | Reason |
|----------|-------|--------|
| `httpOnly` | `true` | Prevents JavaScript access (XSS protection) |
| `secure` | `true` (prod) | HTTPS only in production |
| `sameSite` | `strict` | CSRF protection |
| `maxAge` | `604800` (7 days) | Token expiry alignment |
| `path` | `/` | Available across all routes |

---

## 5. Database Layer

### Connection Architecture

```mermaid
graph LR
    subgraph NextJS["Next.js Process"]
        Handler1["API Handler 1"]
        Handler2["API Handler 2"]
        Handler3["API Handler 3"]
        GlobalCache["global.mongooseCache<br/>{conn, promise}"]
    end
    
    subgraph MongoDB["MongoDB Atlas"]
        Pool["Connection Pool<br/>min:2, max:10"]
        DB["spott Database"]
    end

    Handler1 --> GlobalCache
    Handler2 --> GlobalCache
    Handler3 --> GlobalCache
    GlobalCache --> Pool
    Pool --> DB
```

The connection uses a **global cache pattern** to prevent multiple connections during Next.js hot reloads:

```typescript
// Cached on global object to survive hot reloads
const cached = global.mongooseCache ?? { conn: null, promise: null };
// Connection pool: maxPoolSize: 10, minPoolSize: 2
// Timeouts: socketTimeout: 45s, serverSelection: 10s
```

---

## 6. AI Layer

```mermaid
sequenceDiagram
    participant U as User
    participant F as AI Creator Dialog
    participant API as /api/generate-event
    participant G as Groq API

    U->>F: "A tech meetup about React 19..."
    F->>API: POST { prompt }
    API->>G: POST /v1/compound-mini/completions<br/>{ input: systemPrompt, max_output_tokens: 500 }
    G-->>API: { output_text: '{"title":"...", ...}' }
    API->>API: JSON.parse(output_text)
    alt Parse fails
        API-->>F: 500 "Failed to parse AI response"
    end
    API-->>F: { title, description, category, suggestedCapacity, suggestedTicketType }
    F->>F: setValue("title", data.title)<br/>setValue("description", data.description)<br/>...
```

The AI generates structured JSON with these fields:
- `title` — Catchy event title (< 80 chars)
- `description` — 2-3 sentence paragraph
- `category` — One of 12 predefined categories
- `suggestedCapacity` — Integer
- `suggestedTicketType` — "free" or "paid"

---

## 7. QR Ticketing Workflow

```mermaid
sequenceDiagram
    participant A as Attendee
    participant F as Frontend
    participant API as Registrations API
    participant DB as MongoDB
    participant O as Organizer
    participant S as QR Scanner

    Note over A,S: Registration & QR Generation
    A->>F: Click "Register for Event"
    F->>API: POST /api/registrations<br/>{ eventId, attendeeName, attendeeEmail }
    API->>DB: Check capacity (registrationCount < capacity)
    API->>DB: Check duplicate (eventId + userId unique)
    API->>API: generateQRCode()<br/>"EVT-{timestamp}-{random}"
    API->>DB: Registration.create({ qrCode, ... })
    API->>DB: Event.updateOne({ $inc: { registrationCount: 1 } })
    API-->>F: 201 { registration with qrCode }
    F->>F: Display QR via react-qr-code

    Note over A,S: Check-In Flow
    O->>S: Open QR Scanner (html5-qrcode)
    S->>S: Camera captures QR code
    S->>API: POST /api/registrations/check-in<br/>{ qrCode }
    API->>DB: Registration.findOne({ qrCode })
    alt Invalid QR
        API-->>S: 400 "Invalid QR code"
    end
    API->>DB: Event.findById(registration.eventId)
    API->>API: Verify organizer owns event
    alt Not organizer
        API-->>S: 403 "Not authorized"
    end
    alt Already checked in
        API-->>S: 200 { success: false, message: "Already checked in" }
    end
    API->>DB: registration.checkedIn = true<br/>registration.checkedInAt = Date.now()
    API-->>S: 200 { success: true, message: "Check-in successful" }
```

### QR Code Format
```
EVT-{Unix Timestamp}-{9-char Random Alphanumeric Uppercase}
Example: EVT-1723456789123-A7BX3KM92
```

### Security Measures
1. **Uniqueness** — `qrCode` field has a `unique: true` index
2. **Authorization** — Only the event organizer can perform check-ins
3. **Duplicate Prevention** — `checkedIn` boolean flag prevents re-scanning
4. **Compound Index** — `{eventId, userId}` unique index prevents double registration
