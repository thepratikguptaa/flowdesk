# FlowDesk

**Every request. Every action. Every decision. Tracked.**

FlowDesk is the accountable way to run internal operations. Complaints, IT
tickets, HR requests, facilities issues, approvals — the work that usually lives in
scattered inboxes, spreadsheets, and "did anyone action this?" messages — all flow
through one system that knows who owns what, what happens next, and why.

It isn't a to-do list with extra steps. Every case moves through a real **workflow**,
lands with the **right person**, gathers its **discussion and evidence** in one place,
and leaves an **immutable trail** you can stand behind in any review or audit.

---

## Why FlowDesk

Most internal request handling breaks in the same three places. FlowDesk is built
around fixing them.

| The everyday problem | How FlowDesk answers it |
|---|---|
| **"Who's actually handling this?"** | Cases are routed to a department and assigned to a named owner. Assignment moves the workflow forward automatically. |
| **"What's the status — and how did we get here?"** | An explicit status lifecycle plus a per-case timeline: every status change, assignment, comment, and attachment, in order, with who did it. |
| **"Can we prove what happened?"** | An immutable, system-wide audit log records every mutation with field-level before/after values — accountability by default, not by discipline. |

The result is an operational tool that models **how organizations actually process
work**, with the guardrails — roles, permissions, validation, auditability — that
make it safe to trust.

---

## What you can do

- 🎫 **Raise and track cases** — title, description, category, priority, department,
  due date. Reporters follow their own cases end to end; teams see everything in
  their remit.
- 🔀 **Move work through a real workflow** — Submitted → Under Review → Assigned →
  In Progress → Waiting → Resolved → Closed, with Reopen. Only legal transitions are
  offered, and only to people allowed to make them.
- 🎯 **Assign to the right owner** — managers and admins route cases to department
  staff; the first assignment advances the case automatically.
- 💬 **Collaborate in context** — threaded comments and validated file attachments
  (screenshots, evidence) live on the case, not in someone's inbox.
- 🔔 **Stay in the loop** — in-app notifications for assignments, status changes,
  comments, resolutions, and reopens.
- 📊 **See the whole operation** — role-scoped dashboard KPIs (open, overdue,
  resolved, average resolution time), cases by department, and analytics with trend,
  status, priority, and workload charts.
- 🕵️ **Trust every record** — a per-case activity timeline for everyone, and an
  immutable, filterable audit log for admins.
- 👥 **Manage your people** — admins create accounts, set roles and departments,
  reset passwords, and deactivate or reactivate users — with guards that prevent
  locking yourself out.
- ✨ **Summarize in a click** _(optional)_ — an AI-generated, manager-friendly recap
  of a case's full history via Azure OpenAI. Entirely optional; the app runs happily
  without it.

### Built-in roles

FlowDesk ships with four roles, each seeing exactly what it should:

| Role | Sees & does |
|---|---|
| **Citizen** | Raises cases and tracks their own. |
| **Staff** | Works cases assigned to them and within their department. |
| **Manager** | Runs a department — assigns, prioritizes, escalates, sees department analytics. |
| **Admin** | Full visibility; manages users, departments, and configuration. |

Authorization isn't cosmetic: it's enforced on **every** query and mutation, then
mirrored in the UI so people only ever see what they're allowed to act on.

---

## Under the hood

FlowDesk is a modern, type-safe, server-first Next.js application — built to look
like production, not a prototype.

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router, Server Actions, React Server Components) + **React 19** |
| Language | **TypeScript**, end to end |
| Styling | **Tailwind CSS v4** + shadcn/ui (Base UI) |
| Database | **PostgreSQL** (Neon) |
| ORM | **Prisma 6** |
| Auth | **Auth.js v5** (JWT + credentials, bcrypt) |
| Validation | **Zod** |
| Charts | **Recharts** |
| AI | **Azure OpenAI** (optional) |
| Tests | **Vitest** |
| Delivery | **Vercel** + GitHub Actions CI |

### Engineering decisions worth calling out

- **Authorization is centralized and pure.** `lib/auth/rbac.ts` holds capability and
  record-scope logic; `lib/cases/scope.ts` is the single source of truth for who can
  see which cases. Pure functions → trivially unit-tested and reused everywhere
  (server actions, route handlers, UI guards).
- **The workflow is a genuine state machine.** Transitions live as data in
  `lib/cases/workflow.ts`, not as `if`s scattered across the codebase — so they're
  enforceable, testable, and easy to extend.
- **Edge-safe auth split.** `auth.config.ts` (no DB) runs in the edge proxy;
  `auth.ts` (Prisma + bcrypt) runs in Node. Fast gate, full checks.
- **Accountability is structural.** Every mutation writes both a user-facing timeline
  event and an immutable audit-log entry — you can't do the work without leaving the
  record.
