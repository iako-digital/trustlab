# TrustLab (package name: mythbusters-caucasus)

Crowdsourced fact-checking against regional disinformation in Georgia and
Armenia. Trilingual (ka / hy / en): public feed, claim submission, and an
editor dashboard where a human decides everything that gets published.

Stack: **Next.js 15 (App Router, TypeScript)**, **Tailwind CSS**,
**Supabase** (Postgres + Auth + Storage), optional **Gemini** risk signal
(admin-only).

## Architecture in one paragraph

The browser never writes to the database. Public pages read published claims
from `GET /api/claims`; submissions go to `POST /api/claims` (validated,
rate-limited, always created as `pending`). Admins sign in with Supabase Auth;
the role comes from the `admin_users` table. `src/middleware.ts` gates
`/admin/*`, `/api/admin/*` and `/api/analyze` (fail-closed), and each route
handler re-checks with `requireAdmin()`. Admin decisions (publish / reject /
restore) call the SQL function `admin_update_claim`, which changes the claim
and writes the `audit_log` row **in one transaction**. Rejecting never
deletes: the claim gets `state = 'rejected'` plus a mandatory reason.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill it in (see below)
npm run dev                  # http://localhost:3000
```

### 1. Supabase project

1. Create a project at https://supabase.com.
2. SQL editor: run `supabase/migrations/0001_schema.sql`, then
   `0002_admin_claim_actions.sql` (or use the Supabase CLI: `supabase db push`).
3. Authentication → Users → **Add user** (email + password, auto-confirm).
4. Make that user an admin: adapt and run `supabase/create_admin.example.sql`.
5. Project Settings → API: copy the URL, `anon` key and `service_role` key
   into `.env.local`. The service-role key is **server only**; never prefix it
   with `NEXT_PUBLIC_`.

### 2. Optional demo data

```bash
npm run seed -- --yes   # fictional demo claims; NOT for production projects
```

### 3. Gemini (optional)

Set `GEMINI_API_KEY` to enable `POST /api/analyze` (admin-only, rate-limited).
Its output is a risk signal for the editor, never a verdict.

## Scripts

| Script | What |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` | ESLint (flat config, `next/core-web-vitals`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed -- --yes` | load demo claims (needs Node >= 22.18) |

CI (`.github/workflows/ci.yml`) runs install, lint, typecheck and build.

## Known limitations

- The rate limiter (`src/lib/rate-limit.ts`) is in-memory, per server
  instance. Replace with Redis/Upstash before relying on it at scale.
- Evidence file upload and comments have tables + RLS but no UI/API yet.
- Admin sessions use Supabase's cookie session; there is no MFA yet.
- Translations of newly added admin strings (hy/ka) need native-speaker review.

## Project structure

```
messages/                 i18n dictionaries (ka / hy / en)
supabase/migrations/      SQL schema + admin_update_claim function
scripts/seed.mjs          demo data loader
src/
  middleware.ts           server-side gate for admin surface
  app/
    api/claims            public feed + submission
    api/admin/*           admin-only: list, claim actions, whoami
    api/analyze           admin-only Gemini risk signal
    admin, admin/login    editor dashboard + sign-in
    claim/[id], submit, quiz, page.tsx
  lib/
    auth.ts               getAdmin / requireAdmin
    supabase/             browser, server, service-role clients
    validation.ts         server-side input rules (URL allowlist etc.)
    claims-mapper.ts      DB row -> Claim
    rate-limit.ts, admin-api.ts, store.tsx, i18n.tsx, types.ts
  data/claims.ts          demo seed content (used only by scripts/seed.mjs)
```
