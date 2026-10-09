# TrustLab — პროექტის აუდიტი

> თარიღი: 2026-10-10 · სფერო: `D:\trustlub-girls-main` (`node_modules`-ის გარეშე) · კოდი არ შეცვლილა, შეიქმნა მხოლოდ ეს ფაილი.
> ხაზების ნომრები მიუთითებს მიმდინარე მდგომარეობას. **შეზღუდვა:** `design/stitch-export`-ის HTML ფაილები გავიარე grep/ტექსტის ამოღებით და `DESIGN.md`-ის თავით; `screen.png` სურათები არ გამიხსნია, ამიტომ ვიზუალური დეტალები (spacing, ფერები) არ არის შემოწმებული. აპლიკაცია არ გამიშვია (`npm run dev/build` არ გაგვიტარებია), ამიტომ ბილდის/ლინტის სტატუსი უცნობია.

---

## 1. ინვენტარი

### სტრუქტურა

```
.
├── design/stitch-export/      # 12 ეკრანი (code.html + screen.png) + trustlab_evidence_system/DESIGN.md
├── messages/{en,hy,ka}.json   # 161 key თითოეულში
├── public/                    # quiz-photo-a.jpg, quiz-photo-b.jpg, .gitkeep
├── src/
│   ├── app/                   # layout, page (feed), submit, quiz, claim/[id], admin, api/analyze
│   ├── components/            # navbar, feed, claim-card, submission-form, quiz-app, bot-section,
│   │                          # extension-section, admin/{dashboard,editor,analytics}, ui/*
│   ├── data/claims.ts         # trilingual seed (185 ხაზი)
│   └── lib/                   # i18n.tsx, store.tsx (mock DB), types.ts, quiz-data.ts, utils.ts
├── package.json, next.config.mjs, tailwind.config.ts, tsconfig.json, postcss.config.mjs
└── README.md, .gitignore
```

### ტექნოლოგიები

| სფერო | რა გამოიყენება | შენიშვნა |
|---|---|---|
| Framework | Next.js `^15.5.22` (App Router), React `19.0.0`, TypeScript 5 | `package.json` |
| Styling | Tailwind 3.4, `class-variance-authority`, `tailwind-merge`, `lucide-react` | shadcn-სტილის primitives `src/components/ui/` |
| i18n | საკუთარი `I18nProvider` (`src/lib/i18n.tsx`), `messages/*.json` | `next-intl` არ არის; URL-ში ლოკალი არ არის |
| **DB** | **არ არის.** `localStorage` (`mbc.claims.v1`) — `src/lib/store.tsx:21,57,68` | მხოლოდ ბრაუზერში, თითო მომხმარებელს საკუთარი |
| **Auth** | **არ არის.** hard-coded პაროლი კლიენტში — `admin-dashboard.tsx:15` | იხ. §4 |
| Server | ერთადერთი route: `POST /api/analyze` (Gemini `gemini-2.5-flash`) | `src/app/api/analyze/route.ts` |
| Hosting | README: Vercel; `vercel.json`/CI არ არის | |
| Build/CI | `next build`, `next lint`; `.github/` არ არსებობს; ტესტების framework-ი არ არის | `eslint` არც devDependencies-შია |
| ფონტები | Google Fonts `<link>` `layout.tsx:21-26` | გარე მოთხოვნა ყოველ ჩატვირთვაზე |

### არსებობს თუ არა რეალური აპლიკაციის კოდი?

**ნაწილობრივ — არის მუშა UI პროტოტიპი, მაგრამ არა რეალური პროდუქტი.**
- ✅ `src/`-ში არის სრულფასოვანი Next.js აპი: feed, claim detail, submit, quiz, admin (queue / published / analytics), 3 ენა.
- ❌ ის **არ არის დაკავშირებული `design/stitch-export`-თან**: აპი იყენებს საკუთარ პალიტრას (`ink / paper / brand`, `tailwind.config.ts:13-34`), ხოლო დიზაინი — Material-სტილის `surface / primary #004269 / on-surface…` ტოკენებს (`DESIGN.md`). დიზაინის HTML არსად არ არის იმპორტირებული; ეს ცალკე, Tailwind-CDN-ზე დაფუძნებული მოკაპები.
- ❌ **არ არის backend**: მონაცემები ცოცხლობს მომხმარებლის ბრაუზერში. მომხმარებლის გაგზავნილი claim **ადმინს არასოდეს მიაღწევს** (სხვა მოწყობილობა/ბრაუზერი = სხვა localStorage).
- 🟡 `/api/analyze` დაწერილია და ვალიდაციაც აქვს, მაგრამ **კლიენტიდან არსად გამოიძახება** (`grep "api/analyze"` src/components-ში — 0 შედეგი). ე.ი. AI-ს ფუნქცია არსებობს, UI-ში არ ჩანს.
- ❌ პროექტის სახელი არათანმიმდევრულია: `package.json` → `mythbusters-caucasus`, README → "MythBusters Caucasus", UI/layout/დიზაინი → "TrustLab". localStorage გასაღებებიც `mbc.*`.
- ℹ️ `git` რეპოზიტორია `d:\trustlub-girls-main`-ში არ ჩანს (Claude-ის გარემოც ამას აღნიშნავს); ვერსიების ისტორია არ გვაქვს.

---

## 2. დიზაინის ეკრანები

**ლეგენდა:** ✅ მზადაა · 🟡 ნაწილობრივ · ❌ არ არსებობს. „Light/Dark" სვეტი ეხება **დიზაინის ექსპორტს**; „აპი" სვეტი — რეალურ `src/`-ს (აპს dark mode საერთოდ არ აქვს: `tailwind.config.ts` და `globals.css`-ში `dark`-ის ხსენება არ არის).

