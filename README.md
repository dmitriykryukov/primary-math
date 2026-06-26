# MathPrimaire

A bilingual (English/French) web platform for Canadian primary school students in Grades 5 & 6 to practice math daily — multiplication tables, division, and fractions.

## Features

- **Bilingual** — full EN/FR support, toggle at any time from the top bar
- **Two grades** — Grade 5 (×12 tables, division, fractions same denominator) and Grade 6 (harder combos, different denominators, multiply/divide fractions)
- **60 lessons** — 30 per grade, unlocked sequentially, 20 questions each
- **Two exercise modes** — typed answer (numpad) and multiple choice (4 options)
- **Gamification** — daily streak, X/30 progress bar, badges (≥15/20), class leaderboard
- **Role hierarchy** — Admin → Teacher → Student; no self-registration
- **Teacher dashboard** — class overview, per-student lesson history, ⚠️ inactive flag (4+ days)
- **Admin panel** — create and delete teacher/student accounts
- **Tablet-first** — designed for classroom iPad use, fully responsive to desktop

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend + API | SvelteKit + TypeScript |
| Database + Auth | Supabase (PostgreSQL) |
| Hosting | Vercel |

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd primary-math
npm install
```

### 2. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com) (free tier)
2. Create a new project
3. In **Settings → API Keys**, copy the **Publishable key** (anon) and **Secret key** (service role)
4. In **Settings → JWT Keys**, copy the JWT-format keys (`eyJ...`) — use these in your `.env`

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

```
PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4. Run database migrations

In **Supabase → SQL Editor**, run each file in order:

1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_rls.sql`
3. `supabase/seed.sql`

Then grant table access:

```sql
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.student_progress, public.badges, public.streaks TO authenticated;
GRANT INSERT, DELETE ON public.users TO authenticated;
```

### 5. Create the admin account

In **Supabase → Authentication → Users**, add a user with email `admin@mathprimaire.local` and your chosen password.

Then in **SQL Editor**:

```sql
-- Confirm the email
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'admin@mathprimaire.local';

-- Create the profile
INSERT INTO public.users (id, username, role, language)
SELECT id, 'admin', 'admin', 'en'
FROM auth.users
WHERE email = 'admin@mathprimaire.local';
```

### 6. Start the dev server

```bash
npm run dev
```

Open `http://localhost:5173` (or the next available port). Log in with username `admin` and the password you set.

## User Roles

| Role | Can do |
|------|--------|
| **Admin** | Create/delete teachers and students, view all data |
| **Teacher** | View class dashboard, see student progress |
| **Student** | Practice lessons, earn badges, see leaderboard |

Login format: enter just the **username** (e.g. `admin`, `teacher1`, `student1`) — the app handles the rest.

## Deploying to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo
3. In **Environment Variables**, add:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy**

## Development

```bash
npm run dev        # start dev server
npm run build      # production build
npm run preview    # preview production build
npm run check      # TypeScript + Svelte type check
npm test           # run unit tests
```

## Project Structure

```
src/
  lib/
    components/     # TopBar, ProgressDots, ScoreRing, Confetti, Leaderboard
    i18n/           # en.ts, fr.ts, index.ts
    questions/      # generator.ts — algorithmic question generation
    server/         # supabaseAdmin.ts (service role, server-only)
    stores/         # auth.ts
    supabase.ts     # anon client
    types.ts        # shared TypeScript types
  routes/
    +page.svelte          # login
    +layout.svelte        # root layout with TopBar
    dashboard/            # student dashboard
    lesson/[id]/          # exercise screen + score screen
    teacher/              # teacher dashboard + student detail
    admin/                # admin panel + API routes
supabase/
  migrations/       # 001_schema.sql, 002_rls.sql
  seed.sql          # 60 lessons (30 per grade)
```
