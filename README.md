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
   `0002_admin_claim_actions.sql`, then `0003_ai_suggestions.sql` (or use the Supabase CLI: `supabase db push`).
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

Set `GEMINI_API_KEY` to enable the AI features. `GEMINI_MODEL` (default
`gemini-flash-latest`) and `GEMINI_TTS_MODEL` (default `gemini-3.8-flash-tts`)
are optional overrides.

- `POST /api/analyze` and the admin AI suggestions: admin-only, rate-limited.
  Output is a proposal for the editor, never a verdict.
- `POST /api/chat` (site chat widget) and `POST /api/tts` (read-aloud fallback
  for Georgian/Armenian): **public**, per-IP rate-limited and length-capped.
  They spend your Gemini quota, so watch usage.

## Admin access

### How to sign in

1. Open **`/admin/login`** (opening `/admin` while signed out redirects there).
2. Enter your email and password (Supabase Auth `signInWithPassword`).
3. You land on **`/admin`**. If the account is not an admin you are signed out
   and see "This account does not have admin access".

Being signed in is not enough: the role comes from the `public.admin_users`
table, checked in middleware and again in every API route.

### Admin URLs

| Path | What |
|---|---|
| `/admin/login` | sign-in (email + password) |
| `/admin` | dashboard: Queue (with AI suggestions), Published, Rejected, Analytics |
| `GET /api/admin/me` | who am I (used by login) |
| `GET /api/admin/claims` | all claims, every state |
| `POST /api/admin/claims/[id]` | `publish` / `reject` / `restore` |
| `POST /api/admin/claims/[id]/suggest` | ask the AI for a suggestion |
| `GET /api/admin/suggestions` | open AI suggestions |
| `POST /api/admin/suggestions/[id]` | `approve` / `edit` / `reject` a suggestion |
| `POST /api/analyze` | Gemini risk signal |

Every action above is written to `public.audit_log`.

### Creating an admin

1. Supabase dashboard → Authentication → Users → **Add user** (email + password, auto-confirm).
2. Run `supabase/create_admin.example.sql` with that email.

Revoke access with `delete from public.admin_users where email = '...';`.

## Scripts

| Script | What |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` | ESLint (flat config, `next/core-web-vitals`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed -- --yes` | load demo claims (needs Node >= 22.18) |
| `npm run pack:extension` | rebuild `public/trustlab-extension.zip` from `extension/` |

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
