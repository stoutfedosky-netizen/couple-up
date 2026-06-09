# Couple Up

A Love Island USA Season 8 bracket prediction game. Think March Madness pools, but for reality TV couples. Predict who will couple up, call the dumpings, answer bonus questions, and compete with friends on the leaderboard.

## Features

- **Bracket Predictions** — Tap-to-pair couples, predict dumpings, answer bonus yes/no questions each week
- **Scoring Engine** — Correct couple (+10), bombshell couple (+20), correct dumping (+15), bonus question (+5), perfect week (+25), streak bonus (+10), season winner (+50)
- **Global + Weekly Leaderboards** — Dense ranking with rank movement arrows, crown/medal icons for top 3
- **Private Leagues** — Create or join leagues via 6-character invite codes, league-scoped leaderboards, member management
- **Shareable Prediction Cards** — OG image generation for social sharing after submitting predictions
- **Weekly Results Feed** — See actual couples/dumpings after each week is resolved, with a comment thread
- **Season Winner Pick** — Lock in your season winner prediction before Week 4
- **Admin Panel** — Full CRUD for islanders, week creation, resolve-week workflow (pair couples, select dumpings, answer bonus questions, trigger scoring)
- **Mobile-First Design** — Touch-optimized bracket builder, responsive throughout, installable as PWA
- **Auth** — Email/password and Google OAuth via Supabase Auth

## Tech Stack

- **Next.js 16** with App Router, Server Components, and Server Actions
- **TypeScript** with strict mode
- **Tailwind CSS v4** for styling
- **Supabase** for PostgreSQL database, authentication, and Row Level Security
- **`@supabase/ssr`** for server/client Supabase helpers
- **`next/og`** (Satori) for dynamic OG image generation

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project ([supabase.com](https://supabase.com))

### 1. Clone and install

```bash
git clone <your-repo-url> couple-up
cd couple-up
npm install
```

### 2. Set up environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anon/public key

### 3. Set up the database

Run the migrations in your Supabase SQL editor (in order):

1. `supabase/migrations/001_initial_schema.sql` — Creates all 14 tables, RLS policies, and the `handle_new_user()` trigger
2. `supabase/migrations/002_comments.sql` — Adds the comments table for weekly results discussion

Then seed the initial data:

3. `supabase/seed.sql` — 11 Day 1 islanders + Week 1

### 4. Set yourself as admin

After signing up, run this SQL in your Supabase SQL editor:

```sql
UPDATE profiles SET is_admin = true WHERE id = '<your-user-id>';
```

You can find your user ID in the Supabase Auth > Users dashboard.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add your environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy

## Project Structure

```
app/
  (auth)/           # Login, signup pages
  (protected)/      # Authenticated pages
    dashboard/      # Main dashboard with stats, leagues, CTAs
    bracket/        # Bracket builder (4-step prediction flow)
    islanders/      # Islander profiles grid
    leaderboard/    # Global, weekly, and league leaderboards
    predictions/    # Prediction history with score breakdowns
    results/        # Weekly results feed with comments
    admin/          # Admin panel (islanders, weeks, bonus questions)
    profile/        # User profile
  api/
    og/             # OG image generation for prediction cards
    score-week/     # Scoring engine endpoint
    weekly-leaderboard/   # Weekly leaderboard data
    league-leaderboard/   # League leaderboard data
components/         # Shared UI components
lib/
  queries/          # Database query functions
  scoring.ts        # Scoring algorithm
  supabase/         # Supabase client helpers
types/              # TypeScript interfaces
supabase/           # Migrations and seed data
```

## Scoring Breakdown

| Prediction | Points |
|---|---|
| Correct couple | +10 |
| Correct bombshell couple | +20 |
| Correct dumping | +15 |
| Correct bonus question | +5 |
| Perfect week (all correct) | +25 |
| Streak (consecutive perfect) | +10 |
| Season winner | +50 |
