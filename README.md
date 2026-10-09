# MythBusters Caucasus

Crowdsourced fact-checking and myth-busting platform targeting regional
disinformation in Georgia and Armenia. Trilingual (Georgian / Armenian /
English), with a public feed, a claim submission flow, and a protected editor
dashboard.

Built with **Next.js (App Router, TypeScript)**, **Tailwind CSS**, and
shadcn-style UI primitives. The prototype ships with a **mock, client-side data
layer** (in `src/lib/store.tsx`) so it runs on Vercel with zero backend setup.

---

## 1. Run locally (VS Code)

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
# open http://localhost:3000
```

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

Admin panel: go to `/admin` and sign in with the demo password **`caucasus`**.

## 2. Push to GitHub

```bash
git init
git add .
git commit -m "MythBusters Caucasus — MVP prototype"
git branch -M main
git remote add origin https://github.com/<you>/mythbusters-caucasus.git
git push -u origin main
```

## 3. Deploy to Vercel

- Import the GitHub repo at https://vercel.com/new
- Framework preset is auto-detected as **Next.js** — no env vars needed for the
  prototype. Click **Deploy**.

Or from the CLI:

```bash
npm i -g vercel
vercel        # preview
vercel --prod # production
```

---

## Project structure

```
mythbusters-caucasus/
├── messages/                  # i18n dictionaries (ka / hy / en)
│   ├── ka.json
│   ├── hy.json
│   └── en.json
├── src/
│   ├── app/
│   │   ├── layout.tsx         # fonts, providers, navbar, footer
│   │   ├── page.tsx           # homepage / feed
│   │   ├── globals.css
│   │   ├── providers.tsx      # I18nProvider + StoreProvider
│   │   ├── submit/page.tsx    # claim submission
│   │   ├── claim/[id]/page.tsx# claim detail
│   │   └── admin/page.tsx     # protected dashboard
│   ├── components/
│   │   ├── navbar.tsx
│   │   ├── language-switcher.tsx
│   │   ├── verdict-badge.tsx  # signature "stamp" element
│   │   ├── claim-card.tsx
│   │   ├── claim-feed.tsx     # feed + filters + search
│   │   ├── submission-form.tsx
│   │   ├── admin/
│   │   │   ├── admin-dashboard.tsx
│   │   │   ├── editor.tsx     # verify + publish a claim
│   │   │   └── analytics.tsx
│   │   └── ui/                # shadcn-style primitives
│   ├── lib/
│   │   ├── i18n.tsx           # locale context + t()
│   │   ├── store.tsx          # mock data layer (localStorage)
│   │   ├── types.ts
│   │   └── utils.ts
│   └── data/
│       └── claims.ts          # trilingual seed data
├── tailwind.config.ts
└── next.config.mjs
```

## How the pieces work

- **i18n** — Dictionaries live in `messages/*.json`. `I18nProvider` exposes
  `t("some.key", { param })` and a `setLocale`. The navbar switcher persists the
  choice to `localStorage`. Font stacks in `tailwind.config.ts` list Noto
  Georgian → Noto Armenian → Noto Latin, so each script renders in the right
  face automatically.
- **Data** — `StoreProvider` seeds from `src/data/claims.ts`, persists changes
  to `localStorage`, and exposes `addSubmission`, `publishClaim`, `rejectClaim`.
  Public submissions land as `pending`; the editor assigns a verdict, writes the
  trilingual response, adds sources, and publishes.
- **Verdicts** — `fake` / `manipulative` / `true`, plus `pending` for the queue.

## Going to production

Swap the mock store for a real backend without touching the UI:

1. **Supabase** — create `claims` and `submissions` tables mirroring
   `src/lib/types.ts`; replace the bodies of `addSubmission` / `publishClaim` /
   `rejectClaim` with Supabase calls; gate `/admin` with Supabase Auth + RLS.
2. **i18n / SEO** — migrate `messages/*.json` to
   [`next-intl`](https://next-intl.dev) with `[locale]` routes for per-language
   URLs. The dictionary keys already match.
3. **Uploads** — accept real image uploads (Supabase Storage / Vercel Blob)
   instead of image URLs.

The demo admin password is hard-coded in
`src/components/admin/admin-dashboard.tsx` — replace it with real auth before
shipping.
