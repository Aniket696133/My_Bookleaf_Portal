# BookLeaf Author Support & Communication Portal

MERN app with an author portal, an admin portal and AI-assisted ticket handling (classification, priority, drafted replies).

## Folder structure
```
bookleaf-portal/
├── README.md
├── .gitignore
├── server/                     Express + MongoDB API
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js           entry point (DB connect + listen)
│       ├── app.js              middleware + route mounting
│       ├── constants.js        categories, priorities, statuses
│       ├── config/             env.js (validated env vars), db.js
│       ├── models/             User, Author, Book, Ticket, Message
│       ├── middleware/         auth (JWT + RBAC), validate (zod), errorHandler
│       ├── routes/             auth, books, tickets, admin + schemas.js (zod)
│       ├── controllers/        thin HTTP handlers
│       ├── services/ai/        client, prompts, knowledgeBase, classifier, drafter, royaltyFacts
│       ├── utils/              HttpError, asyncHandler, serializers
│       └── seed/               seed.js + bookleaf_sample_data.json
└── client/                     React (Vite)
    ├── .env.example
    ├── index.html, vite.config.js, package.json
    └── src/
        ├── main.jsx, App.jsx, styles.css
        ├── api/client.js       axios instance + error helper
        ├── context/AuthContext.jsx
        ├── hooks/usePolling.js
        ├── utils/format.js
        ├── components/         Navbar, ProtectedRoute, Badges, Thread
        └── pages/
            ├── Login.jsx
            ├── author/         MyBooks, SubmitTicket, MyTickets
            └── admin/          TicketQueue, TicketDetail
```

## Run locally
Requirements: Node 18+, MongoDB (local or Atlas).

```bash
# 1) API
cd server
cp .env.example .env        # set MONGODB_URI, JWT_SECRET, ANTHROPIC_API_KEY
npm install
npm run seed                # loads the 10 authors / 18 books + admin
npm run dev                 # http://localhost:5000

# 2) Frontend (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

### Test logins
| Role | Email | Password |
|---|---|---|
| Admin | admin@bookleaf.com | Admin@123 |
| Author | any email from the dataset, e.g. priya.sharma@email.com | Author@123 |

Useful edge-case authors: `kavita.deshmukh@email.com` (book in production + ₹850 pending, below the ₹1,000 threshold), `ananya.reddy@email.com` (no payout yet), `sneha.kulkarni@email.com` (book in Cover Design).

## Architecture decisions
- **Layering**: routes (validation + RBAC) → controllers (HTTP) → services (AI logic) → models. Controllers stay thin.
- **MongoDB with separate collections** (authors, books, tickets, messages). Messages are their own collection so internal notes are filtered in the query, never in the UI.
- **Auth**: JWT (author id embedded in the token). Authors' queries always filter by the id from the token, never from client input. Other authors' tickets return 404.
- **Real time**: polling (8s list, 5s open ticket, 10s admin queue), paused on hidden tabs. Simple and robust; SSE is the next step.
- **Derived fields** (`isActive`, `priorityRank`) are set in a pre-save hook so queue sorting is a single indexed query: unresolved first, then most urgent, then oldest.

## AI integration
- **Model**: Claude Haiku (default `AI_MODEL=claude-haiku-5-5`): low cost, fast, reliable JSON, good tone control. Change the model with the env var; swapping provider only touches `services/ai/client.js`.
- **Classification**: one tiny call per ticket (ticket text + book title/status only, `max_tokens` 120). Output is JSON validated with zod; invalid output counts as a failure. Guardrail: ISBN issues are always at least High (per KB policy).
- **Drafting**: the prompt gets only (a) tone guidelines, (b) the KB slice for the ticket's category, (c) the relevant book's facts (computed in code: pending amount, payout threshold rollover, next payout deadline), (d) one worked example, (e) the last 4 public messages. Never the full KB or full history.
- **Lazy drafting**: drafts are generated when an admin opens a ticket, not at creation, and cached on the ticket. Regenerate is explicit. Token usage is stored on the draft.
- **Graceful degradation**: ticket creation never waits for AI (fire-and-forget). SDK timeout + retries with backoff on 429/5xx. On failure the ticket gets `aiStatus=failed`, the queue shows a flag, admins can set category/priority manually, retry, or write replies by hand. Draft endpoint returns a clear `503`.
- **Overrides**: admin changes set `categorySource/prioritySource = admin`; later AI runs never overwrite them.
- **Security**: API key only in server env; never sent to the browser.

## API (all routes under `/api`, JSON, `Authorization: Bearer <token>`)
Errors always look like `{ "error": { "message": "...", "details": [{ "field", "message" }] } }`.

| Method | Path | Role | Description |
|---|---|---|---|
| GET | /health | public | Health + whether AI is configured |
| POST | /auth/login | public | `{email, password}` → `{token, user}` (rate limited) |
| GET | /auth/me | any | Current user |
| GET | /books | author | The author's own books |
| POST | /tickets | author | `{bookId|null, subject, description, attachments[]}` → 201, AI classification runs in background |
| GET | /tickets | any | Author: own tickets. Admin: all, filters `status, category, priority, assigned(me\|unassigned), from, to, page, limit` |
| GET | /tickets/:id | owner/admin | Ticket + messages (internal notes only for admin) |
| POST | /tickets/:id/messages | owner/admin | `{body, isInternal?}` (`isInternal` honoured for admins only) |
| PATCH | /admin/tickets/:id | admin | `{status?, category?, priority?, assignedTo?: "me"\|null}` |
| POST | /admin/tickets/:id/classify | admin | Retry AI classification |
| POST | /admin/tickets/:id/draft | admin | Generate AI draft reply (503 if AI unavailable) |

Status codes: 400 validation, 401 unauthenticated, 403 wrong role, 404 not found, 409 closed ticket, 429 rate limit, 503 AI unavailable.

## Deployment
- **DB**: MongoDB Atlas. Run `npm run seed` once against the Atlas URI.
- **API** (Render/Railway): root `server`, start `npm start`, set env vars from `.env.example`, `CLIENT_URL` = your frontend URL.
- **Frontend** (Vercel): root `client`, build `npm run build`, set `VITE_API_URL=https://<api-host>/api`, and add a rewrite of all paths to `/index.html` for React Router.

## Known limitations / next steps
- File attachments are UI-only (names stored, files not uploaded).
- Polling instead of SSE/WebSockets; no email notifications.
- No password reset; one shared seed password for demo authors.
- AI jobs run in-process; production would use a queue (BullMQ) with retries and prompt caching, plus an evaluation set for classification accuracy.
- No automated tests yet (next: supertest for RBAC and validation).