| # | ეკრანი | რას აკეთებს (დიზაინში) | რეალური კოდი / route | რა მონაცემი და API სჭირდება | სტატუსი | Light / Dark დიზაინში |
|---|---|---|---|---|---|---|
| 1 | **admin_login** | Admin Portal-ის შესვლა, „Forgot password?" | `/admin` → `Login()` `admin-dashboard.tsx:112-154` | email+password (ან OAuth), სესია, rate-limit, password reset | 🟡 UI არის, **auth ყალბია** (hard-coded პაროლი). Forgot-password არ არსებობს | მხოლოდ light — **dark აკლია** |
| 2 | **admin_queue** | Verification Queue: ფილტრები, claim-ები 3 ენაზე, PUBLISH / DISMISS | `/admin` tab „pending" + `editor.tsx` | `GET /claims?status=pending`, `PATCH /claims/:id`, filter by lang/category, audit log | 🟡 queue + publish + reject არის (localStorage); ფილტრები, სორტირება, დუბლიკატების ნიშანი არ არის; „Dismiss" = **სამუდამო წაშლა** (`store.tsx:117`) | მხოლოდ light — **dark აკლია** |
| 3 | **admin_comments** | Comment Moderation: სტატუსის/ენის ფილტრი, Hide / Delete | — | `comments` ცხრილი, `GET/PATCH/DELETE`, მომხმარებლის ავტორიზაცია, მოდერაციის სტატუსი | ❌ კომენტარების ფუნქცია სრულიად არ არსებობს (არც ტიპი `types.ts`-ში) | მხოლოდ light — **dark აკლია** |
| 4 | **admin_analytics** | Platform Analytics: By Verdict, Source Language | `/admin` tab „analytics" `analytics.tsx` (87 ხაზი) | აგრეგაცია DB-დან; დროითი სერიები, ტრაფიკი | 🟡 მარტივი დათვლა `claims`-ის მასივზე (მხოლოდ ლოკალურ მონაცემებზე); ტრაფიკის/დროის გრაფიკი არ არის | მხოლოდ **dark** — **light აკლია** |
| 5 | **claim_detail** | Verdict, claim, Investigation Summary, Supporting Evidence (reverse image, EXIF), Reveal Evidence (sensitive), Share, Discussion | `/claim/[id]` `claim/[id]/page.tsx` | claim + `evidence[]` (ტიპი, ფაილი/არქივის ლინკი, metadata), `comments`, share links | 🟡 claim, verdict, explanation, sources არის. **აკლია:** Evidence ბარათები, sensitive-content blur/reveal, share, discussion, download report | light ✅ + dark ✅ (ორივე არის) |
| 6 | **homepage_feed** | Evidence Desk feed, verdict ფილტრი, Quiz banner, Browser Extension, Fact-Check Bot | `/` `page.tsx` + `claim-feed.tsx`, `quiz-banner`, `extension-section`, `bot-section` | published claims (pagination), search | 🟡 feed/ფილტრი/ძებნა მუშაობს seed-ზე. Extension და Bot **მხოლოდ მარკეტინგული ბარათებია** (მოდალი, რეალური ლინკი/ბოტი არ არის; `bot.handle` placeholder) | light ✅ + dark ✅ |
| 7 | **quiz_question** | ფოტოს/დებულების შეკითხვა, პასუხი + ახსნა | `/quiz` `quiz-app.tsx` (340 ხაზი) | შეკითხვები DB-დან, სწორი პასუხი სერვერზე | 🟡 მუშაობს, 3 hard-coded შეკითხვით (`quiz-data.ts`); სურათები `public/quiz-photo-*.jpg` (ლოკალური) | მხოლოდ light — **dark აკლია** |
| 8 | **quiz_result** | ქულა (დიზაინში 8/10), დონე, Time, Review Answers | `quiz-app.tsx` result phase | შედეგის შენახვა (არასავალდებულო), leaderboard? | 🟡 ქულა + gold/silver/bronze badge არის. **აკლია:** დრო, Review Answers, share | მხოლოდ **dark** — **light აკლია** |
| 9 | **submit_a_claim** | Evidence type (Link/Text/Image), URL, აღწერა, ენა, კატეგორია, success: Claim ID + timestamp + status | `/submit` `submission-form.tsx` | `POST /api/claims` (+ file upload), server-generated ID, rate-limit/captcha | 🟡 ფორმა + ვალიდაცია არის, ბოლოში `localStorage`. **Image = მხოლოდ URL, ფაილის ატვირთვა არ არის**; success-ეკრანზე ID/timestamp/ტრეკინგი არ არის; კატეგორიები სხვაა (დიზაინი: Political/Visual Media/Statistical/Other; კოდი: peace/media/history/society) | მხოლოდ light — **dark აკლია** |
| 10 | **telegram_mini_app** | Telegram-ში: URL/image შეყვანა → „Analyzing" → „High Risk Detected / FAKE", „Checked against 14 sources", Full Report | — (არც Telegram SDK, არც `/tma` route). უახლოესი: `/api/analyze` (backend-ი) | Telegram `initData` ვალიდაცია სერვერზე, `/api/analyze`, ნახვის ისტორია, webhook ბოტისთვის | ❌ UI არ არის; `/api/analyze` მზადაა, მაგრამ „14 sources" ტიპის წყაროების შედარება **არ არის** (მოდელი მხოლოდ ტექსტს აფასებს) | მხოლოდ **dark** — **light აკლია** (TMA-ს theme Telegram-იდან უნდა მოდიოდეს) |
| 11 | **trustlab_evidence_system** | `DESIGN.md` — design-system ტოკენები (ფერები, ტიპოგრაფია) | ✅ ნაწილობრივ ასახულია `tailwind.config.ts`-ში, **ტოკენები არ ემთხვევა** | — | 🟡 არ არის ერთიანი ტოკენ-წყარო | n/a |

**ეკრანების ჯამი:** 12 ფაილი = 10 უნიკალური ეკრანი + 1 design system. Light/dark წყვილი მხოლოდ **2**-ს აქვს (claim_detail, homepage_feed). **8 ეკრანი** ერთ რეჟიმშია: light-only — login, queue, comments, quiz_question, submit; dark-only — analytics, quiz_result, telegram_mini_app.

---

## 3. თარგმანები (`messages/en.json`, `hy.json`, `ka.json`)

ავტომატური შედარება (flatten → დათვლა):

| მეტრიკა | შედეგი |
|---|---|
| key-ების რაოდენობა | en **161** · hy **161** · ka **161** |
| დაკარგული key-ები ერთმანეთთან შედარებით | **0** ყველა მიმართულებით |
| ცარიელი მნიშვნელობები | **0** |
| `{param}` placeholder-ების შეუსაბამობა | **0** |
| კოდში გამოყენებული, მაგრამ ლექსიკონში არარსებული key | **0** (სტატიკური `t("…")` ზარებისთვის) |
| ინგლისურად დარჩენილი ტექსტი hy/ka-ში | **3 key — ყველა გამართლებულია:** `app.name`, `common.language.en`, `bot.handle` (საკუთარი სახელები/ენის სახელი) |

**დასკვნა:** JSON ფაილები სუფთაა. რეალური პრობლემები სხვაგანაა:

