# GiGi — beta test build

A proactive chief of staff for the household. One 7am digest, never more than
four things, one-tap approvals. This repo is the **deploy-and-try** test build:
the whole experience runs as a single Next.js app with seeded data and **no
external services or API keys required to boot**.

## Deploy in one click

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/robinandreeklund-collab/test/tree/claude/mvp-architecture-beta-plan-mqz8f0)

The button reads [`render.yaml`](render.yaml) and provisions everything
automatically — build, start, EU region, health check — with **no secrets to
set**. Click it, approve the blueprint, and GiGi is live in a couple of minutes
with the seeded demo household ready to try.

> Once this branch is merged to `main`, drop the `/tree/...` suffix from the
> button URL so it deploys from the default branch.

> Design language note: the visual system (calm, warm, premium) is driven by
> design tokens at the top of `src/app/globals.css`. Reskinning to the final
> brand is a one-file change.

## Run it locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Deploy to Render (one click)

1. Push this repo to GitHub.
2. In Render: **New + → Blueprint**, point at the repo, **Apply**.
   `render.yaml` builds and starts it, health-checked, in the EU (Frankfurt).
3. Open the URL. It works immediately — a demo household ("Kerstin") is seeded.

No environment variables are needed for the test build. `.env.example` lists the
ones you'll add later (Anthropic, Supabase).

## Logging in

The build now has a real **sign-up / log-in** with sessions:

- **`/signup`** — create an account (name, email, password). You get your own
  fresh household (seeded with a couple of example "found" bills) and land in
  onboarding.
- **`/login`** — log back into that account, or hit **"Just show me the demo"**
  to explore the ready-made demo household with no account.
- The landing page has a **Log in** link and an **or try the demo** shortcut.
- Log out from **Settings**. Sessions are a signed cookie; passwords are scrypt-
  hashed in the in-memory store (production swaps this for Supabase Auth).

> It's a test build: accounts live in memory and reset on redeploy. No email
> verification, no password reset — those come with the real auth backend.

## What to try

- **Landing** (`/`) — the two-step waitlist (household vs. company).
- **Onboarding** (`/onboarding`) — profile → connect (forward-to-GiGi, no OAuth)
  → bills-found (confirm/edit + **add manually**) → "GiGi is running".
- **Today** (`/app/digest`) — the core surface: ≤4 items, urgency dots, approve /
  mark-done / dismiss, an **overflow** area, **minimum mode** on a quiet day, and
  a per-item **⚑ feedback** report.
- **Home** (`/app`) — value tracker, next renewal, and a button to **simulate
  tonight's 2am run**.
- **Settings** (`/app/settings`) — digest time/timezone/pause, data deletion, and
  a demo toggle to **simulate a dropped connection** (see the degraded state).
- **Metrics** (`/app/metrics`) — the founder view of the instrumentation.

## Project layout

```
src/
  app/
    page.tsx              landing + waitlist
    privacy/              privacy page
    onboarding/           profile → connect → bills → done
    app/                  digest · bills · settings · metrics · home (tab bar)
    api/                  household, bills, digest, actions, value,
                          events, feedback, waitlist
  lib/
    types.ts              domain types (mirror db/schema.sql)
    store.ts              in-memory store + seed (swap for Supabase)
    digest.ts            digest ranker = the "Prompt 2" output contract
    money.ts, analytics.ts
  components/             TabBar, AddBill, OnboardingProgress
db/schema.sql             production Postgres schema
docs/                     ARCHITECTURE · API · DECISIONS
CLAUDE.md                 the two-prompt AI spec
render.yaml               Render blueprint
```

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system shape, real vs. simulated.
- [`docs/API.md`](docs/API.md) — every endpoint.
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — **how the beta-risk critique shaped this build** (skip Gmail OAuth, single market, no insurance fee, DPIA/EU-inference, P0 gaps closed).
- [`docs/FORWARDING.md`](docs/FORWARDING.md) — **how to try the forward feature** (in-app tester with zero setup; real email via Postmark/Cloudflare on free Render; optional AI extraction).
- [`db/schema.sql`](db/schema.sql) — the production schema.
- [`CLAUDE.md`](CLAUDE.md) — extraction + digest prompt contracts.

## Graduating to production

The API layer only ever touches `src/lib/*`, so each of these is a localized swap,
not a rewrite:

| Swap | From | To |
|------|------|----|
| Data | `src/lib/store.ts` | Supabase Postgres (`db/schema.sql`) |
| Extraction | seeded bills | Anthropic Prompt 1 (EU region) |
| Digest | `buildDigest` in `digest.ts` | Anthropic Prompt 2 (same contract) |
| Nightly job | `POST /api/digest/generate` | Inngest 02:00 scheduled function |
| Push | in-app "Today" | Expo Notifications 07:00 |
