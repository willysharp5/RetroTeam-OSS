# RetroTeam OSS

A self-hostable, open-source retrospective tool for software teams. Built with
Next.js, React and Firebase.

**No paid tier. No billing. No gated features.** Every feature in this repo
works for everyone who runs it. Anything that needs a third-party service is
bring-your-own-key — you supply the credential, and the app never calls a
hosted service on your behalf. It runs end to end with zero paid services.

---

## Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [Path A — local Firebase emulators (zero cost, no signup)](#path-a--local-firebase-emulators-zero-cost-no-signup)
  - [Path B — a real Firebase project on the free Spark tier](#path-b--a-real-firebase-project-on-the-free-spark-tier)
- [Adding your API keys](#adding-your-api-keys)
- [Running and building](#running-and-building)
- [Making yourself an admin](#making-yourself-an-admin)
- [Application rules](#application-rules)
- [Deploying](#deploying)
- [Project layout](#project-layout)
- [Contributing](#contributing)
- [License and provenance](#license-and-provenance)

---

## Features

**Retrospective boards**

- Multi-stage boards: capture → group → vote → actions → results
- Board templates, plus custom columns and prompts
- Real-time collaboration with live cursors and presence
- Anonymous participation — guests can join a board with a link, no account
- Comments, threaded replies, reactions and configurable vote budgets
- Timers, board locking and facilitator controls
- Icebreakers to open a session

**Follow-through**

- Action items with owners, due dates and status, carried across retrospectives
- A dedicated actions view with search and filtering
- Jira integration for pushing action items out as issues
- Analytics: participation, sentiment over time, recurring themes
- Export and print a finished retrospective

**Teams and organizations**

- Organizations, teams and per-team retrospectives
- Role-based permissions (owner, admin, member) with per-role rules
- Email or link invitations at the organization, team and board level
- An admin area for users, organizations and AI settings

**AI (bring your own key)**

- Automatic grouping of similar cards into themes with suggested tags
- Suggested action items from the board's feedback
- Pattern and trend analysis across a single retrospective
- Strengths and improvement areas across many retrospectives over time
- Works with Anthropic, OpenAI, Google, or any OpenAI-compatible endpoint you
  run yourself (Ollama, LM Studio, vLLM) — and every prompt is editable in the
  admin UI

Without an AI key, the AI buttons show a short notice asking you to add one.
Nothing else changes, and no feature is withheld.

---

## Prerequisites

- **Node.js 22.x** (see `engines` in `package.json`)
- **Git**
- A terminal. That is it — no account or credit card is needed to run locally.

```bash
git clone https://github.com/willysharp5/RetroTeam-OSS.git
cd RetroTeam-OSS
npm install
```

Then copy the environment template:

```bash
cp .env.example .env.local
```

`.env.example` documents every variable the app reads, what it is for, and what
breaks without it. `.env.local` is gitignored — never commit real values.

---

## Setup

Pick one of the two paths below.

### Path A — local Firebase emulators (zero cost, no signup)

The fastest way to get a working app. The Firebase Emulator Suite runs Auth,
Firestore and Storage on your machine. No Firebase account, no network calls,
no cost.

**1. Set these in `.env.local`:**

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_EMULATOR=true

# The emulators do not validate these — any non-empty placeholder works.
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-retroteam
NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-retroteam.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:0000000000000000000000

# Any long random string. Generate one with: openssl rand -hex 32
SECRET_KEY=
```

**2. Start the emulators** (leave this running):

```bash
npm run firebase:emulators:start
```

The Emulator UI is at http://localhost:4000. The emulators start empty and
every feature builds its own data, so you create the first account yourself in
step 3 — there is no seed dataset to import.

The script starts Auth, Firestore and Storage only. The Cloud Functions in
`functions/` are cleanup and notification helpers and are not needed for local
development.

**3. Start the app** in a second terminal:

```bash
npm run dev
```

Open http://localhost:3000 and sign up. Emulator accounts are local and
throwaway; the Emulator UI's Authentication tab shows the verification and
password-reset links Firebase would have emailed.

Emulator data is discarded when you stop the emulators. To keep what you
created, snapshot it first:

```bash
npm run firebase:emulators:export
```

That writes to `.emulator-data/`, which is gitignored — it contains real
accounts and password hashes, so never commit it. Load it again with:

```bash
npm run firebase:emulators:start -- --import ./.emulator-data
```

### Path B — a real Firebase project on the free Spark tier

For a deployment other people can use. Spark is Firebase's free plan; it needs
no credit card and comfortably covers a team-sized install.

**1. Create the project.** Go to https://console.firebase.google.com → **Add
project**. Google Analytics is optional; skip it.

**2. Enable Authentication.** In the console: **Build → Authentication → Get
started**. Under **Sign-in method**, enable:

- **Email/Password** — and, if you want guests to join boards without an
  account, tick **Anonymous** as well.
- **Google** (optional) — pick a support email when prompted.

Under **Settings → Authorized domains**, add the domain you will deploy to.
`localhost` is already there.

**3. Create Firestore.** **Build → Firestore Database → Create database**.
Choose a region close to your users. Start in **production mode** — this repo
ships its own `firestore.rules`, which you deploy in step 6.

**4. Create Storage** (used for avatars and attachments). **Build → Storage →
Get started**, same region.

**5. Get your credentials.**

*Client config* — **Project settings → General → Your apps → Web app** (create
one with the `</>` button if there is none) → **SDK setup and configuration →
Config**. Copy each value into the matching `NEXT_PUBLIC_FIREBASE_*` variable
in `.env.local`. These are public by design; your Firestore rules are what
protect the data.

*Service account* — **Project settings → Service accounts → Generate new
private key**. From the downloaded JSON, copy `client_email` into
`FIREBASE_CLIENT_EMAIL` and `private_key` into `FIREBASE_PRIVATE_KEY`. Keep the
literal `\n` escapes and wrap the value in double quotes:

```dotenv
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

Treat this key like a password. It is a full admin credential for your project.

Also set:

```dotenv
NEXT_PUBLIC_SITE_URL=https://your-domain.example
NEXT_PUBLIC_EMULATOR=false
SECRET_KEY=<openssl rand -hex 32>
```

**6. Deploy the security rules and indexes.** Point the Firebase CLI at your
project, then deploy:

```bash
npx firebase login
npx firebase use --add          # pick your project, alias it "default"
npm run firebase:deploy:rules
```

That deploys `firestore.rules`, `firestore.indexes.json` and `storage.rules`.
**Do not skip this** — an install without these rules is either wide open or
completely locked, depending on the mode you chose in step 3.

The composite indexes in `firestore.indexes.json` take a few minutes to build.
Until they finish, some list and search views will error; that is expected.

**7. (Optional) Deploy the Cloud Functions.** They handle notification and
cleanup side effects and are not required for the app to work. Note that Cloud
Functions require the **Blaze** (pay-as-you-go) plan, so on Spark you simply
skip this.

```bash
npx firebase deploy --only functions
```

**8. Run it.**

```bash
npm run dev
```

---

## Adding your API keys

Everything below is optional. The app boots and runs without any of it.

### AI provider (optional)

Powers grouping, suggested actions, pattern analysis and analytics insights.

| Provider | Where to get a key | Notes |
| --- | --- | --- |
| Anthropic | https://console.anthropic.com/settings/keys | Default. Default model `claude-sonnet-5`. |
| OpenAI | https://platform.openai.com/api-keys | |
| Google | https://aistudio.google.com/apikey | |
| OpenAI-compatible | — | Point it at a local Ollama / LM Studio / vLLM server. Needs only a base URL; no key at all. |

Two ways to set it:

- **In the app** — sign in as an admin and go to **Admin → AI Settings**. Pick
  the provider and model, paste your key, and use the "Test" button to check it.
  You can also edit every system prompt and temperature here. Values set in the
  UI are stored in Firestore and take precedence over the environment.
- **In the environment** — set `AI_API_KEY` in `.env.local`.

**Without a key:** every AI button shows a notice pointing at Admin → AI
Settings. Boards, voting, actions, analytics, teams and invitations all work as
normal. There is no upgrade prompt, because there is nothing to upgrade to.

### SMTP for outbound email (optional)

Used for invitations, retrospective summaries and member notifications. Set
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` and `EMAIL_SENDER` in
`.env.local`. Any SMTP provider works, including free tiers, your own Postfix,
or a local catch-all like Mailpit (`SMTP_HOST=localhost`, `SMTP_PORT=1025`).

**Without SMTP:** nothing throws. `src/lib/server/email/send-email.ts` logs a
one-time warning and then writes each email — including its links — to the
server console, and the surrounding request succeeds. You are not locked out:

- Password resets and email verification are sent by **Firebase Auth**, not by
  SMTP, so they work with no configuration at all.
- Every invitation link can be copied straight from the UI. Organization
  invites have a **Copy invite link** action in the pending-invites list; teams
  and boards have the same on their invite lists.

Email bodies are rendered locally in `src/lib/server/email/templates.ts` — no
external template service. Edit them freely; they are plain functions returning
inline-CSS HTML.

### Cron secret (optional)

Two endpoints finish overdue retrospectives and expire stale anonymous
accounts:

```
POST /api/cron/finish-retrospectives
POST /api/cron/disable-anonymous-users
```

They reject everything unless `CRON_SECRET` is set and the caller sends
`Authorization: Bearer <CRON_SECRET>`. On Vercel they are already wired up in
`vercel.json`; anywhere else, call them from your own scheduler. Leave
`CRON_SECRET` empty to leave them disabled.

### Firebase App Check (optional)

Set `NEXT_PUBLIC_APPCHECK_KEY` to a reCAPTCHA v3 site key from **Firebase
Console → App Check** to harden the API against abuse. Left empty, App Check is
skipped entirely.

### Google Analytics (optional, off by default)

Set `NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID` to enable it. When it is
empty, no analytics script is loaded and a default install sends nothing to any
third party.

---

## Running and building

```bash
npm run dev          # dev server on http://localhost:3000
npm run typecheck    # tsc --noEmit
npm run lint         # next lint
npm run healthcheck  # lint + typecheck
npm run format       # prettier --write src/**/*.{ts,tsx}
npm run build        # production build
npm start            # serve the production build
npm run cypress      # open the end-to-end test runner
```

The Cypress suite expects the emulators plus `npm run dev:test`, and
`CSRF_MOCK_TOKEN`, `USER_EMAIL` and `USER_PASSWORD` set. See
`scripts/test.sh`.

---

## Making yourself an admin

The admin area (`/admin`) — users, organizations and AI settings — is gated on a `superAdmin: true` field on your own user document.
There is no self-serve promotion, by design.

After signing up, set it manually:

- **Emulators:** open http://localhost:4000 → **Firestore** → the `users`
  collection → your document → add a boolean field `superAdmin` set to `true`.
- **Real project:** the same, in the Firebase Console's Firestore data viewer.

Reload the app and `/admin` becomes available.

---

## Application rules

Behaviour like "can members comment", "can a finished retrospective be
deleted", board locking and the AI token budget lives in the Firestore `rules`
collection, one document per section (`organizations`, `boards`,
`retrospectives`, `users`, `ai`). There is no editor UI for it — write the
documents directly in the Firestore data viewer or the Emulator UI.

**That collection is optional.** A fresh install has no documents in it, so
every rule falls back to the permissive defaults in
`src/lib/rules/defaults.ts`, merged in by `src/lib/server/rules/get-rules.ts`.
Everything works out of the box; write a document only to tighten something.

These are governance settings for your own team, not entitlements. Nothing here
is a paywall.

---

## Deploying

### Vercel

The app is a standard Next.js Pages Router application.

1. Import the repository at https://vercel.com/new.
2. Add every variable from your `.env.local` under **Settings → Environment
   Variables**. `FIREBASE_PRIVATE_KEY` must keep its `\n` escapes.
3. Set `NEXT_PUBLIC_SITE_URL` to your deployed URL.
4. Add that domain to **Firebase Console → Authentication → Settings →
   Authorized domains**.
5. Deploy. `vercel.json` registers the two cron jobs automatically; set
   `CRON_SECRET` if you want them to run.

This repo ships an `.npmrc` with `legacy-peer-deps=true`, which the React 19
dependency tree needs during install.

### Self-hosting anywhere else

```bash
npm ci
npm run build
npm start            # listens on $PORT, default 3000
```

Run it behind any reverse proxy, or in a container built on `node:22-alpine`.
Firebase does the data hosting, so the app server itself is stateless — scale
it horizontally without extra work. Schedule the two cron endpoints yourself if
you want them.

---

## Project layout

```
src/
  components/          React components, grouped by feature
  configuration.ts     Central config, all read from environment variables
  core/                Framework-level code: Firebase setup, middleware, UI kit
  lib/
    ai/                Client-side AI helpers
    board/             Board domain logic
    organizations/     Organization and membership logic
    rules/             Application rules, including defaults.ts
    server/            Server-only code
      ai/              Provider clients, prompts, response parsing
      email/           SMTP sender and local email templates
  pages/               Next.js Pages Router: routes and API handlers
  styles/              Tailwind and global CSS
functions/             Firebase Cloud Functions (optional)
cypress/               End-to-end tests
firestore.rules        Firestore security rules — deploy these
firestore.indexes.json Composite indexes — deploy these
```

---

## Contributing

Issues and pull requests are welcome.

1. Fork the repo and branch off `main`.
2. Make your change. Keep it focused — one concern per pull request.
3. Run `npm run healthcheck` and `npm run format` before you push. A green
   `typecheck` and `lint` are the bar for review.
4. Open a pull request describing what changed and how you tested it.

A few conventions worth knowing:

- Match the style of the file you are editing. Prettier settings are in
  `.prettierrc`.
- Do not reintroduce a paid tier, a usage limit or an upgrade prompt. That is
  the one hard rule in this fork.
- Anything that needs a third-party credential must be bring-your-own-key,
  optional, and must degrade gracefully when unconfigured.
- Never commit a `.env*` file with real values, or any key, token or service
  account JSON.

---

## License and provenance

Released under the [MIT License](LICENSE).

This project descends from RetroTeam, which was itself built on
[MakerKit](https://makerkit.dev)'s `next-firebase-saas-kit` — a commercial
Next.js/Firebase boilerplate. Structural code, the UI primitives in
`src/core/ui`, the middleware helpers and the auth scaffolding originate there.
MakerKit's own license is separate from and not granted by this repository's MIT
license; if you intend to redistribute this code, check MakerKit's terms
yourself.

The billing, subscription, SSO and third-party analytics layers of the original
have been removed rather than disabled.