1. **შერეული ანბანი seed-ის მონაცემებში** (ლათინური ასოები ქართულ/სომხურ სიტყვებში) — `src/data/claims.ts`:
   - `:21` `გადაღebული` (ქართ. + ლათ. „eb") → `გადაღებული`
   - `:51` `მცdარია` → `მცდარია`
   - `:69, :74, :79` `անվճar` → `անվճար` (3-ჯერ)
   - `:104` `შექმნili` → `შექმნილი`
   - ეს გამოიყურება როგორც ავტო-თარგმანის/კოპირების შეცდომა — **ზუსტად ის კლასის ხარვეზი, რასაც AI-თარგმანის human review უნდა იჭერდეს** (იხ. §5).
2. **`addSubmission` ერთსა და იმავე ტექსტს წერს სამივე ენაში** (`store.tsx:74-93`): მომხმარებლის ქართულად გაგზავნილი claim hy/en ინტერფეისზე ქართულად გამოჩნდება, თარგმანის სტატუსის გარეშე. `Localized`-ს არ აქვს „თარგმნილია / არა" ინდიკატორი.
3. **51 key ლექსიკონშია, მაგრამ პირდაპირი `"key"` სახით კოდში არ ჩანს** (მაგ. `status.*`, `category.*`, `quiz.q1…q3*`, `quiz.badge*`, `extension.feature1-3*`, `bot.step1-3*`, `nav.admin`, `app.tagline`, `detail.verdict`, `detail.references`, `admin.submittedContent`, `admin.titlePlaceholder`). უმეტესობა დინამიკურად გამოიყენება (`t(\`status.${s}\`)`, `t(\`bot.${key}Title\`)`) — ე.ი. ცრუ განგაშია — მაგრამ **სავარაუდოდ მკვდარია:** `nav.admin`, `nav.language`, `app.tagline`, `detail.verdict`, `detail.references`, `admin.submittedContent`, `admin.titlePlaceholder`. ვერიფიკაცია საჭიროა.
4. **ფორმატირება:** `hy.json:95` — `URL՝` (სომხური ორწერტილი) — ნორმალურია, უბრალოდ ლათინური ნაწილი.
5. **სიღრმე:** თარგმანის *ხარისხი* (ბუნებრიობა, ტერმინოლოგია) არ შემიფასებია; მეშვეობით შემოწმდა მხოლოდ სტრუქტურა და ანბანის სისუფთავე. რეკომენდაცია: მშობლიური მატარებლის რევიუ hy-სთვის განსაკუთრებით.
6. **hard-coded სტრიქონები კომპონენტებში** (არა ლექსიკონში): footer `"TrustLab · Prototype"`, `"Crowdsourced fact-checking · ka · hy · en"` (`layout.tsx:25-31`), `aria-label="Close"` (`modal.tsx:53`), `layout.tsx` metadata მხოლოდ ინგლისურად (`:7-10`) — SEO/ენის თვალსაზრისით.
7. **ენის არჩევანი URL-ში არ არის** (`localStorage`-ზეა, default `ka`, `i18n.tsx:51,61`): `<html lang="ka">` სერვერზე ყოველთვის `ka`-ა (`layout.tsx:23`), ინგლისურ/სომხურ მკითხველს SSR-ში არასწორი lang და კონტენტი ჩაუვარდება → SEO და screen-reader პრობლემა, hydration flicker.

---

## 4. ხარისხი და რისკები

სიმძიმე: 🔴 კრიტიკული · 🟠 მაღალი · 🟡 საშუალო · ⚪ დაბალი

### 4.1 უსაფრთხოება

| # | სიმძიმე | მიგნება | ადგილი |
|---|---|---|---|
| S1 | 🔴 | **Admin auth სრულიად ყალბია.** პაროლი `"caucasus"` JS bundle-შია; ნებისმიერს შეუძლია წაიკითხოს. | `admin-dashboard.tsx:15, 118` |
| S2 | 🔴 | **Auth state = `sessionStorage["mbc.admin.auth"]="1"`** — კონსოლში ერთი ხაზით გვერდს უვლის. სერვერული შემოწმება არ არის, `middleware.ts` არ არსებობს. | `admin-dashboard.tsx:16, 28, 119` |
| S3 | 🔴 | **პაროლის მინიშნება UI-შია ყველა ენაზე:** „Demo password: caucasus". | `messages/{en,hy,ka}.json:85`, `admin-dashboard.tsx:150` |
| S4 | 🔴 | **ადმინ-მოქმედებები (publish/reject) არავალიდირებულია სერვერზე**, რადგან სერვერი არ არსებობს. production-ზე გადასვლისას ეს უნდა გადაიწეროს, არა „ჩანაცვლდეს". | `store.tsx:95-125` |
| S5 | 🟠 | **`/api/analyze` — ღია, ავთენტიკაციის/ლიმიტის გარეშე.** ნებისმიერს შეუძლია უსასრულოდ გამოიძახოს და **თქვენი Gemini კვოტა/ბიუჯეტი გახარჯოს**. IP rate-limit, captcha ან auth საჭიროა. (`MAX_INPUT_LENGTH=6000` არის, ეს კარგია.) | `api/analyze/route.ts:74-160` |
| S6 | 🟠 | **Prompt injection:** მომხმარებლის ტექსტი პირდაპირ `contents`-ში მიდის (`:105-108`); „იგნორირება გაუკეთე ინსტრუქციებს…" — `riskScore` შეიძლება მანიპულირდეს. რადგან შედეგი ადამიანის დასკვნა არ არის, ის **არასოდეს უნდა გამოქვეყნდეს ავტომატურად** (იხ. §5). | `route.ts:105-112` |
| S7 | 🟠 | **Unvalidated `sourceUrl` / `sources[]` → `<a href>`:** schema არ მოწმდება (`javascript:`, `data:` ან phishing URL). React 19 `javascript:` URL-ებს ბლოკავს, მაგრამ allowlist (`https?:` მხოლოდ) მაინც საჭიროა. `rel="noreferrer"` არის, ესეც კარგია. | `claim/[id]/page.tsx:67-77, 103-110`, `editor.tsx:62-71`, `submission-form.tsx:200-215` |
| S8 | 🟠 | **Evidence ატვირთვა არ არსებობს**; როცა დაემატება: MIME/ზომის ლიმიტი, მავნე ფაილები (SVG/PDF), EXIF-ში პირადი მონაცემები (GPS), ვირუსსკანირება, წაკითხვა მხოლოდ signed URL-ით, **sensitive content-ის blur** (დიზაინში არის „Reveal Evidence"). `next.config.mjs`: `remotePatterns: [{hostname: "**"}]` — **ნებისმიერი HTTPS ჰოსტის** სურათების ოპტიმიზაცია (SSRF-ს/ბიუჯეტის რისკი, თუ `next/image` გამოვიყენეთ). | `next.config.mjs:4` |
| S9 | 🟠 | **Spam/abuse submit-ზე:** captcha, honeypot, rate-limit არ არის. `newId()` = `Math.random()` (`utils.ts:25-27`) — არაუნიკალური/გამოსაცნობი ID (production-ში UUID/DB-ის ID). | `submission-form.tsx`, `utils.ts:26` |
| S10 | 🟡 | **შეყვანის ვალიდაცია:** სიგრძის ლიმიტი ფორმაში არ არის (title/content/notes); `url` — უბრალოდ `trim()`, ფორმატი არ მოწმდება (`:136-141, :212`). `notes` ველი **საერთოდ არ ინახება** — `addSubmission` მას არ იღებს `Claim`-ში (`store.tsx:74-93`, `NewSubmission.notes` იგნორირებულია). | `submission-form.tsx:206-216`, `store.tsx:25-33, 79-91` |
| S11 | 🟡 | **Security headers**: CSP, `X-Frame-Options`, `Referrer-Policy` — `next.config.mjs`-ში არ არის. | `next.config.mjs` |
| S12 | 🟡 | **Secrets:** კოდში API გასაღები არ არის (`GEMINI_API_KEY` — env, ✅). `.gitignore` `.env*`-ს აიგნორებს ✅. მაგრამ `.env.example` და env-ის დოკუმენტაცია README-ში არ არის (`GEMINI_API_KEY`/`GEMINI_MODEL` README-ში არ იხსენიება). | `route.ts:3,75`, `README.md` |
| S13 | ⚪ | Gemini-ს შეცდომის სტატუსი ლოგ-ში არ იწერება (მხოლოდ კლიენტს ეგზავნება), დიაგნოსტიკა რთულია. | `route.ts:119-125` |

### 4.2 პერსონალური მონაცემები / კონფიდენციალურობა

- **P1 🟠** პროდუქტი **გამოაქვეყნებს ადამიანების ვიდეო/ფოტოს** და კომენტარებს (დიზაინში: ავტორის სახელები, timestamp-ები, EXIF). საჭიროა: კონფიდენციალურობის პოლიტიკა, საიტზე თანხმობა, წაშლის მოთხოვნის პროცესი, ბავშვებისა/სახეების blur-ის წესი, ანონიმური გაგზავნის არჩევანი. სადმე ამის ტექსტი/გვერდი არ არსებობს.
- **P2 🟠** **მესამე მხარეს გადაცემა:** `/api/analyze` გადასცემს მომხმარებლის ტექსტს Google-ს; ეს უნდა იყოს გამჟღავნებული (privacy notice) და — AI აგენტების შემთხვევაში — PII-ს მოცილება/მინიმიზაცია გაგზავნამდე.
- **P3 🟡** Google Fonts CDN (`layout.tsx:21-26`) — IP-ის გადაცემა Google-ისთვის (GDPR-ის კონტექსტი). გამოსავალი: `next/font` self-hosting.
- **P4 🟡** `localStorage`-ში claims და ენა — პირადი მონაცემი არ არის, მაგრამ ტრეკინგის/ანალიტიკის დამატებისას cookie-თანხმობა დაგჭირდებათ.
- **P5 🟡** ადმინის `verifiedBy` hard-coded „You" (`messages/*:103`, `editor.tsx:44`) — რეალური ავტორობა/ანგარიშვალდებულება არ ფიქსირდება; ეს ამავდროულად ორგანიზაციული რისკია (ვინ გამოაქვეყნა verdict?).

### 4.3 Accessibility

- **A1 🟠** `layout.tsx`: **`<html lang="ka">` ფიქსირებულია** სერვერზე (`:23`); კლიენტში იცვლება `useEffect`-ით (`i18n.tsx:65-67`) — screen reader-ისთვის პირველ რენდერზე არასწორი ენა.
- **A2 🟡** **Skip-to-content ბმული არ არის**; `<main>` არის ✅ (`layout.tsx:35`).
- **A3 🟡** Admin tab-ები — `<button>` ბარათი **`role="tablist/tab"`, `aria-selected`-ის გარეშე** (`admin-dashboard.tsx:64-82`). Verdict-ის არჩევა `aria-pressed`-ის გარეშე (`editor.tsx:80-93`) — submit-ფორმას კი აქვს (`submission-form.tsx:92`).
- **A4 🟡** Modal: `aria-modal`, `aria-label` არის ✅ (`modal.tsx:44-45`) — მაგრამ **focus trap / ESC / focus return** დასადასტურებელია; `aria-label="Close"` ინგლისურადაა (`:53`).
- **A5 🟡** **ფერისგან დამოუკიდებლობა:** verdict ბეჯი ტექსტითაც არის (✅ `verdict-badge.tsx`), მაგრამ დადასტურებული კონტრასტი არ გვაქვს. `text-ink-faint` + `text-[11px]` mono ტექსტი ბევრგან — სავარაუდო კონტრასტის პრობლემა.
- **A6 🟡** ძალიან პატარა ტექსტი: `text-[10px]`/`text-[11px]` ბევრგან (`admin-dashboard.tsx:77`, `claim/[id]/page.tsx:42,128`, `footer`).
- **A7 ⚪** Quiz სურათებზე `alt` არის ✅ (`quiz-app.tsx:316`), მაგრამ ორივე სურათის alt „Photo A/B" ტიპისაა — „გამოიცანი AI" ამოცანისთვის ეს მისაღებია, შედეგის ეკრანზე კი ახსნა უნდა იყოს.
- **A8 ⚪** Dark mode არ არის → `prefers-color-scheme`, `prefers-reduced-motion` არ არის გათვალისწინებული; `hover:-translate-y-*` ანიმაციები ყველგან (`admin-dashboard.tsx:128`, `submission-form.tsx:245` და სხვ.).

### 4.4 Mobile / responsive

- ✅ Tailwind responsive კლასები გამოიყენება (`sm:`, `lg:` — grid-ები).
- **M1 🟠** `layout.tsx`-ში **`viewport` meta/export არ არის** — Next.js ამატებს default-ს, ამიტომ ეს სავარაუდოდ OK, მაგრამ `themeColor`/`viewport-fit` Telegram Mini App-ისთვის დაგჭირდებათ.
- **M2 🟡** Navbar: „Feed" ბმული `hidden … sm:inline-block` (`navbar.tsx:26`) — მობილურზე მთავარზე დაბრუნება მხოლოდ ლოგოთი.
- **M3 🟡** Admin `lg:grid-cols-2` + 6 textarea თითო ბარათში (`editor.tsx:99-125`): მობილურზე ძალიან გრძელი ფორმა; დიზაინის queue-ის ბარათი უფრო კომპაქტურია (inline PUBLISH/DISMISS).
- **M4 🟡** რეალური მოწყობილობებზე (iOS Safari, Android Chrome, Telegram in-app WebView) არ გატესტილა — ამას ჩემი აუდიტი ვერ ამოწმებს.

### 4.5 Telegram Mini App ინტეგრაცია

- ❌ `telegram-web-app.js` / `@telegram-apps/sdk` / `window.Telegram.WebApp` — **არსად არის**. `grep "WebApp|initData"` — 0.
- ❌ `initData` HMAC ვალიდაცია სერვერზე — არ არის (ეს აუცილებელია, სხვაგვარად `user.id` გაყალბებადია).
- ❌ ბოტი არ არსებობს: `bot.handle` — placeholder (`messages/*:bot.handle`); WhatsApp/Telegram ღილაკები მხოლოდ მოდალს ხსნიან (`bot-section.tsx:18, 77-80`).
- ❌ Telegram theme (`themeParams`), `MainButton`, `BackButton`, `viewport` ინტეგრაცია — დიზაინში dark-ია, მაგრამ აპს dark/theming არ აქვს.
- 🟡 `/api/analyze` — კარგი საფუძველია (JSON schema, ხანგრძლივობა), მაგრამ Mini App-ისთვის საჭიროა async job (Gemini შეიძლება >10s), კეშირება ერთნაირი URL-ზე და „14 sources"-ის რეალური წყარო (ამჟამად მოდელი **არ ამოწმებს ინტერნეტს**, მხოლოდ ტექსტს აფასებს — ეს UI-ზე მცდარ ნდობას შექმნის, თუ „Checked against N sources" ჩაიწერა).

### 4.6 ტესტები

- ❌ **0 ტესტი.** `jest/vitest/playwright` — `package.json`-ში არ არის; `test` script — არ არის.
- ❌ `eslint` და `eslint-config-next` devDependencies-ში **არ არის**, თუმცა `npm run lint` სკრიპტი არსებობს (`next lint` გააკეთებს ინტერაქტიულ setup-ს / ჩავარდება). `next lint` Next 15.5-ში deprecated-ია.
- 💡 მინიმუმ საჭიროა: `route.ts`-ის `isAnalyzeResult`-ის unit ტესტი, i18n key-parity ტესტი (ეს აუდიტის ჩემი სკრიპტი მზა საფუძველია), submit→admin flow-ის e2e.

### 4.7 CI / Deploy

- ❌ `.github/workflows` არ არის, `vercel.json` არ არის, preview/prod გარემოს სეპარაცია არ არის.
- ❌ `GEMINI_API_KEY` Vercel-ში დასაყენებელია (README „no env vars needed" — **ეს ახლა უკვე არასწორია**, რადგან `/api/analyze` მას საჭიროებს, `README.md` „Deploy to Vercel").
- ❌ მონიტორინგი/ერორ-ტრეკინგი (Sentry), uptime, ლოგირება არ არის.
- ⚠️ `package.json` `"react": "19.0.0"` — ზუსტი ვერსია, მაშინ როცა `next` `^15.5.x`; დაიცავით peer-compat პერიოდული განახლებით.

### 4.8 სხვა კოდის ხარისხი

- **Q1 🟠** **`rejectClaim` = ფიზიკური წაშლა** (`store.tsx:117-121`, `filter`). არც soft-delete, არც ისტორია, არც undo. AI-ის და ადმინების workflow-სთვის აუცილებელია `status: "rejected"` + მიზეზი + audit.
- **Q2 🟠** **Stale-closure რისკი:** `addSubmission/publishClaim/rejectClaim` ყველა `claims`-ზეა დამოკიდებული და `persist`-ს სრულ მასივს აწვდის (`store.tsx:74-125`) — ორ ტაბში `localStorage`-ის ერთმანეთზე გადაწერა (last-write-wins), `storage` event-ის მოსმენა არ არის.
- **Q3 🟡** `ClaimEditor`-ში `explanation` ცარიელი ენების დაპუბლიკება შესაძლებელია (`editor.tsx:36-46`: `ka/hy/en` ცარიელი სტრიქონი დაიშვება) → ბეჯი verdict-ით და ცარიელი ახსნა ცოცხალ საიტზე. მხოლოდ `status` მოწმდება.
- **Q4 🟡** `claim.claim[locale]`/`explanation[locale]` — თუ ენა ცარიელია, fallback არ არის (`claim/[id]/page.tsx:85`, `.split` ცარიელზე → ცარიელი გვერდი).
- **Q5 🟡** Hydration: ✅ მოფიქრებულია (`utils.ts` კომენტარი), მაგრამ `StoreProvider` seed-დან localStorage-ზე გადასვლისას ერთი რენდერი „flicker"-ს იძლევა (`ready` flag არის ✅).
- **Q6 ⚪** `claim-feed` ფილტრაცია კლიენტზე; 1000+ claim-ზე pagination არ არის.

---

## 5. AI აგენტები — human-in-the-loop არქიტექტურა

### 5.1 პრინციპები

1. **აგენტი მხოლოდ ამზადებს `suggestion`-ს.** ის წერს ცალკე ცხრილში `ai_suggestions`, **არასოდეს `claims`-ში** (გამოქვეყნებად ველებში). გამოქვეყნებად ობიექტზე ცვლილება შეუძლია მხოლოდ ადმინის API-ს.
2. **ერთი ჩანაწერი — ერთი გადაწყვეტილება.** ყოველი suggestion გადის: `proposed → (approved | edited | rejected)`. `expired` — თუ ვერავინ განიხილა N დღეში (არა ავტო-დამტკიცება).
3. **ორმაგი ცალკე-ფენა:** AI-სთვის დაშვებული DB როლი წერს მხოლოდ `ai_suggestions`, `ai_runs`; `claims.status/verdict/published_at` — მხოლოდ ადმინის სესიით.
4. **სიგნალი ადმინისთვის:** ყოველი AI-ველი UI-ში აღნიშნულია „🤖 AI-ის შემოთავაზება · მოდელი · ნდობა · წყაროები" და ვიზუალურად განსხვავებულია საბოლოო ტექსტისგან.
5. **ხარჯი/უსაფრთხოება:** ყველა agent run — queue-ით (ერთ claim-ზე max N გაშვება), rate-limit, ბიუჯეტის ლიმიტი, PII-ს მოცილება გაგზავნამდე, prompt-injection-ის წინააღმდეგ: მომხმარებლის ტექსტი ყოველთვის `data`-დელიმიტერშია, სისტემური ინსტრუქციის გარეთ.

**საერთო მონაცემთა მოდელი (მინიმალური):**

```
ai_suggestions(id, claim_id, agent, input_hash, output_json, model, prompt_version,
               confidence, status[proposed|approved|edited|rejected|expired], created_at)
ai_decisions(id, suggestion_id, admin_id, action[approve|edit|reject], final_json,
             reason, decided_at)
audit_log(id, ts, actor_type[admin|agent|user|system], actor_id, action, entity, entity_id, before, after)
```

### 5.2 აგენტები

#### A) Claim Triage

| | |
|---|---|
| **Input** | ახლად გაგზავნილი claim: `title`, `claim`, `sourceUrl`, `sourceLang`, ტიპი; არსებული published claims-ის embeddings (დუბლიკატებისთვის). |
| **Output** | `{ category, priority: low/med/high + მიზეზი, duplicates: [{claimId, similarity, reason}], language_detected, needs_evidence: bool }` |
| **UI** | `admin_queue` ეკრანი (დიზაინი #2): თითო queue-ბარათზე 🤖 ზოლი: კატეგორია-chip, priority-ბეჯი, „მსგავსია: #c_border_video (92%)". Queue იხარისხება priority-ით. |
| **ადმინის ღილაკები** | **Approve** (კატეგორია/პრიორიტეტის მიღება) · **Edit** (dropdown-ით შეცვლა) · **Reject** („არასწორია"; ფიქსირდება როგორც AI-ს შეცდომა) · **Mark duplicate** (აკავშირებს არსებულ claim-თან — ადმინის ცალკე ღილაკი, არა AI-ის) |
| **Audit log** | agent run (მოდელი, prompt_version, input_hash) · AI-ის შემოთავაზება (JSON) · ადმინი (ვინ) + დრო · საბოლოო მნიშვნელობა · განსხვავება (`diff`) · თუ Edit/Reject — მიზეზი (არასავალდებულო) |
| **არასოდეს ავტომატურად** | claim-ის წაშლა/უარყოფა „დუბლიკატად" · გამოქვეყნება · verdict · გაგზავნის ავტორისთვის შეტყობინება |

#### B) Evidence Check

| | |
|---|---|
| **Input** | `sourceUrl`, მიმაგრებული ფაილები (სურათი/ვიდეო/PDF), ადმინის მიერ დამატებული `sources[]`. |
| **Output** | `{ checks: [{type: reverse_image|exif|url_reputation|archive_lookup|quote_match, result, evidence_link, confidence}], red_flags: [...], summary }` — **ფაქტობრივი შედეგი + ბმული**, არა „ვერდიქტი". |
| **UI** | `claim_detail`-ის ადმინ-ვერსია + queue-ის ბარათის „Evidence" ტაბი (დიზაინი #5 „Supporting Evidence" ბლოკის წყარო). თითო check — ბარათი „გახსენი წყარო ↗". |
| **ღილაკები** | **Approve** (check ემატება claim-ის Evidence-ში) · **Edit** (ტექსტის/ბმულის შეცვლა) · **Reject** (არ ჩაითვალოს) · **Re-run** |
| **Audit log** | ვინ დაამტკიცა თითო check-ი, რა იყო AI-ის ნედლი შედეგი და საბოლოო ტექსტი; გამოყენებული გარე სერვისი/ვერსია; ფაილის hash-ი (ცვლილების ამოსაცნობად) |
| **არასოდეს ავტომატურად** | ფაილის შეცვლა/წაშლა · ბმულის „უსაფრთხოდ" მონიშვნა საჯაროდ · evidence-ის გამოქვეყნება (**sensitive content ყოველთვის ადმინის blur-გადაწყვეტილებაა**) · მესამე მხარისთვის ფაილის გაგზავნა მომხმარებლის თანხმობის გარეშე |

> ⚠️ რეალობა: მიმდინარე `/api/analyze` **ამ ფუნქციას არ ასრულებს** (მოდელი ინტერნეტს არ ამოწმებს). წყაროების შემოწმებას რეალური ინსტრუმენტები სჭირდება (search/archive API-ები) — ეს ცალკე ინტეგრაცია.

#### C) თარგმანი (ka ↔ en ↔ hy)

| | |
|---|---|
| **Input** | ადმინის მიერ დამტკიცებული **წყარო-ენის** `title / claim / explanation` (ერთი „canonical" ენა). გლოსარიუმი (სახელები, ტოპონიმები). |
| **Output** | დანარჩენი 2 ენის draft + `warnings` (ციფრები/თარიღები/სახელები შეიცვალა? ანბანის შერევა? ტერმინის შეუსაბამობა). |
| **UI** | `editor.tsx`-ის 3-სვეტიანი KA/HY/EN ველები (`:99-125`): ცარიელ ენებს აქვს ღილაკი „🤖 შეავსე draft-ით"; draft-ი ყვითელი ფონით „გადაუმოწმებელია". **Publish გამორთულია, სანამ ყველა ენა არ არის „გადამოწმებული"** (ან ადმინი აშკარად არ აირჩევს „გამოქვეყნება მხოლოდ ენა X-ზე"). |
| **ღილაკები** | **Approve** (ენა = „გადამოწმებული") · **Edit** (ხელით შესწორება → ავტომატურად „გადამოწმებული") · **Reject** (გაასუფთავე) |
| **Audit log** | ენა, AI-draft, საბოლოო ტექსტი, რეცენზენტი (სახელი + ენის კომპეტენცია), დრო; **ცალკე ველი — `reviewed_by_native_speaker: bool`** |
| **არასოდეს ავტომატურად** | გამოქვეყნება გადაუმოწმებელი ენით · არსებული დამტკიცებული თარგმანის გადაწერა · UI-ის `messages/*.json`-ში ჩაწერა (ინტერფეისის თარგმანები → მხოლოდ PR-ით) |
| **შენიშვნა** | ეს აგენტი პირდაპირ აგვარებს §3-ის ხარვეზს: შერეული ანბანის დეტექტორი (ჩემი სკრიპტი ზუსტად ასეთს პოულობს) — შეიძლება deterministic წინასწარი შემოწმება იყოს, LLM-ის გარეშე. |

#### D) მოდერაცია

| | |
|---|---|
| **Input** | ახალი კომენტარი + თრედის კონტექსტი + claim-ის შეჯამება. |
| **Output** | `{ labels: [spam|hate|harassment|doxxing|off-topic|ok], severity, suggested_action: hide|keep|escalate, reason, reply_draft? }` |
| **UI** | `admin_comments` (დიზაინი #3): კომენტარის გვერდით 🤖 ლეიბლი + მიზეზი; „საეჭვო" ფილტრი; reply draft-ი ტექსტის ველში წინასწარ ჩადებული. |
| **ღილაკები** | **Approve** (მიიღე შემოთავაზებული მოქმედება: Hide/Keep) · **Edit** (სხვა მოქმედება ან reply-ს ტექსტი) · **Reject** (AI-ის ლეიბლი არასწორია) · არსებული **Hide / Delete** დიზაინიდან |
| **Audit log** | კომენტარის ორიგინალი (snapshot, რადგან შეიძლება წაიშალოს), AI-ის ლეიბლები, ადმინი, მოქმედება, reply-ს საბოლოო ტექსტი, დრო |
| **არასოდეს ავტომატურად** | კომენტარის **წაშლა** (დიზაინში Delete) · მომხმარებლის დაბლოკვა · პასუხის **გაგზავნა** საჯაროდ · კომენტარის „საჯაროდ დამალვა" (გარდა სპეციალურ **soft hold** რეჟიმისა, თუ ადმინმა წინასწარ ჩართო — და მაშინაც ადმინი ხედავს „AI-მ დაიჭირა" რიგს და იღებს/აბრუნებს) |

#### E) Quiz Generator

| | |
|---|---|
| **Input** | **მხოლოდ** `status ≠ pending` და ადმინის მიერ დადასტურებული claims (verdict + explanation + sources); სურათები — მხოლოდ ლიცენზირებული/საკუთარი. |
| **Output** | `{ question, options[2-4], correct, explanation, difficulty, source_claim_id, language }` + „დისტრაქტორების" დასაბუთება. |
| **UI** | ახალი ადმინ ტაბი „Quiz" (დიზაინს არ აქვს — დამატებით დასაგეგმი) + preview, როგორც `quiz_question` ეკრანი (#7). |
| **ღილაკები** | **Approve** (გამოქვეყნება quiz pool-ში) · **Edit** (შეკითხვა/პასუხები) · **Reject** · **Regenerate** |
| **Audit log** | `source_claim_id`, AI-ის draft, საბოლოო ვერსია, ადმინი, დრო; **ფაქტის წყაროს ბმული შეკითხვაზე** |
| **არასოდეს ავტომატურად** | quiz-ში ჩართვა · ახალი სურათის გენერაცია და „რეალურად" წარდგენა · შეკითხვა დაუდასტურებელი/pending claim-იდან · სწორი პასუხის სერვერზე გარეშე კლიენტისთვის გაგზავნა (ამჟამად `correct` კლიენტშია — `quiz-data.ts`, გამოსწორება: სერვერზე შემოწმება) |

### 5.3 საერთო „არასოდეს" სია (ყველა აგენტზე)

- **გამოქვეყნება** (`published_at`, public visibility)
- **ვერდიქტი** (`fake/manipulative/true`) — AI-ს შეუძლია მხოლოდ „რისკის სიგნალი" (როგორც `/api/analyze`-ის `riskLevel`), რომელიც UI-ში **არ არის verdict-ის ბეჯის იდენტური**
- **წაშლა / უარყოფა** (მათ შორის ავტორისთვის „უარყოფილია" შეტყობინება)
- **ბმულის/ფაილის გახსნა** ადმინის გარეშე საფრთხიანი წყაროსთვის (sandbox)
- **მომხმარებლისთვის კომუნიკაცია**
- **ბიუჯეტის ზრდა** (ლიმიტის გადაჭარბებისას — გაჩერება, არა ავტო-გაზრდა)

### 5.4 დანერგვის თანმიმდევრობა

1. (P0 ბაზა) რეალური DB + auth + `audit_log` — **აგენტების გარეშე**.
2. `ai_suggestions` ცხრილი და ერთიანი „🤖 Suggestion" UI-კომპონენტი ადმინში (Approve/Edit/Reject).
3. **თარგმანი** (ყველაზე დაბალი რისკი, ყველაზე მაღალი ეფექტი — უკვე გვაქვს რეალური შეცდომები).
4. **Triage** (დუბლიკატები — embedding-ები).
5. **Moderation** (კომენტარები ჯერ უნდა არსებობდეს).
6. **Evidence check** (გარე ინსტრუმენტები).
7. **Quiz generator**.

---

## 6. პრიორიტეტული გეგმა

სირთულე: **S** ≤ 1 დღე · **M** 2–5 დღე · **L** > 1 კვირა.

### P0 — საიტი გამოსაყენებელი და უსაფრთხო (აგენტების გარეშე)

| # | რა | რატომ | ფაილები | სირთ. |
|---|---|---|---|---|
| P0.1 | **რეალური backend + DB** (მაგ. Supabase/Postgres): `claims`, `submissions`/status, `users`, `audit_log`; localStorage-ის ჩანაცვლება | ახლა მომხმარებლის გაგზავნილი claim ადმინამდე ვერ აღწევს — საიტი **ფუნქციურად არ მუშაობს** | `src/lib/store.tsx`, `src/lib/types.ts`, `src/data/claims.ts` (მხოლოდ seed-ისთვის), ახალი `src/app/api/claims/*` | L |
| P0.2 | **რეალური ადმინ-auth** (სერვერული სესია, `middleware.ts`, როლები); პაროლის და მინიშნების მოცილება | S1–S3: ახლა ნებისმიერი „ადმინია" | `admin-dashboard.tsx:15-30,112-154`, `messages/*:81-85`, ახალი `middleware.ts` | M |
| P0.3 | **სერვერული ვალიდაცია + rate-limit + captcha** submit-ზე და `/api/analyze`-ზე; URL allowlist (`https?:`) | S5, S7, S9, S10 | `submission-form.tsx`, `api/analyze/route.ts`, ახალი `api/claims/route.ts` | M |
| P0.4 | **Soft-delete + ადმინის მოქმედებების audit log** (`rejected` სტატუსი, ვინ/როდის/რატომ); `verifiedBy` რეალური ადმინიდან | Q1, P5; ეს ასევე საფუძველია აგენტებისთვის | `store.tsx:95-125`, `editor.tsx:31-47,128`, `types.ts` | M |
| P0.5 | **სიმართლის-გამოქვეყნების წესი:** Publish ბლოკი, თუ ახსნა/სათაური რომელიმე ენაზე ცარიელია ან ორიგინალის ტექსტია; `notes` ველის შენახვა | Q3, Q4, S10 | `editor.tsx:31-47`, `store.tsx:74-93`, `types.ts` | S |
| P0.6 | **seed-ის თარგმანების შესწორება** (შერეული ანბანი, 6 ხაზი) + CI-ტესტი ასეთი შერევის და key-parity-ის დასაჭერად | §3 | `src/data/claims.ts:21,51,69,74,79,104` | S |
| P0.7 | **URL-ზე დაფუძნებული ლოკალი** (`/ka`, `/hy`, `/en`) ან მინიმუმ სწორი `<html lang>` SSR-ში; per-claim metadata (`title`, `og:*`) | A1, §3.7; SEO + გაზიარება (fact-check-ისთვის კრიტიკულია ბმული) | `layout.tsx`, `i18n.tsx`, `app/**` → `app/[locale]/**` | M |
| P0.8 | **Env/deploy ბაზა:** `.env.example`, README-ს განახლება (`GEMINI_API_KEY`), `vercel.json`/CI (lint+typecheck+build), eslint-ის დაყენება, security headers | S11, S12, §4.7 | `README.md`, `package.json`, `next.config.mjs`, `.github/workflows/ci.yml` | S |
| P0.9 | **კონფიდენციალურობის/წესების გვერდი** + გამჟღავნება AI/ფაილების დამუშავებაზე | P1, P2 | ახალი `src/app/privacy/page.tsx`, footer | S |
| P0.10 | **Evidence ფაილების ატვირთვა უსაფრთხოდ** (storage, MIME/ზომა, EXIF-ის წმენდა, signed URL, sensitive blur) | S8; დიზაინის submit/claim_detail-ის ძირითადი ფუნქცია | `submission-form.tsx`, ახალი `api/upload`, `types.ts` (`evidence[]`) | L |

### P1 — დიზაინთან დაბრუნება და პროდუქტის სისრულე

| # | რა | რატომ | ფაილები | სირთ. |
|---|---|---|---|---|
| P1.1 | **ერთიანი design tokens** (`DESIGN.md` ↔ `tailwind.config.ts`) და **dark mode** (`darkMode:"class"` + CSS vars) | აპს dark არ აქვს, დიზაინს აქვს; ტოკენები არ ემთხვევა (§1) | `tailwind.config.ts`, `globals.css`, `components/**` | L |
| P1.2 | **Claim detail-ის Evidence ბლოკი, Share, Download report, Reveal (sensitive)** | დიზაინი #5 | `claim/[id]/page.tsx`, ახალი `components/evidence-card.tsx` | M |
| P1.3 | **ადმინ queue-ის ფილტრები/სორტირება, bulk, კომპაქტური ბარათი; submit-ის success: Claim ID + სტატუსის ტრეკინგი** | დიზაინები #2, #9 | `admin-dashboard.tsx`, `editor.tsx`, `submission-form.tsx` | M |
| P1.4 | **Telegram Mini App** (`/tma` route, SDK, `initData` HMAC ვალიდაცია, theme) + ბოტი | დიზაინი #10; მომხმარებელთა შესვლის არხი | ახალი `app/tma/**`, `api/tma/**` | L |
| P1.5 | **`/api/analyze`-ის UI-ში ჩართვა** როგორც „რისკის სიგნალი" (არა verdict), კეშირებით | კოდი უკვე არსებობს, გამოუყენებელია | `submission-form.tsx` ან ახალი ადმინ-პანელი, `api/analyze/route.ts` | M |
| P1.6 | **კომენტარები + მოდერაციის ეკრანი** (user auth, hide/delete, ფილტრები) | დიზაინი #3 | ახალი `components/comments/*`, `admin/comments.tsx`, `types.ts` | L |
| P1.7 | **Quiz → DB**, სერვერული პასუხის შემოწმება, Review Answers, დრო, light/dark | დიზაინები #7, #8; ამჟამად 3 hard-coded შეკითხვა | `quiz-data.ts`, `quiz-app.tsx` | M |
| P1.8 | **Accessibility პასი:** skip-link, tab roles, focus trap, კონტრასტი, ≥12px ტექსტი, `prefers-reduced-motion` | §4.3 | `admin-dashboard.tsx`, `modal.tsx`, `globals.css` | M |
| P1.9 | **ტესტები:** unit (`isAnalyzeResult`, i18n parity), e2e (submit → admin → publish → feed) | §4.6 | ახალი `tests/**`, `package.json` | M |
| P1.10 | **Fonts self-hosting** (`next/font`), `next/image` + მკაცრი `remotePatterns` | P3, S8 | `layout.tsx:21-26`, `next.config.mjs` | S |

### P2 — AI აგენტები და გაფართოება

| # | რა | რატომ | ფაილები | სირთ. |
|---|---|---|---|---|
| P2.1 | **Suggestion ინფრასტრუქტურა:** `ai_suggestions`/`ai_decisions`, ერთიანი Approve/Edit/Reject UI კომპონენტი, audit | §5.1 — საფუძველი ყველა აგენტისთვის | ახალი `src/lib/ai/*`, `components/admin/suggestion.tsx` | M |
| P2.2 | **Translation agent** + შერეული ანბანის deterministic checker + „გადამოწმებულია" მდგომარეობა ენაზე | §5.2-C, ყველაზე ადრე ღირებული | `editor.tsx`, `types.ts`, ახალი `api/ai/translate` | M |
| P2.3 | **Claim triage** (კატეგორია, პრიორიტეტი, დუბლიკატები embedding-ებით) | §5.2-A | queue UI, `api/ai/triage` | M |
| P2.4 | **Moderation agent + reply drafts** (P1.6-ის შემდეგ) | §5.2-D | `admin/comments.tsx` | M |
| P2.5 | **Evidence check agent** (reverse image, EXIF, archive lookup — გარე ინსტრუმენტები) | §5.2-B | `api/ai/evidence`, evidence UI | L |
| P2.6 | **Quiz generator** | §5.2-E | ადმინ „Quiz" ტაბი | M |
| P2.7 | **ანალიტიკა DB-ზე** (დრო, ენა, AI-ის მიღების/უარყოფის მაჩვენებელი — აგენტის ხარისხის მეტრიკა) | აგენტების გაუმჯობესება და ნდობა | `analytics.tsx` | M |
| P2.8 | **Browser extension & WhatsApp ბოტი რეალურად** (ახლა მხოლოდ მარკეტინგული სექციაა) | `extension-section.tsx`, `bot-section.tsx` ახლა დაპირებას იძლევა, რასაც პროდუქტი არ ასრულებს — ან რეალიზაცია, ან „Coming soon" ეტიკეტი | იგივე ფაილები | L |

---

### დამატებითი შენიშვნა

**P0.8 ან პატარა პუნქტი, რომელსაც დაუყოვნებლივ ეხება:** UI-ზე მყისიერად ჩანს „Demo password: caucasus" — თუ საიტი უკვე სადმე დეპლოიდია, ეს წარმოადგენს ღია ადმინ-პანელს (მონაცემები ამჟამად მხოლოდ ბრაუზერის ლოკალურია, ამიტომ რეალური ზიანი ამჟამად მცირეა, მაგრამ P0.1-ის შემდეგ — კრიტიკულია).
