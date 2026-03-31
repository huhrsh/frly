# fryly — Project Context for Claude

## What is fryly?

A collaborative home-base app for small real-world groups (flatmates, families, friend crews). Replaces scattered WhatsApp threads and spreadsheets with one organized workspace.

**Live URLs**
- Frontend: https://fryly.vercel.app
- Backend: Cloudflare tunnel (dev), self-hosted (prod)
- GitHub: https://github.com/huhrsh/frly

---

## Tech Stack

| Layer     | Technology                                          |
|-----------|-----------------------------------------------------|
| Frontend  | React 19, Vite, Redux Toolkit, TailwindCSS, Axios   |
| Backend   | Spring Boot 3.2.1, Java 17, Maven                  |
| Database  | PostgreSQL 15 (Docker locally, managed in prod)     |
| Auth      | JWT (Bearer tokens, 30-day expiry)                  |
| File Host | Cloudinary                                          |
| Email     | Spring Mail (SMTP) + SendGrid                       |
| Push Notif| Web Push API (VAPID)                                |
| Migrations| Flyway (V1–V36)                                     |

---

## Monorepo Layout

```
/
├── frontend/          # React + Vite SPA
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # 23 page-level components
│   │   ├── redux/slices/ # groupSlice (Redux Toolkit)
│   │   ├── api/          # Axios client (sets JWT + X-Group-ID headers)
│   │   ├── hooks/        # Custom hooks
│   │   ├── context/      # Context providers
│   │   └── utils/        # Utility functions
│   ├── .env              # VITE_API_BASE_URL (local)
│   └── .env.production
│
├── backend/           # Spring Boot app
│   └── src/main/java/com/example/frly/
│       ├── auth/         # JWT auth, login, register, password reset
│       ├── config/       # Security, CORS, Cloudinary config
│       ├── user/         # User entity, repo, controller
│       ├── group/        # Groups, members, invites, DTOs
│       ├── section/      # Lists, notes, reminders, calendar, gallery, payments, links
│       ├── notification/ # Push + email notifications
│       ├── feedback/     # User feedback
│       ├── review/       # Public reviews
│       ├── email/        # Email service + HTML templates
│       └── common/       # Base entities, exceptions, storage service
│   └── src/main/resources/
│       ├── application.properties
│       └── db/           # 36 Flyway migration SQL files
│
├── docker-compose.yml  # PostgreSQL 15 for local dev
└── CLAUDE.md           # This file
```

---

## Key Features

1. **Lists** — Collaborative checklists (groceries, chores, packing)
2. **Notes** — Free-form docs with optimistic locking (version field) to handle concurrent edits
3. **Reminders** — Time-bound items with email notifications, frequency settings
4. **Calendar** — Events and trips, multi-member
5. **Gallery** — Shared photo uploads (Cloudinary)
6. **Links** — Bookmarks, folders, reorderable
7. **Payments** — Expense tracking and balance summaries
8. **Sections** — Container for any of the above types; support parent/child nesting, per-user ordering

---

## Architecture Highlights

- **Multi-tenancy**: Each group has a UUID tenant key. `X-Group-ID` header drives Hibernate's `GroupIdentifierResolver`.
- **Security**: `JwtAuthenticationFilter` validates Bearer tokens on every request.
- **Optimistic locking**: Notes use a `version` field; concurrent write conflict returns HTTP 409.
- **State management**: Redux slice (`groupSlice`) holds group/section data on the frontend.
- **PWA**: Offline-capable via Vite PWA + Workbox service worker.
- **DTOs + MapStruct**: Controllers receive/return DTOs; MapStruct generates mapper implementations.

---

## API Base

`http://localhost:8080/api` — all endpoints are under `/api`.

Key route groups:
- `/auth/*` — register, login, forgot/reset password
- `/groups/*` — CRUD, members, invites, view prefs
- `/groups/sections/*` — all section types (lists, notes, reminders, calendar, gallery, links, payments)
- `/notifications/*` — in-app + push
- `/users/*` — profile + settings
- `/feedback`, `/reviews`, `/group-invites/*`

---

## Local Development

```bash
# 1. Start PostgreSQL
docker-compose up -d

# 2. Start backend (runs Flyway migrations on startup)
cd backend && mvn spring-boot:run

# 3. Start frontend
cd frontend && npm run dev
```

Backend env vars live in `backend/.env`.
Frontend env vars live in `frontend/.env`.

---

## Current Goals (in priority order)

1. **Build a test suite** — both FE and BE, using free tooling only
   - Backend: JUnit 5 + Mockito (already bundled) + H2 (unit) + Testcontainers (integration)
   - Frontend: Vitest + React Testing Library + MSW (all free)
2. **Wire up GitHub Actions** — run tests on every push to `main`; block deploys on failure
3. **Refactor** — address code quality issues found during test writing
4. **New feature enhancements** — TBD; update test suite accordingly

---

## Test Suite (implemented)

**Backend** — pure `@ExtendWith(MockitoExtension.class)` unit tests, no Spring context, no DB needed:
- `AuthServiceTest` — login (success / bad email / bad password), resetPassword, sendPasswordResetEmail
- `JwtServiceTest` — generateToken, validateToken, getUserId, getEmail, wrong-secret rejection
- `UserServiceTest` — createUser (hashed password), getUserById, updateCurrentUser
- `GroupServiceTest` — createGroup, joinGroup (all edge cases), validateGroupAccess, deleteGroup

`AuthUtil.getCurrentUserId()` is tested by setting `SecurityContextHolder` directly.
`GroupContext` is a ThreadLocal; tests call `GroupContext.setGroupId()` / `GroupContext.clear()`.

**Frontend** — Vitest + React Testing Library + jsdom:
- `dateUtils.test.js` — parseUTCDate, formatTimeAgo (fake timers)
- `groupSlice.test.js` — all reducers + extraReducers for fetchGroupDetails
- `AuthContext.test.jsx` — login/logout/register/updateUser via RTL render

**CI** — `.github/workflows/ci.yml`:
- Triggers on every push and PR to `main`
- `backend-tests` job: Java 17, `mvn test -B` (no env vars required for unit tests)
- `frontend-tests` job: Node 20, `npm ci && npm test`
- Vercel deployment blocked until both jobs pass (configure in Vercel dashboard → Settings → Git → Required checks)

---

## Notes / Gotchas

- No TypeScript on the frontend — plain JavaScript (ESLint only)
- `spring-boot-starter-test` is already a dependency (JUnit 5 + Mockito included)
- Flyway migrations run automatically on startup; integration tests need a clean DB strategy
- Cloudinary, SendGrid, and VAPID keys must NOT be committed; use GitHub Secrets in CI
- Multi-tenancy is driven by `X-Group-ID` header — tests must set this header correctly
- Notes use optimistic locking; concurrent-write tests should verify 409 behaviour