- **Attachments are stored deliberately.** File bytes live in a separate table so
  listing case metadata never drags blobs into memory; downloads are authorized and
  `nosniff`-guarded.

```text
src/
  app/
    (auth)/            login & register (split-screen, public)
    (app)/             authenticated shell (fixed sidebar + scrolling content)
      dashboard/  cases/  departments/  analytics/  audit/  users/
    api/
      auth/[...nextauth]/     Auth.js handlers
      attachments/[id]/       secured file download
  components/          layout · cases · departments · analytics · audit · users · auth · ui
  lib/
    auth/       rbac (pure, tested) + session guards
    cases/      workflow state machine, RBAC query scope, stats
    actions/    server actions (cases, workflow, comments, attachments, users, ai, …)
    validation/ Zod schemas
    ai/         Azure OpenAI client
  proxy.ts      edge auth gate (Next 16 "proxy" convention)
prisma/
  schema.prisma  seed.ts
```

---

## Try it in two minutes

**Prerequisites:** Node 22+ and a PostgreSQL database (a free
[Neon](https://neon.tech) project works great).

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env          # then fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET
npx auth secret               # generates AUTH_SECRET (or: openssl rand -base64 32)

# 3. Set up the database
npx prisma migrate deploy     # apply migrations
npm run db:seed               # seed departments + demo users

# 4. Run
npm run dev                   # http://localhost:3000
```

### Sign in instantly

After seeding, use any account below (password `Password123!`). The login screen also
has **one-click demo buttons** — pick a role and you're in.

| Email | Role |
|---|---|
| `admin@flowdesk.dev` | Admin |
| `manager.it@flowdesk.dev` | Manager (IT) |
| `staff.it@flowdesk.dev` | Staff (IT) |
| `citizen@flowdesk.dev` | Citizen |

> Sign in as the **Admin** to see everything — including user management, departments,
> analytics, and the audit log.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Pooled Postgres connection for app runtime (Neon: use the `-pooler` host with `pgbouncer=true`) |
| `DIRECT_URL` | ✅ | Direct connection for Prisma migrations |
| `AUTH_SECRET` | ✅ | Auth.js JWT signing secret |
| `AZURE_OPENAI_ENDPOINT` | optional | Full Azure OpenAI chat/completions URL — enables AI summaries |
| `AZURE_OPENAI_API_KEY` | optional | Azure OpenAI key |

> Prisma reads `.env` (not `.env.local`), so all vars live in a single gitignored `.env`.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Generate Prisma client + production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run db:migrate` | Create/apply a dev migration |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio |

---

## Quality & delivery

- **Tested where it matters.** Vitest unit tests cover the security- and
  correctness-critical pure logic — RBAC capabilities and record scoping, the workflow
  state machine, list-visibility scoping, and case validation (including the
  past-due-date rule). `npm test`.
- **Green before it ships.** GitHub Actions CI (`.github/workflows/ci.yml`) runs
  typecheck → lint → tests → build on every push and PR.
- **One-command deploy.** Import the repo in Vercel, add the environment variables,
  and deploy — the build runs `prisma generate && next build`. Then apply migrations
  against the production DB with `npx prisma migrate deploy` (and optionally
  `npm run db:seed`).

## Security

- Passwords hashed with **bcrypt** (cost 12); credentials validated with **Zod**.
- All routes gated by an edge auth proxy; **server actions re-check authorization
  server-side** — the client is never trusted.
- **Record-level authorization** on every case read and write; SQL injection avoided
  via Prisma's parameterized queries.
- File uploads validated (MIME allowlist + 10 MB cap + filename sanitization);
  downloads require authorization and set `X-Content-Type-Options: nosniff`.
- **Immutable audit log** of every action, for real accountability.
- Deactivated users are blocked at sign-in; admins can't lock themselves out.
- Secrets stay in a gitignored `.env` — never committed.

## Real-world considerations

- **Scalability** — pooled DB connections (Neon pooler), indexed queries, and RSC +
  server actions keep client bundles lean; attachment bytes live in a separate table
  so metadata listings never load them.
- **Serverless database behavior** — Neon auto-suspends its compute after a period of
  inactivity and closes open connections, so the first query after an idle gap can fail
  with _"Server has closed the connection"_ before the compute wakes. Runtime traffic
  goes through Neon's **pooled** endpoint (`DATABASE_URL`, with `pgbouncer=true`) to
  minimize this; migrations use the **direct** endpoint (`DIRECT_URL`).
- **Error handling** — server actions return typed error states; AI and audit failures
  never break the primary flow.
- **Extensibility** — the workflow, RBAC, and notification layers are decoupled, so new
  statuses, roles, or notification triggers are localized changes.

---

Built by **Pratik Gupta** ·
[GitHub](https://github.com/thepratikguptaa) ·
[LinkedIn](https://www.linkedin.com/in/thepratikguptaa/)
