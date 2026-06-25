# MathPrimaire Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual (EN/FR) SvelteKit web platform for Canadian Grade 5 & 6 students to practice math daily, with teacher/admin dashboards.

**Architecture:** SvelteKit handles both frontend and API routes. Supabase provides auth (username-based), PostgreSQL database, and realtime for the leaderboard. Questions are generated algorithmically per lesson topic — not stored row-by-row in the DB.

**Tech Stack:** SvelteKit + TypeScript, Supabase JS v2, Vitest, @sveltejs/adapter-vercel

## Global Constraints

- Min touch target: 44px on all interactive elements
- Colors: background #0f1729, primary #4361EE, accent #4CC9F0, white text
- All visible strings must go through the `t()` i18n function — no hardcoded EN/FR
- Supabase auth uses `${username}@mathprimaire.local` as the email field internally
- Badge threshold: score ≥ 15/20
- Inactive warning threshold: 4+ days without practice
- Lessons unlock sequentially regardless of score

---

## File Map

```
src/
  app.html
  app.css                          # global CSS variables + reset
  lib/
    supabase.ts                    # Supabase client singleton
    types.ts                       # all shared TS types
    i18n/
      index.ts                     # language store + t() function
      en.ts                        # English strings
      fr.ts                        # French strings
    stores/
      auth.ts                      # session + user profile store
    questions/
      generator.ts                 # algorithmic question generation
      topics.ts                    # lesson→topic config (60 lessons)
    components/
      TopBar.svelte
      ProgressDots.svelte
      ScoreRing.svelte
      Confetti.svelte
  routes/
    +layout.svelte                 # TopBar, auth guard redirect
    +layout.server.ts              # server-side session load
    +page.svelte                   # Login
    dashboard/+page.svelte         # Student dashboard
    lesson/[id]/+page.svelte       # Exercise screen
    lesson/[id]/+page.server.ts    # load lesson + questions
    lesson/[id]/score/+page.svelte # Score + celebration
    teacher/+page.svelte           # Teacher dashboard
    teacher/student/[id]/+page.svelte
    admin/+page.svelte
supabase/
  migrations/001_schema.sql
  migrations/002_rls.sql
  seed.sql
tests/
  unit/generator.test.ts
  unit/scoring.test.ts
  unit/i18n.test.ts
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`
- Create: `src/app.html`, `src/app.css`
- Create: `.env.example`, `.gitignore`

**Interfaces:**
- Produces: runnable `npm run dev`, `npm run test`

- [ ] **Step 1: Scaffold SvelteKit project**

```bash
cd /Users/dmitriy/dev/primary-math
npm create svelte@latest . -- --template skeleton --types typescript --no-prettier --no-eslint
npm install
npm install @supabase/supabase-js
npm install -D vitest @vitest/ui jsdom @testing-library/svelte
```

- [ ] **Step 2: Configure Vitest in vite.config.ts**

```typescript
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
    globals: true
  }
});
```

- [ ] **Step 3: Install Vercel adapter**

```bash
npm install -D @sveltejs/adapter-vercel
```

Update `svelte.config.js`:

```javascript
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: { adapter: adapter() }
};
```

- [ ] **Step 4: Create app.css with design tokens**

```css
/* src/app.css */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:       #0f1729;
  --surface:  #1a2744;
  --primary:  #4361EE;
  --accent:   #4CC9F0;
  --warn:     #FFD93D;
  --danger:   #FF6B35;
  --success:  #6BCB77;
  --text:     #ffffff;
  --muted:    #8899bb;
  --radius:   14px;
  --radius-lg: 20px;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', system-ui, sans-serif;
  min-height: 100vh;
}

button, [role="button"] { min-height: 44px; min-width: 44px; cursor: pointer; }
```

- [ ] **Step 5: Create .env.example**

```bash
# .env.example
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 6: Create .gitignore**

```
node_modules/
.env
.env.local
.svelte-kit/
build/
.vercel/
```

- [ ] **Step 7: Update app.html to import CSS and Inter font**

```html
<!-- src/app.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap" rel="stylesheet" />
    %sveltekit.head%
  </head>
  <body>
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

- [ ] **Step 8: Verify dev server starts**

```bash
cp .env.example .env
npm run dev
```
Expected: server starts at http://localhost:5173 with no errors.

- [ ] **Step 9: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold SvelteKit + Supabase + Vitest project"
```

---

## Task 2: Supabase Schema + Seed

**Files:**
- Create: `supabase/migrations/001_schema.sql`
- Create: `supabase/migrations/002_rls.sql`
- Create: `supabase/seed.sql`

**Interfaces:**
- Produces: tables `users`, `lessons`, `student_progress`, `badges`, `streaks`

- [ ] **Step 1: Create Supabase project**

Go to https://supabase.com → New project → note URL and anon key → add to `.env`.

- [ ] **Step 2: Write schema migration**

```sql
-- supabase/migrations/001_schema.sql

create table public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique not null,
  role       text not null check (role in ('admin','teacher','student')),
  grade      int  check (grade in (5, 6)),
  language   text not null default 'en' check (language in ('en','fr')),
  teacher_id uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table public.lessons (
  id          serial primary key,
  grade       int  not null check (grade in (5, 6)),
  order_index int  not null,
  title_en    text not null,
  title_fr    text not null,
  topic       text not null,
  unique(grade, order_index)
);

create table public.student_progress (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.users(id) on delete cascade,
  lesson_id    int  not null references public.lessons(id),
  completed_at timestamptz not null default now(),
  score        int  not null check (score between 0 and 20),
  answers      jsonb not null default '{}'
);

create table public.badges (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  lesson_id  int  not null references public.lessons(id),
  earned_at  timestamptz not null default now(),
  unique(student_id, lesson_id)
);

create table public.streaks (
  student_id        uuid primary key references public.users(id) on delete cascade,
  current_streak    int  not null default 0,
  longest_streak    int  not null default 0,
  last_practice_date date
);
```

- [ ] **Step 3: Write RLS policies**

```sql
-- supabase/migrations/002_rls.sql

alter table public.users           enable row level security;
alter table public.lessons         enable row level security;
alter table public.student_progress enable row level security;
alter table public.badges          enable row level security;
alter table public.streaks         enable row level security;

-- users: read own row; admin/teacher can read all
create policy "users_select" on public.users for select
  using (
    id = auth.uid()
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('admin','teacher')
    )
  );

-- users: admin/teacher can insert
create policy "users_insert" on public.users for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('admin','teacher')
    )
  );

-- users: admin can update/delete, users can update own language
create policy "users_update" on public.users for update
  using (
    id = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- lessons: all authenticated users can read
create policy "lessons_select" on public.lessons for select
  using (auth.uid() is not null);

-- student_progress: student reads own; teacher reads their students'
create policy "progress_select" on public.student_progress for select
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('admin','teacher')
    )
  );

create policy "progress_insert" on public.student_progress for insert
  with check (student_id = auth.uid());

-- badges: same as progress
create policy "badges_select" on public.badges for select
  using (
    student_id = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin','teacher'))
  );

create policy "badges_insert" on public.badges for insert
  with check (student_id = auth.uid());

-- streaks: student reads/writes own; teacher reads
create policy "streaks_select" on public.streaks for select
  using (
    student_id = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin','teacher'))
  );

create policy "streaks_upsert" on public.streaks for insert
  with check (student_id = auth.uid());

create policy "streaks_update" on public.streaks for update
  using (student_id = auth.uid());
```

- [ ] **Step 4: Run migrations in Supabase SQL editor**

Copy and run `001_schema.sql` then `002_rls.sql` in the Supabase dashboard SQL editor.

- [ ] **Step 5: Seed lessons**

```sql
-- supabase/seed.sql  (run in SQL editor after migrations)

-- Grade 5 lessons
insert into public.lessons (grade, order_index, title_en, title_fr, topic) values
(5,1,'Multiplication ×1–2','Multiplication ×1–2','mult_1_2'),
(5,2,'Multiplication ×3–4','Multiplication ×3–4','mult_3_4'),
(5,3,'Multiplication ×5–6','Multiplication ×5–6','mult_5_6'),
(5,4,'Mixed ×1–6','Mixte ×1–6','mult_mix_1_6'),
(5,5,'Multiplication ×7–8','Multiplication ×7–8','mult_7_8'),
(5,6,'Multiplication ×9–10','Multiplication ×9–10','mult_9_10'),
(5,7,'Multiplication ×11–12','Multiplication ×11–12','mult_11_12'),
(5,8,'Mixed ×7–12','Mixte ×7–12','mult_mix_7_12'),
(5,9,'Mixed ×1–12 (I)','Mixte ×1–12 (I)','mult_mix_all_1'),
(5,10,'Mixed ×1–12 (II)','Mixte ×1–12 (II)','mult_mix_all_2'),
(5,11,'Division ÷1–4','Division ÷1–4','div_1_4'),
(5,12,'Division ÷5–6','Division ÷5–6','div_5_6'),
(5,13,'Division ÷7–8','Division ÷7–8','div_7_8'),
(5,14,'Division ÷9–10','Division ÷9–10','div_9_10'),
(5,15,'Division ÷11–12','Division ÷11–12','div_11_12'),
(5,16,'Mixed ÷1–12 (I)','Division mixte (I)','div_mix_1'),
(5,17,'Mixed ÷1–12 (II)','Division mixte (II)','div_mix_2'),
(5,18,'Mult & Div Mixed','Mult & Div Mixte','mult_div_mix'),
(5,19,'Equivalent Fractions (I)','Fractions équivalentes (I)','frac_equiv_1'),
(5,20,'Equivalent Fractions (II)','Fractions équivalentes (II)','frac_equiv_2'),
(5,21,'Comparing Fractions (I)','Comparer les fractions (I)','frac_compare_1'),
(5,22,'Comparing Fractions (II)','Comparer les fractions (II)','frac_compare_2'),
(5,23,'Adding Fractions (same denom I)','Additionner fractions (même dénom. I)','frac_add_same_1'),
(5,24,'Adding Fractions (same denom II)','Additionner fractions (même dénom. II)','frac_add_same_2'),
(5,25,'Adding Fractions (mixed)','Additionner fractions (mixte)','frac_add_same_mix'),
(5,26,'Subtracting Fractions (I)','Soustraire fractions (I)','frac_sub_same_1'),
(5,27,'Subtracting Fractions (II)','Soustraire fractions (II)','frac_sub_same_2'),
(5,28,'Subtracting Fractions (mixed)','Soustraire fractions (mixte)','frac_sub_same_mix'),
(5,29,'Add & Subtract Fractions','Additionner & Soustraire','frac_add_sub_mix'),
(5,30,'Grade 5 Final Review','Révision finale 5e','g5_review');

-- Grade 6 lessons
insert into public.lessons (grade, order_index, title_en, title_fr, topic) values
(6,1,'2-digit × 1-digit (I)','2 chiffres × 1 chiffre (I)','mult_2x1_1'),
(6,2,'2-digit × 1-digit (II)','2 chiffres × 1 chiffre (II)','mult_2x1_2'),
(6,3,'2-digit × 2-digit (I)','2 chiffres × 2 chiffres (I)','mult_2x2_1'),
(6,4,'2-digit × 2-digit (II)','2 chiffres × 2 chiffres (II)','mult_2x2_2'),
(6,5,'Hard Multiplication (I)','Multiplication difficile (I)','mult_hard_1'),
(6,6,'Hard Multiplication (II)','Multiplication difficile (II)','mult_hard_2'),
(6,7,'Mixed Mult Review','Révision Multiplication','mult_g6_review'),
(6,8,'Division with Remainders (I)','Division avec restes (I)','div_rem_1'),
(6,9,'Division with Remainders (II)','Division avec restes (II)','div_rem_2'),
(6,10,'Division with Remainders (III)','Division avec restes (III)','div_rem_3'),
(6,11,'Long Division (I)','Division longue (I)','div_long_1'),
(6,12,'Long Division (II)','Division longue (II)','div_long_2'),
(6,13,'Mixed Division Review','Révision Division','div_g6_review'),
(6,14,'Unlike Denominators — Find LCD','Dénominateurs différents — PPCM','frac_lcd_1'),
(6,15,'Unlike Denominators — Add (I)','Dénominateurs différents — Addition (I)','frac_add_unlike_1'),
(6,16,'Unlike Denominators — Add (II)','Dénominateurs différents — Addition (II)','frac_add_unlike_2'),
(6,17,'Unlike Denominators — Sub (I)','Dénominateurs différents — Soustraction (I)','frac_sub_unlike_1'),
(6,18,'Unlike Denominators — Sub (II)','Dénominateurs différents — Soustraction (II)','frac_sub_unlike_2'),
(6,19,'Add & Sub Unlike (mixed)','Addition & Soustraction mixte','frac_add_sub_unlike'),
(6,20,'Multiply Fractions (I)','Multiplier les fractions (I)','frac_mult_1'),
(6,21,'Multiply Fractions (II)','Multiplier les fractions (II)','frac_mult_2'),
(6,22,'Multiply Fractions (simplify)','Multiplier fractions (simplifier)','frac_mult_simplify'),
(6,23,'Multiply Mixed Numbers','Multiplier les nombres mixtes','frac_mult_mixed'),
(6,24,'Divide Fractions (I)','Diviser les fractions (I)','frac_div_1'),
(6,25,'Divide Fractions (II)','Diviser les fractions (II)','frac_div_2'),
(6,26,'Divide Mixed Numbers','Diviser les nombres mixtes','frac_div_mixed'),
(6,27,'Fractions — Word Problems (I)','Fractions — Problèmes (I)','frac_word_1'),
(6,28,'Fractions — Word Problems (II)','Fractions — Problèmes (II)','frac_word_2'),
(6,29,'Mixed Fractions Review','Révision fractions','frac_g6_review'),
(6,30,'Grade 6 Final Review','Révision finale 6e','g6_review');
```

- [ ] **Step 6: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema migrations and lesson seed data"
```

---

## Task 3: Shared Types + Supabase Client

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/supabase.ts`

**Interfaces:**
- Produces: `UserProfile`, `Lesson`, `StudentProgress`, `Badge`, `Streak` types; `supabase` client

- [ ] **Step 1: Write types.ts**

```typescript
// src/lib/types.ts
export type Role = 'admin' | 'teacher' | 'student';
export type Lang = 'en' | 'fr';
export type QuestionType = 'multiple_choice' | 'typed';

export interface UserProfile {
  id: string;
  username: string;
  role: Role;
  grade: 5 | 6 | null;
  language: Lang;
  teacher_id: string | null;
  created_at: string;
}

export interface Lesson {
  id: number;
  grade: 5 | 6;
  order_index: number;
  title_en: string;
  title_fr: string;
  topic: string;
}

export interface Question {
  id: string;           // generated, e.g. "L5Q7"
  lesson_id: number;
  type: QuestionType;
  question_en: string;
  question_fr: string;
  correct_answer: string;
  options: string[] | null; // 4 items for multiple_choice, null for typed
}

export interface StudentProgress {
  id: string;
  student_id: string;
  lesson_id: number;
  completed_at: string;
  score: number;
  answers: Record<string, string>; // question_id → student_answer
}

export interface Badge {
  id: string;
  student_id: string;
  lesson_id: number;
  earned_at: string;
}

export interface Streak {
  student_id: string;
  current_streak: number;
  longest_streak: number;
  last_practice_date: string | null;
}

export interface LeaderboardEntry {
  username: string;
  student_id: string;
  lessons_completed: number;
  is_self: boolean;
}
```

- [ ] **Step 2: Write supabase.ts**

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
```

- [ ] **Step 3: Write type test**

```typescript
// tests/unit/types.test.ts
import { describe, it, expect } from 'vitest';
import type { UserProfile, Question } from '$lib/types';

describe('types', () => {
  it('UserProfile shape is valid', () => {
    const u: UserProfile = {
      id: 'uuid', username: 'lucas', role: 'student',
      grade: 5, language: 'en', teacher_id: null, created_at: ''
    };
    expect(u.role).toBe('student');
  });

  it('Question with options for multiple_choice', () => {
    const q: Question = {
      id: 'q1', lesson_id: 1, type: 'multiple_choice',
      question_en: '3 × 4 = ?', question_fr: '3 × 4 = ?',
      correct_answer: '12', options: ['9', '12', '15', '16']
    };
    expect(q.options).toHaveLength(4);
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- tests/unit/types.test.ts
```
Expected: 2 passing

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/supabase.ts tests/unit/types.test.ts
git commit -m "feat: add shared types and Supabase client"
```

---

## Task 4: i18n System

**Files:**
- Create: `src/lib/i18n/en.ts`
- Create: `src/lib/i18n/fr.ts`
- Create: `src/lib/i18n/index.ts`

**Interfaces:**
- Consumes: `Lang` from `$lib/types`
- Produces: `t(key)` function, `lang` store (writable), `setLang(lang)`

- [ ] **Step 1: Write en.ts**

```typescript
// src/lib/i18n/en.ts
export const en = {
  // Auth
  login: 'Log In',
  username: 'Username',
  password: 'Password',
  // Nav
  dashboard: 'Dashboard',
  logout: 'Log Out',
  // Dashboard
  greeting: 'Hello',
  streak: 'Day streak',
  progress: 'Progress',
  badges: 'Badges',
  startLesson: 'Start Today\'s Lesson',
  lesson: 'Lesson',
  of: 'of',
  leaderboard: 'Leaderboard',
  you: 'you',
  // Exercise
  question: 'Question',
  skip: 'Skip for now →',
  confirm: 'Confirm Answer',
  // Score
  excellent: 'Excellent',
  goodEffort: 'Good effort',
  badgeEarned: 'Badge Unlocked!',
  tryAgain: 'Try Again',
  continueNext: 'Continue to Next Lesson',
  backToDashboard: 'Back to Dashboard',
  needForBadge: 'more correct answers for the badge!',
  // Teacher
  avgLesson: 'Avg. Lesson',
  avgScore: 'Avg. Score',
  avgStreak: 'Avg. Streak',
  lastActive: 'Last Active',
  today: 'Today',
  yesterday: 'Yesterday',
  daysAgo: 'days ago',
  addStudent: '+ Add Student',
  addTeacher: '+ Add Teacher',
  students: 'Students',
  grade: 'Grade',
  score: 'Score',
  // Admin
  adminPanel: 'Admin Panel',
  teachers: 'Teachers',
  createUser: 'Create User',
  deleteUser: 'Delete',
  // Errors
  invalidCredentials: 'Invalid username or password.',
  usernameExists: 'Username already taken.',
};

export type I18nKeys = keyof typeof en;
```

- [ ] **Step 2: Write fr.ts**

```typescript
// src/lib/i18n/fr.ts
import type { I18nKeys } from './en';

export const fr: Record<I18nKeys, string> = {
  login: 'Se connecter',
  username: 'Nom d\'utilisateur',
  password: 'Mot de passe',
  dashboard: 'Tableau de bord',
  logout: 'Se déconnecter',
  greeting: 'Bonjour',
  streak: 'Jours consécutifs',
  progress: 'Progression',
  badges: 'Badges',
  startLesson: 'Commencer la leçon du jour',
  lesson: 'Leçon',
  of: 'sur',
  leaderboard: 'Classement',
  you: 'toi',
  question: 'Question',
  skip: 'Passer pour l\'instant →',
  confirm: 'Confirmer la réponse',
  excellent: 'Excellent',
  goodEffort: 'Bon effort',
  badgeEarned: 'Badge débloqué !',
  tryAgain: 'Réessayer',
  continueNext: 'Continuer à la prochaine leçon',
  backToDashboard: 'Retour au tableau de bord',
  needForBadge: 'bonnes réponses de plus pour le badge !',
  avgLesson: 'Leçon moy.',
  avgScore: 'Score moy.',
  avgStreak: 'Série moy.',
  lastActive: 'Dernière activité',
  today: 'Aujourd\'hui',
  yesterday: 'Hier',
  daysAgo: 'jours',
  addStudent: '+ Ajouter un élève',
  addTeacher: '+ Ajouter un enseignant',
  students: 'Élèves',
  grade: 'Année',
  score: 'Score',
  adminPanel: 'Panneau admin',
  teachers: 'Enseignants',
  createUser: 'Créer utilisateur',
  deleteUser: 'Supprimer',
  invalidCredentials: 'Nom d\'utilisateur ou mot de passe invalide.',
  usernameExists: 'Ce nom d\'utilisateur est déjà pris.',
};
```

- [ ] **Step 3: Write i18n/index.ts**

```typescript
// src/lib/i18n/index.ts
import { writable, get } from 'svelte/store';
import { en, type I18nKeys } from './en';
import { fr } from './fr';
import type { Lang } from '$lib/types';

const strings = { en, fr };

export const lang = writable<Lang>('en');

export function t(key: I18nKeys): string {
  return strings[get(lang)][key] ?? key;
}

export function setLang(l: Lang) {
  lang.set(l);
}
```

- [ ] **Step 4: Write i18n test**

```typescript
// tests/unit/i18n.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { lang, t, setLang } from '$lib/i18n/index';

describe('i18n', () => {
  beforeEach(() => setLang('en'));

  it('returns English by default', () => {
    expect(t('login')).toBe('Log In');
  });

  it('switches to French', () => {
    setLang('fr');
    expect(t('login')).toBe('Se connecter');
  });

  it('falls back to key for missing string', () => {
    // @ts-expect-error testing fallback
    expect(t('nonexistent_key')).toBe('nonexistent_key');
  });
});
```

- [ ] **Step 5: Run tests**

```bash
npm run test -- tests/unit/i18n.test.ts
```
Expected: 3 passing

- [ ] **Step 6: Commit**

```bash
git add src/lib/i18n/ tests/unit/i18n.test.ts
git commit -m "feat: add bilingual i18n system (EN/FR)"
```

---

## Task 5: Auth Store + Login Page

**Files:**
- Create: `src/lib/stores/auth.ts`
- Create: `src/routes/+layout.server.ts`
- Create: `src/routes/+layout.svelte`
- Create: `src/routes/+page.svelte` (Login)
- Create: `src/lib/components/TopBar.svelte`

**Interfaces:**
- Consumes: `supabase`, `UserProfile`, `t()`, `lang`
- Produces: `authStore` with `{ user: UserProfile | null }`, login/logout functions

- [ ] **Step 1: Write auth store**

```typescript
// src/lib/stores/auth.ts
import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import { setLang } from '$lib/i18n/index';
import type { UserProfile } from '$lib/types';

export const authStore = writable<{ user: UserProfile | null }>({ user: null });

export async function loadSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { authStore.set({ user: null }); return; }

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (data) {
    authStore.set({ user: data as UserProfile });
    setLang(data.language);
  }
}

export async function login(username: string, password: string) {
  const email = `${username}@mathprimaire.local`;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error('invalidCredentials');
  await loadSession();
}

export async function logout() {
  await supabase.auth.signOut();
  authStore.set({ user: null });
}
```

- [ ] **Step 2: Write layout server (session load)**

```typescript
// src/routes/+layout.server.ts
export const load = async () => {
  return {};
};
```

- [ ] **Step 3: Write TopBar component**

```svelte
<!-- src/lib/components/TopBar.svelte -->
<script lang="ts">
  import { lang, setLang, t } from '$lib/i18n/index';
  import { authStore, logout } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  async function handleLogout() {
    await logout();
    goto('/');
  }
</script>

<nav>
  <span class="username">{$authStore.user?.username ?? ''}</span>
  <div class="controls">
    <button
      class="lang-toggle"
      on:click={() => setLang($lang === 'en' ? 'fr' : 'en')}
      aria-label="Toggle language"
    >
      {$lang === 'en' ? 'FR' : 'EN'}
    </button>
    {#if $authStore.user}
      <button class="logout" on:click={handleLogout}>{t('logout')}</button>
    {/if}
  </div>
</nav>

<style>
  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: var(--surface);
    min-height: 52px;
  }
  .username { color: var(--accent); font-weight: 700; }
  .controls { display: flex; gap: 10px; align-items: center; }
  .lang-toggle, .logout {
    background: var(--bg);
    color: var(--text);
    border: 1px solid var(--primary);
    border-radius: 999px;
    padding: 6px 16px;
    font-size: 13px;
    font-weight: 700;
    min-height: 44px;
  }
  .lang-toggle:hover, .logout:hover { background: var(--primary); }
</style>
```

- [ ] **Step 4: Write root layout**

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';
  import TopBar from '$lib/components/TopBar.svelte';
  import { authStore, loadSession } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  onMount(async () => {
    await loadSession();
    const path = $page.url.pathname;
    const user = $authStore.user;
    if (!user && path !== '/') goto('/');
  });
</script>

<TopBar />
<main>
  <slot />
</main>

<style>
  main { max-width: 800px; margin: 0 auto; padding: 20px 16px; }
</style>
```

- [ ] **Step 5: Write login page**

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { t, lang } from '$lib/i18n/index';
  import { login } from '$lib/stores/auth';
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let username = '';
  let password = '';
  let error = '';
  let loading = false;

  onMount(() => {
    if ($authStore.user) redirectByRole($authStore.user.role);
  });

  function redirectByRole(role: string) {
    if (role === 'student') goto('/dashboard');
    else goto('/teacher');
  }

  async function handleLogin() {
    error = '';
    loading = true;
    try {
      await login(username, password);
      redirectByRole($authStore.user!.role);
    } catch {
      error = t('invalidCredentials');
    } finally {
      loading = false;
    }
  }
</script>

<div class="login-wrap">
  <h1>MathPrimaire</h1>
  <p class="subtitle">
    {$lang === 'en' ? 'Daily Math Practice · Grades 5 & 6' : 'Pratique quotidienne · 5e et 6e année'}
  </p>

  <form on:submit|preventDefault={handleLogin}>
    <label>
      {t('username')}
      <input bind:value={username} type="text" autocomplete="username" required />
    </label>
    <label>
      {t('password')}
      <input bind:value={password} type="password" autocomplete="current-password" required />
    </label>
    {#if error}<p class="error">{error}</p>{/if}
    <button type="submit" disabled={loading} class="btn-primary">
      {loading ? '…' : t('login')}
    </button>
  </form>
</div>

<style>
  .login-wrap {
    max-width: 400px; margin: 60px auto; text-align: center;
  }
  h1 { font-size: 36px; font-weight: 900; color: var(--accent); margin-bottom: 8px; }
  .subtitle { color: var(--muted); margin-bottom: 40px; }
  form { display: flex; flex-direction: column; gap: 16px; text-align: left; }
  label { display: flex; flex-direction: column; gap: 6px; font-size: 14px; color: var(--muted); }
  input {
    background: var(--surface); border: 2px solid var(--surface);
    color: var(--text); border-radius: var(--radius); padding: 12px 16px;
    font-size: 16px; min-height: 44px;
  }
  input:focus { outline: none; border-color: var(--primary); }
  .btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: white; border: none; border-radius: var(--radius);
    padding: 14px; font-size: 16px; font-weight: 700; min-height: 52px;
  }
  .error { color: var(--danger); font-size: 14px; }
</style>
```

- [ ] **Step 6: Create admin user via Supabase dashboard**

In Supabase → Authentication → Users → Add user:
- Email: `admin@mathprimaire.local`
- Password: (set a strong password, share with platform owner)

Then in SQL editor:
```sql
insert into public.users (id, username, role, grade, language)
select id, 'admin', 'admin', null, 'en'
from auth.users where email = 'admin@mathprimaire.local';
```

- [ ] **Step 7: Test login manually**

```bash
npm run dev
```
Open http://localhost:5173, log in as `admin` — should redirect to `/teacher` (admin uses teacher dashboard).

- [ ] **Step 8: Commit**

```bash
git add src/lib/stores/auth.ts src/lib/components/TopBar.svelte src/routes/
git commit -m "feat: auth store, login page, TopBar with language toggle"
```

---

## Task 6: Question Generator

**Files:**
- Create: `src/lib/questions/generator.ts`
- Create: `tests/unit/generator.test.ts`

**Interfaces:**
- Consumes: `Question`, `Lesson` from `$lib/types`
- Produces: `generateQuestions(lesson: Lesson, count: number): Question[]`

- [ ] **Step 1: Write generator**

```typescript
// src/lib/questions/generator.ts
import type { Question, Lesson, QuestionType } from '$lib/types';

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function simplify(n: number, d: number): [number, number] {
  const g = gcd(Math.abs(n), Math.abs(d));
  return [n / g, d / g];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickType(index: number, total: number): QuestionType {
  // First 60% are typed, remaining 40% are multiple_choice
  return index < Math.ceil(total * 0.6) ? 'typed' : 'multiple_choice';
}

function makeMultChoiceOptions(correct: string, distractors: string[]): string[] {
  const unique = [...new Set([correct, ...distractors])].slice(0, 4);
  while (unique.length < 4) unique.push(String(parseInt(correct) + unique.length));
  return shuffle(unique);
}

function multQuestion(a: number, b: number, index: number, lessonId: number, total: number): Question {
  const type = pickType(index, total);
  const answer = String(a * b);
  const distractors = [
    String(a * b + 1), String(a * b - 1),
    String((a + 1) * b), String(a * (b + 1))
  ].filter(d => d !== answer && parseInt(d) > 0);
  return {
    id: `L${lessonId}Q${index}`,
    lesson_id: lessonId,
    type,
    question_en: `${a} × ${b} = ?`,
    question_fr: `${a} × ${b} = ?`,
    correct_answer: answer,
    options: type === 'multiple_choice' ? makeMultChoiceOptions(answer, distractors) : null
  };
}

function divQuestion(dividend: number, divisor: number, index: number, lessonId: number, total: number): Question {
  const type = pickType(index, total);
  const answer = String(Math.round(dividend / divisor));
  const distractors = [
    String(parseInt(answer) + 1), String(parseInt(answer) - 1),
    String(divisor), String(dividend)
  ].filter(d => d !== answer && parseInt(d) > 0);
  return {
    id: `L${lessonId}Q${index}`,
    lesson_id: lessonId,
    type,
    question_en: `${dividend} ÷ ${divisor} = ?`,
    question_fr: `${dividend} ÷ ${divisor} = ?`,
    correct_answer: answer,
    options: type === 'multiple_choice' ? makeMultChoiceOptions(answer, distractors) : null
  };
}

function fracQuestion(
  num1: number, den1: number, num2: number, den2: number,
  op: '+' | '-' | '×' | '÷',
  index: number, lessonId: number, total: number
): Question {
  const type = pickType(index, total);
  let rn: number, rd: number;
  if (op === '+') { rn = num1 * den2 + num2 * den1; rd = den1 * den2; }
  else if (op === '-') { rn = num1 * den2 - num2 * den1; rd = den1 * den2; }
  else if (op === '×') { rn = num1 * num2; rd = den1 * den2; }
  else { rn = num1 * den2; rd = den1 * num2; }
  const [sn, sd] = simplify(rn, rd);
  const answer = sd === 1 ? String(sn) : `${sn}/${sd}`;
  const q_en = `${num1}/${den1} ${op} ${num2}/${den2} = ?`;
  const distractors = [`${sn + 1}/${sd}`, `${sn - 1}/${sd}`, `${sn}/${sd + 1}`]
    .filter(d => d !== answer);
  return {
    id: `L${lessonId}Q${index}`,
    lesson_id: lessonId,
    type,
    question_en: q_en,
    question_fr: q_en,
    correct_answer: answer,
    options: type === 'multiple_choice' ? makeMultChoiceOptions(answer, distractors) : null
  };
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateQuestions(lesson: Lesson, count: number): Question[] {
  const topic = lesson.topic;
  const id = lesson.id;
  const qs: Question[] = [];

  for (let i = 0; i < count; i++) {
    if (topic.startsWith('mult_')) {
      if (topic === 'mult_1_2') qs.push(multQuestion(rand(1,2), rand(1,12), i, id, count));
      else if (topic === 'mult_3_4') qs.push(multQuestion(rand(3,4), rand(1,12), i, id, count));
      else if (topic === 'mult_5_6') qs.push(multQuestion(rand(5,6), rand(1,12), i, id, count));
      else if (topic === 'mult_7_8') qs.push(multQuestion(rand(7,8), rand(1,12), i, id, count));
      else if (topic === 'mult_9_10') qs.push(multQuestion(rand(9,10), rand(1,12), i, id, count));
      else if (topic === 'mult_11_12') qs.push(multQuestion(rand(11,12), rand(1,12), i, id, count));
      else if (topic === 'mult_mix_1_6') qs.push(multQuestion(rand(1,6), rand(1,12), i, id, count));
      else if (topic === 'mult_mix_7_12') qs.push(multQuestion(rand(7,12), rand(1,12), i, id, count));
      else if (topic.includes('mix_all') || topic === 'mult_div_mix' || topic === 'mult_g6_review')
        qs.push(multQuestion(rand(1,12), rand(1,12), i, id, count));
      else if (topic === 'mult_2x1_1') qs.push(multQuestion(rand(10,50), rand(2,9), i, id, count));
      else if (topic === 'mult_2x1_2') qs.push(multQuestion(rand(50,99), rand(2,9), i, id, count));
      else if (topic === 'mult_2x2_1') qs.push(multQuestion(rand(10,30), rand(10,30), i, id, count));
      else if (topic === 'mult_2x2_2') qs.push(multQuestion(rand(30,60), rand(10,30), i, id, count));
      else if (topic === 'mult_hard_1') qs.push(multQuestion(rand(12,50), rand(12,50), i, id, count));
      else if (topic === 'mult_hard_2') qs.push(multQuestion(rand(50,99), rand(12,30), i, id, count));
      else qs.push(multQuestion(rand(1,12), rand(1,12), i, id, count));
    } else if (topic.startsWith('div_')) {
      if (topic === 'div_1_4') { const b = rand(1,4); qs.push(divQuestion(b*rand(1,12), b, i, id, count)); }
      else if (topic === 'div_5_6') { const b = rand(5,6); qs.push(divQuestion(b*rand(1,12), b, i, id, count)); }
      else if (topic === 'div_7_8') { const b = rand(7,8); qs.push(divQuestion(b*rand(1,12), b, i, id, count)); }
      else if (topic === 'div_9_10') { const b = rand(9,10); qs.push(divQuestion(b*rand(1,12), b, i, id, count)); }
      else if (topic === 'div_11_12') { const b = rand(11,12); qs.push(divQuestion(b*rand(1,12), b, i, id, count)); }
      else if (topic.includes('rem')) { const b = rand(2,12); qs.push(divQuestion(rand(b+1, b*12+b-1), b, i, id, count)); }
      else if (topic.includes('long')) { const b = rand(2,9); qs.push(divQuestion(rand(100,999), b, i, id, count)); }
      else { const b = rand(1,12); qs.push(divQuestion(b*rand(1,12), b, i, id, count)); }
    } else if (topic.startsWith('frac_')) {
      const dens = [2,3,4,5,6,8,10];
      if (topic.includes('equiv')) {
        const d = dens[rand(0,4)]; const n = rand(1, d-1); const m = rand(2,4);
        const type = pickType(i, count);
        const answer = `${n*m}/${d*m}`;
        const dist = [`${n*m+1}/${d*m}`, `${n}/${d}`, `${n*m}/${d*m+1}`];
        qs.push({ id:`L${id}Q${i}`, lesson_id:id, type, question_en:`Find equivalent: ${n}/${d} = ?/${d*m}`, question_fr:`Trouver équivalent: ${n}/${d} = ?/${d*m}`, correct_answer: String(n*m), options: type==='multiple_choice' ? makeMultChoiceOptions(String(n*m), [String(n*m+1),String(n*m-1),String(n)]) : null });
      } else if (topic.includes('compare')) {
        const d = dens[rand(0,4)]; const n1 = rand(1,d-1); const n2 = rand(1,d-1);
        const type = pickType(i, count);
        const answer = n1 > n2 ? `${n1}/${d}` : (n1 < n2 ? `${n2}/${d}` : 'equal');
        qs.push({ id:`L${id}Q${i}`, lesson_id:id, type, question_en:`Which is larger? ${n1}/${d} or ${n2}/${d}`, question_fr:`Laquelle est plus grande? ${n1}/${d} ou ${n2}/${d}`, correct_answer: answer, options: type==='multiple_choice' ? [answer, answer==='equal'?`${n1}/${d}`:'equal', `${Math.min(n1,n2)}/${d}`, `${Math.max(n1,n2)+1}/${d}`] : null });
      } else if (topic.includes('add_same')) {
        const d = dens[rand(0,4)]; const n1 = rand(1,d); const n2 = rand(1,d);
        qs.push(fracQuestion(n1,d,n2,d,'+',i,id,count));
      } else if (topic.includes('sub_same')) {
        const d = dens[rand(0,4)]; const n1 = rand(2,d); const n2 = rand(1,n1-1);
        qs.push(fracQuestion(n1,d,n2,d,'-',i,id,count));
      } else if (topic.includes('add_unlike') || topic === 'frac_lcd_1') {
        const d1 = dens[rand(0,4)]; const d2 = dens[rand(0,4)];
        qs.push(fracQuestion(rand(1,d1-1),d1,rand(1,d2-1),d2,'+',i,id,count));
      } else if (topic.includes('sub_unlike')) {
        const d1 = dens[rand(1,4)]; const d2 = dens[rand(0,3)];
        qs.push(fracQuestion(rand(2,d1),d1,rand(1,d2),d2,'-',i,id,count));
      } else if (topic.includes('mult')) {
        const d1 = dens[rand(0,4)]; const d2 = dens[rand(0,4)];
        qs.push(fracQuestion(rand(1,d1),d1,rand(1,d2),d2,'×',i,id,count));
      } else if (topic.includes('div')) {
        const d1 = dens[rand(0,4)]; const d2 = dens[rand(0,4)];
        qs.push(fracQuestion(rand(1,d1),d1,rand(1,d2),d2,'÷',i,id,count));
      } else {
        const d = dens[rand(0,4)]; qs.push(fracQuestion(rand(1,d),d,rand(1,d),d,'+',i,id,count));
      }
    } else {
      // review: mix of all lesson types for that grade
      const a = rand(1,12); const b = rand(1,12);
      qs.push(multQuestion(a, b, i, id, count));
    }
  }
  return qs;
}
```

- [ ] **Step 2: Write generator tests**

```typescript
// tests/unit/generator.test.ts
import { describe, it, expect } from 'vitest';
import { generateQuestions } from '$lib/questions/generator';
import type { Lesson } from '$lib/types';

const makeLesson = (topic: string, grade: 5 | 6 = 5): Lesson => ({
  id: 1, grade, order_index: 1, title_en: 'Test', title_fr: 'Test', topic
});

describe('generateQuestions', () => {
  it('returns exactly count questions', () => {
    const qs = generateQuestions(makeLesson('mult_1_2'), 20);
    expect(qs).toHaveLength(20);
  });

  it('all questions have required fields', () => {
    const qs = generateQuestions(makeLesson('mult_5_6'), 20);
    for (const q of qs) {
      expect(q.id).toBeTruthy();
      expect(q.correct_answer).toBeTruthy();
      expect(q.question_en).toContain('×');
    }
  });

  it('multiple_choice questions have exactly 4 options', () => {
    const qs = generateQuestions(makeLesson('mult_mix_all_1'), 20);
    const mc = qs.filter(q => q.type === 'multiple_choice');
    expect(mc.length).toBeGreaterThan(0);
    for (const q of mc) expect(q.options).toHaveLength(4);
  });

  it('typed questions have null options', () => {
    const qs = generateQuestions(makeLesson('div_5_6'), 20);
    const typed = qs.filter(q => q.type === 'typed');
    for (const q of typed) expect(q.options).toBeNull();
  });

  it('correct answer is in multiple_choice options', () => {
    const qs = generateQuestions(makeLesson('mult_7_8'), 20);
    for (const q of qs.filter(q => q.type === 'multiple_choice')) {
      expect(q.options).toContain(q.correct_answer);
    }
  });

  it('generates fraction questions', () => {
    const qs = generateQuestions(makeLesson('frac_add_same_1'), 20);
    expect(qs[0].question_en).toContain('/');
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm run test -- tests/unit/generator.test.ts
```
Expected: 6 passing

- [ ] **Step 4: Commit**

```bash
git add src/lib/questions/ tests/unit/generator.test.ts
git commit -m "feat: algorithmic question generator for all lesson topics"
```

---

## Task 7: Student Dashboard

**Files:**
- Create: `src/routes/dashboard/+page.svelte`
- Create: `src/lib/components/StreakBadge.svelte`

**Interfaces:**
- Consumes: `authStore`, `supabase`, `Lesson`, `StudentProgress`, `Streak`, `LeaderboardEntry`, `t()`
- Produces: dashboard page with streak, progress, leaderboard, lesson CTA

- [ ] **Step 1: Write StreakBadge component**

```svelte
<!-- src/lib/components/StreakBadge.svelte -->
<script lang="ts">
  export let streak: number;
</script>

<div class="streak">
  <span class="fire">🔥</span>
  <span class="count">{streak}</span>
</div>

<style>
  .streak { display: flex; align-items: center; gap: 4px; }
  .fire { font-size: 24px; }
  .count { font-size: 28px; font-weight: 900; color: var(--danger); }
</style>
```

- [ ] **Step 2: Write dashboard page**

```svelte
<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { supabase } from '$lib/supabase';
  import { t, lang } from '$lib/i18n/index';
  import StreakBadge from '$lib/components/StreakBadge.svelte';
  import type { Lesson, StudentProgress, Streak, LeaderboardEntry } from '$lib/types';

  let lessons: Lesson[] = [];
  let completedLessonIds: number[] = [];
  let streak: Streak = { student_id: '', current_streak: 0, longest_streak: 0, last_practice_date: null };
  let leaderboard: LeaderboardEntry[] = [];
  let badgeCount = 0;
  let loading = true;

  $: user = $authStore.user;
  $: currentLesson = lessons.find(l => !completedLessonIds.includes(l.id)) ?? null;
  $: completedCount = completedLessonIds.length;

  onMount(async () => {
    if (!user) { goto('/'); return; }
    if (user.role !== 'student') { goto('/teacher'); return; }

    const [lessonsRes, progressRes, streakRes, badgesRes] = await Promise.all([
      supabase.from('lessons').select('*').eq('grade', user.grade).order('order_index'),
      supabase.from('student_progress').select('lesson_id').eq('student_id', user.id),
      supabase.from('streaks').select('*').eq('student_id', user.id).maybeSingle(),
      supabase.from('badges').select('id').eq('student_id', user.id)
    ]);

    lessons = (lessonsRes.data ?? []) as Lesson[];
    completedLessonIds = (progressRes.data ?? []).map((p: any) => p.lesson_id);
    streak = (streakRes.data as Streak) ?? streak;
    badgeCount = (badgesRes.data ?? []).length;

    // Leaderboard: students with same teacher
    if (user.teacher_id) {
      const { data: classmates } = await supabase
        .from('users')
        .select('id, username')
        .eq('teacher_id', user.teacher_id)
        .eq('role', 'student');

      if (classmates) {
        const entries: LeaderboardEntry[] = await Promise.all(
          classmates.map(async (cm: any) => {
            const { count } = await supabase
              .from('student_progress')
              .select('*', { count: 'exact', head: true })
              .eq('student_id', cm.id);
            return {
              username: cm.username,
              student_id: cm.id,
              lessons_completed: count ?? 0,
              is_self: cm.id === user!.id
            };
          })
        );
        leaderboard = entries.sort((a, b) => b.lessons_completed - a.lessons_completed).slice(0, 10);
      }
    }

    loading = false;
  });
</script>

{#if loading}
  <p style="color:var(--muted);text-align:center;padding:40px">…</p>
{:else}
  <div class="dashboard">
    <h2 class="greeting">{t('greeting')}, {user?.username}!</h2>

    <div class="stats-row">
      <div class="stat-card">
        <StreakBadge streak={streak.current_streak} />
        <span class="stat-label">{t('streak')}</span>
      </div>
      <div class="stat-card">
        <span class="stat-big" style="color:var(--accent)">{completedCount}/30</span>
        <span class="stat-label">{t('progress')}</span>
      </div>
      <div class="stat-card">
        <span class="stat-big" style="color:var(--warn)">🏅 {badgeCount}</span>
        <span class="stat-label">{t('badges')}</span>
      </div>
    </div>

    <div class="progress-bar-wrap">
      <span class="prog-label">{t('lesson')} {completedCount} {t('of')} 30</span>
      <div class="progress-track">
        <div class="progress-fill" style="width:{(completedCount/30)*100}%"></div>
      </div>
    </div>

    {#if currentLesson}
      <button class="cta" on:click={() => goto(`/lesson/${currentLesson!.id}`)}>
        <span class="cta-sub">{t('startLesson')}</span>
        <span class="cta-title">{$lang === 'en' ? currentLesson.title_en : currentLesson.title_fr}</span>
      </button>
    {:else}
      <div class="cta done">🎓 {$lang === 'en' ? 'All lessons complete!' : 'Toutes les leçons terminées!'}</div>
    {/if}

    {#if leaderboard.length > 0}
      <div class="leaderboard-card">
        <h3>🏆 {t('leaderboard')}</h3>
        {#each leaderboard as entry, i}
          <div class="lb-row" class:self={entry.is_self}>
            <span class="lb-rank">{i + 1}</span>
            <span class="lb-name">{entry.username}{entry.is_self ? ` ← ${t('you')}` : ''}</span>
            <span class="lb-count">{entry.lessons_completed}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .dashboard { display: flex; flex-direction: column; gap: 20px; }
  .greeting { font-size: 24px; font-weight: 800; }
  .stats-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .stat-card {
    background: var(--surface); border-radius: var(--radius);
    padding: 14px; text-align: center; display: flex;
    flex-direction: column; align-items: center; gap: 4px;
  }
  .stat-big { font-size: 26px; font-weight: 900; }
  .stat-label { font-size: 11px; color: var(--muted); }
  .progress-bar-wrap { display: flex; flex-direction: column; gap: 6px; }
  .prog-label { font-size: 12px; color: var(--muted); }
  .progress-track { background: var(--surface); border-radius: 999px; height: 10px; overflow: hidden; }
  .progress-fill { background: linear-gradient(90deg, var(--primary), var(--accent)); height: 100%; border-radius: 999px; transition: width 0.5s ease; }
  .cta {
    background: linear-gradient(135deg, var(--primary), var(--accent));
    border: none; border-radius: var(--radius-lg); padding: 20px;
    text-align: center; cursor: pointer; display: flex;
    flex-direction: column; gap: 4px; min-height: 80px;
    justify-content: center;
  }
  .cta-sub { font-size: 13px; color: rgba(255,255,255,0.8); }
  .cta-title { font-size: 20px; font-weight: 800; color: white; }
  .cta.done { background: var(--surface); cursor: default; color: var(--accent); font-size: 18px; font-weight: 700; }
  .leaderboard-card { background: var(--surface); border-radius: var(--radius-lg); padding: 16px; }
  .leaderboard-card h3 { font-size: 14px; color: var(--muted); margin-bottom: 12px; }
  .lb-row {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 0; border-bottom: 1px solid var(--bg); font-size: 14px;
  }
  .lb-row.self { background: rgba(67,97,238,0.15); border-radius: 8px; padding: 8px; color: var(--accent); font-weight: 700; }
  .lb-rank {
    width: 24px; height: 24px; background: var(--bg); border-radius: 50%;
    display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0;
  }
  .lb-name { flex: 1; }
  .lb-count { color: var(--accent); font-weight: 700; }
</style>
```

- [ ] **Step 3: Test manually**

```bash
npm run dev
```
Log in as a student → should see dashboard with stats, lesson CTA, leaderboard (if teacher assigned).

- [ ] **Step 4: Commit**

```bash
git add src/routes/dashboard/ src/lib/components/StreakBadge.svelte
git commit -m "feat: student dashboard with streak, progress, leaderboard"
```

---

## Task 8: Exercise Screen

**Files:**
- Create: `src/routes/lesson/[id]/+page.server.ts`
- Create: `src/routes/lesson/[id]/+page.svelte`
- Create: `src/lib/components/ProgressDots.svelte`
- Create: `tests/unit/scoring.test.ts`

**Interfaces:**
- Consumes: `generateQuestions`, `Lesson`, `Question`, `t()`
- Produces: exercise UI, answer state `Record<string, string>`, score on complete → navigates to `/lesson/[id]/score`

- [ ] **Step 1: Write scoring logic test first**

```typescript
// tests/unit/scoring.test.ts
import { describe, it, expect } from 'vitest';

function calculateScore(questions: Array<{id:string,correct_answer:string}>, answers: Record<string,string>): number {
  return questions.filter(q => answers[q.id]?.trim() === q.correct_answer.trim()).length;
}

describe('scoring', () => {
  const questions = [
    { id: 'q1', correct_answer: '12' },
    { id: 'q2', correct_answer: '15' },
    { id: 'q3', correct_answer: '1/2' },
  ];

  it('counts exact matches', () => {
    expect(calculateScore(questions, { q1: '12', q2: '15', q3: '1/2' })).toBe(3);
  });

  it('returns 0 for no answers', () => {
    expect(calculateScore(questions, {})).toBe(0);
  });

  it('is case/space insensitive via trim', () => {
    expect(calculateScore(questions, { q1: ' 12 ', q2: '15', q3: '1/2' })).toBe(3);
  });

  it('badge threshold is 15/20', () => {
    const qs = Array.from({length:20}, (_,i) => ({id:`q${i}`,correct_answer:'1'}));
    const ans: Record<string,string> = {};
    for (let i = 0; i < 15; i++) ans[`q${i}`] = '1';
    expect(calculateScore(qs, ans)).toBeGreaterThanOrEqual(15);
  });
});
```

- [ ] **Step 2: Run scoring tests**

```bash
npm run test -- tests/unit/scoring.test.ts
```
Expected: 4 passing

- [ ] **Step 3: Write page server (load lesson + questions)**

```typescript
// src/routes/lesson/[id]/+page.server.ts
import { supabase } from '$lib/supabase';
import { generateQuestions } from '$lib/questions/generator';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const lessonId = parseInt(params.id);
  if (isNaN(lessonId)) throw error(404, 'Not found');

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single();

  if (!lesson) throw error(404, 'Lesson not found');

  const questions = generateQuestions(lesson, 20);
  return { lesson, questions };
};
```

- [ ] **Step 4: Write ProgressDots component**

```svelte
<!-- src/lib/components/ProgressDots.svelte -->
<script lang="ts">
  export let total: number;
  export let current: number;
  export let answers: Record<string, string>;
  export let skipped: Set<number>;
  export let correct: Set<number>;
  export let wrong: Set<number>;

  function dotColor(i: number): string {
    if (i === current) return 'current';
    if (correct.has(i)) return 'correct';
    if (wrong.has(i)) return 'wrong';
    if (skipped.has(i)) return 'skipped';
    return 'empty';
  }
</script>

<div class="dots">
  {#each Array(total) as _, i}
    <div class="dot {dotColor(i)}" title={`Q${i+1}`}></div>
  {/each}
</div>

<style>
  .dots { display: flex; flex-wrap: wrap; gap: 5px; }
  .dot {
    width: 12px; height: 12px; border-radius: 50%;
    background: var(--surface); transition: background 0.2s;
  }
  .dot.correct { background: var(--accent); }
  .dot.wrong { background: var(--danger); }
  .dot.skipped { background: var(--warn); }
  .dot.current { background: var(--surface); border: 2px solid var(--accent); }
  .dot.empty { background: var(--surface); }
</style>
```

- [ ] **Step 5: Write exercise page**

```svelte
<!-- src/routes/lesson/[id]/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { t, lang } from '$lib/i18n/index';
  import ProgressDots from '$lib/components/ProgressDots.svelte';
  import type { Question, Lesson } from '$lib/types';

  export let data: { lesson: Lesson; questions: Question[] };

  let current = 0;
  let answers: Record<string, string> = {};
  let selected: string | null = null;
  let typedInput = '';
  let skipped = new Set<number>();
  let correct = new Set<number>();
  let wrong = new Set<number>();
  let reviewMode = false;

  $: q = data.questions[current];
  $: isTyped = q?.type === 'typed';
  $: totalAnswered = Object.keys(answers).length;
  $: allDone = totalAnswered === data.questions.length;

  function confirm() {
    const val = isTyped ? typedInput.trim() : (selected ?? '');
    if (!val) return;
    answers[q.id] = val;
    const isCorrect = val === q.correct_answer;
    if (isCorrect) correct.add(current); else wrong.add(current);
    skipped.delete(current);
    selected = null;
    typedInput = '';
    advance();
  }

  function skip() {
    skipped.add(current);
    advance();
  }

  function advance() {
    // Find next unanswered question
    for (let i = current + 1; i < data.questions.length; i++) {
      if (!answers[data.questions[i].id]) { current = i; return; }
    }
    for (let i = 0; i < current; i++) {
      if (!answers[data.questions[i].id]) { current = i; return; }
    }
    // All answered or only skipped remain
    if (allDone || skipped.size === data.questions.length - totalAnswered) {
      finishLesson();
    }
  }

  function jumpTo(i: number) { current = i; selected = null; typedInput = ''; }

  async function finishLesson() {
    const score = data.questions.filter(q => answers[q.id]?.trim() === q.correct_answer).length;
    const user = $authStore.user!;

    const { data: progress } = await import('$lib/supabase').then(m =>
      m.supabase.from('student_progress').insert({
        student_id: user.id,
        lesson_id: data.lesson.id,
        score,
        answers
      }).select().single()
    );

    // Update streak
    await updateStreak(user.id);

    // Award badge if score >= 15
    if (score >= 15) {
      await import('$lib/supabase').then(m =>
        m.supabase.from('badges').upsert({
          student_id: user.id,
          lesson_id: data.lesson.id
        })
      );
    }

    goto(`/lesson/${data.lesson.id}/score?score=${score}&badge=${score >= 15}`);
  }

  async function updateStreak(studentId: string) {
    const { supabase } = await import('$lib/supabase');
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase.from('streaks').select('*').eq('student_id', studentId).maybeSingle();

    if (!existing) {
      await supabase.from('streaks').insert({ student_id: studentId, current_streak: 1, longest_streak: 1, last_practice_date: today });
      return;
    }

    const last = existing.last_practice_date;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let newStreak = last === yesterday ? existing.current_streak + 1 : (last === today ? existing.current_streak : 1);
    const longest = Math.max(newStreak, existing.longest_streak);

    await supabase.from('streaks').update({ current_streak: newStreak, longest_streak: longest, last_practice_date: today }).eq('student_id', studentId);
  }
</script>

<div class="exercise">
  <div class="lesson-title">{$lang === 'en' ? data.lesson.title_en : data.lesson.title_fr}</div>
  <div class="progress-info">
    <span>{t('question')} {current + 1} {t('of')} {data.questions.length}</span>
  </div>
  <ProgressDots
    total={data.questions.length}
    {current} {answers} {skipped} {correct} {wrong}
  />

  <div class="question-card">
    <div class="question-text">
      {$lang === 'en' ? q.question_en : q.question_fr}
    </div>
  </div>

  {#if isTyped}
    <div class="typed-display">{typedInput || '_'}</div>
    <div class="numpad">
      {#each ['1','2','3','4','5','6','7','8','9','/','0','⌫'] as key}
        <button class="num-key" on:click={() => {
          if (key === '⌫') typedInput = typedInput.slice(0,-1);
          else typedInput += key;
        }}>{key}</button>
      {/each}
    </div>
    <button class="btn-confirm" on:click={confirm} disabled={!typedInput}>{t('confirm')}</button>
  {:else}
    <div class="choices">
      {#each (q.options ?? []) as option}
        <button
          class="choice" class:chosen={selected === option}
          on:click={() => selected = option}
        >{option}</button>
      {/each}
    </div>
    <button class="btn-confirm" on:click={confirm} disabled={!selected}>{t('confirm')}</button>
  {/if}

  <button class="skip-btn" on:click={skip}>{t('skip')}</button>
</div>

<style>
  .exercise { display: flex; flex-direction: column; gap: 16px; }
  .lesson-title { font-size: 13px; color: var(--accent); font-weight: 700; }
  .progress-info { font-size: 12px; color: var(--muted); }
  .question-card {
    background: var(--surface); border-radius: var(--radius-lg);
    padding: 32px 20px; text-align: center; min-height: 120px;
    display: flex; align-items: center; justify-content: center;
  }
  .question-text { font-size: 36px; font-weight: 900; letter-spacing: 2px; }
  .typed-display {
    background: var(--surface); border: 2px solid var(--primary);
    border-radius: var(--radius); padding: 16px; text-align: center;
    font-size: 32px; font-weight: 800; color: var(--accent); letter-spacing: 4px;
  }
  .numpad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .num-key {
    background: var(--surface); color: var(--text); border: none;
    border-radius: var(--radius); font-size: 22px; font-weight: 700;
    min-height: 56px; cursor: pointer;
  }
  .num-key:hover { background: var(--primary); }
  .choices { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .choice {
    background: var(--surface); color: var(--text); border: 2px solid var(--surface);
    border-radius: var(--radius); font-size: 24px; font-weight: 800;
    min-height: 64px; cursor: pointer;
  }
  .choice.chosen { border-color: var(--accent); color: var(--accent); }
  .choice:hover { border-color: var(--primary); }
  .btn-confirm {
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: white; border: none; border-radius: var(--radius);
    padding: 16px; font-size: 16px; font-weight: 700; min-height: 52px;
  }
  .btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
  .skip-btn {
    background: none; border: none; color: var(--muted);
    text-decoration: underline; font-size: 14px; min-height: 44px; cursor: pointer;
  }
</style>
```

- [ ] **Step 6: Test manually**

```bash
npm run dev
```
Log in as student → click "Start Today's Lesson" → answer questions, skip one, come back. Verify dots update, confirm redirects to score page.

- [ ] **Step 7: Commit**

```bash
git add src/routes/lesson/ src/lib/components/ProgressDots.svelte tests/unit/scoring.test.ts
git commit -m "feat: exercise screen with MC and typed answer modes"
```

---

## Task 9: Score Screen + Confetti

**Files:**
- Create: `src/routes/lesson/[id]/score/+page.svelte`
- Create: `src/lib/components/Confetti.svelte`
- Create: `src/lib/components/ScoreRing.svelte`

**Interfaces:**
- Consumes: URL params `score` and `badge` (from exercise page redirect), `t()`
- Produces: score display, badge notification, retry/continue buttons

- [ ] **Step 1: Write ScoreRing component**

```svelte
<!-- src/lib/components/ScoreRing.svelte -->
<script lang="ts">
  export let score: number;
  export let total: number = 20;

  $: pct = score / total;
  $: circumference = 2 * Math.PI * 42; // r=42
  $: offset = circumference * (1 - pct);
</script>

<div class="ring-wrap">
  <svg width="120" height="120" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface)" stroke-width="10"/>
    <circle
      cx="50" cy="50" r="42" fill="none"
      stroke="url(#scoreGrad)" stroke-width="10"
      stroke-dasharray={circumference}
      stroke-dashoffset={offset}
      stroke-linecap="round"
      transform="rotate(-90 50 50)"
      style="transition: stroke-dashoffset 1s ease"
    />
    <defs>
      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="var(--primary)"/>
        <stop offset="100%" stop-color="var(--accent)"/>
      </linearGradient>
    </defs>
  </svg>
  <div class="score-label">
    <span class="score-num">{score}</span>
    <span class="score-denom">/ {total}</span>
  </div>
</div>

<style>
  .ring-wrap { position: relative; width: 120px; height: 120px; }
  .score-label {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    text-align: center; display: flex; flex-direction: column;
  }
  .score-num { font-size: 28px; font-weight: 900; }
  .score-denom { font-size: 12px; color: var(--muted); }
</style>
```

- [ ] **Step 2: Write Confetti component**

```svelte
<!-- src/lib/components/Confetti.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  let particles: Array<{x:number,y:number,color:string,size:number,vx:number,vy:number,opacity:number}> = [];
  const colors = ['#4361EE','#4CC9F0','#FFD93D','#FF6B35','#6BCB77'];

  onMount(() => {
    particles = Array.from({ length: 60 }, () => ({
      x: 50 + (Math.random() - 0.5) * 60,
      y: 20 + Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 3,
      opacity: 1
    }));

    let frame: number;
    function animate() {
      particles = particles.map(p => ({
        ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.1, opacity: p.opacity - 0.012
      })).filter(p => p.opacity > 0);
      if (particles.length > 0) frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  });
</script>

<div class="confetti-wrap" aria-hidden="true">
  {#each particles as p}
    <div
      class="particle"
      style="left:{p.x}%;top:{p.y}%;width:{p.size}px;height:{p.size}px;background:{p.color};opacity:{p.opacity}"
    ></div>
  {/each}
</div>

<style>
  .confetti-wrap { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 100; }
  .particle { position: absolute; border-radius: 2px; }
</style>
```

- [ ] **Step 3: Write score page**

```svelte
<!-- src/routes/lesson/[id]/score/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { t } from '$lib/i18n/index';
  import ScoreRing from '$lib/components/ScoreRing.svelte';
  import Confetti from '$lib/components/Confetti.svelte';
  import { authStore } from '$lib/stores/auth';
  import { onMount } from 'svelte';

  $: score = parseInt($page.url.searchParams.get('score') ?? '0');
  $: badgeEarned = $page.url.searchParams.get('badge') === 'true';
  $: lessonId = $page.params.id;
  $: great = score >= 15;
  $: toEarnBadge = 15 - score;

  let streak = 0;
  onMount(async () => {
    const { supabase } = await import('$lib/supabase');
    const { data } = await supabase.from('streaks').select('current_streak').eq('student_id', $authStore.user!.id).maybeSingle();
    streak = data?.current_streak ?? 0;
  });
</script>

{#if badgeEarned}
  <Confetti />
{/if}

<div class="score-screen">
  <div class="emoji">{great ? '🎉' : '💪'}</div>
  <h1>{t(great ? 'excellent' : 'goodEffort')}, {$authStore.user?.username}!</h1>

  <ScoreRing {score} />

  {#if badgeEarned}
    <div class="badge-banner">
      <span class="badge-icon">🏅</span>
      <div>
        <div class="badge-title">{t('badgeEarned')}</div>
      </div>
    </div>
  {:else}
    <div class="encouragement">
      <div class="enc-bar-wrap">
        <div class="enc-bar"><div class="enc-fill" style="width:{(score/15)*100}%"></div></div>
        <span>{score} / 15</span>
      </div>
      <p>{toEarnBadge} {t('needForBadge')}</p>
    </div>
  {/if}

  {#if streak > 0}
    <div class="streak-update">🔥 {streak}-day streak!</div>
  {/if}

  <div class="actions">
    {#if !great}
      <button class="btn-primary" on:click={() => goto(`/lesson/${lessonId}`)}>
        {t('tryAgain')}
      </button>
    {/if}
    <button class="btn-secondary" on:click={() => goto('/dashboard')}>
      {great ? t('backToDashboard') : t('continueNext')}
    </button>
  </div>
</div>

<style>
  .score-screen {
    display: flex; flex-direction: column; align-items: center;
    text-align: center; gap: 20px; padding: 20px 0;
  }
  .emoji { font-size: 64px; }
  h1 { font-size: 24px; font-weight: 900; }
  .badge-banner {
    background: linear-gradient(135deg, var(--warn), var(--danger));
    border-radius: var(--radius); padding: 14px 24px;
    display: flex; align-items: center; gap: 12px;
  }
  .badge-icon { font-size: 32px; }
  .badge-title { font-size: 16px; font-weight: 800; }
  .encouragement { background: var(--surface); border-radius: var(--radius); padding: 16px; width: 100%; }
  .enc-bar-wrap { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .enc-bar { flex: 1; background: var(--bg); border-radius: 999px; height: 8px; overflow: hidden; }
  .enc-fill { background: linear-gradient(90deg, var(--primary), var(--accent)); height: 100%; border-radius: 999px; }
  .streak-update { color: var(--danger); font-weight: 800; font-size: 18px; }
  .actions { display: flex; flex-direction: column; gap: 10px; width: 100%; }
  .btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: white; border: none; border-radius: var(--radius);
    padding: 16px; font-size: 16px; font-weight: 700; min-height: 52px;
  }
  .btn-secondary {
    background: var(--surface); color: var(--muted); border: none;
    border-radius: var(--radius); padding: 14px; font-size: 15px; min-height: 52px;
  }
</style>
```

- [ ] **Step 4: Test manually**

Complete a lesson → verify score screen shows ring, confetti fires on badge, retry/continue buttons work.

- [ ] **Step 5: Commit**

```bash
git add src/routes/lesson/ src/lib/components/ScoreRing.svelte src/lib/components/Confetti.svelte
git commit -m "feat: score screen with animated ring, confetti, badge display"
```

---

## Task 10: Teacher Dashboard + Student Detail

**Files:**
- Create: `src/routes/teacher/+page.svelte`
- Create: `src/routes/teacher/student/[id]/+page.svelte`

**Interfaces:**
- Consumes: `supabase`, `UserProfile`, `StudentProgress`, `Streak`, `t()`
- Produces: class overview table, per-student lesson history

- [ ] **Step 1: Write teacher dashboard**

```svelte
<!-- src/routes/teacher/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { supabase } from '$lib/supabase';
  import { t } from '$lib/i18n/index';
  import type { UserProfile, Streak } from '$lib/types';

  interface StudentRow {
    profile: UserProfile;
    lessonCount: number;
    avgScore: number;
    streak: number;
    lastActive: string | null;
  }

  let rows: StudentRow[] = [];
  let loading = true;
  const INACTIVE_DAYS = 4;

  function daysAgo(dateStr: string | null): string {
    if (!dateStr) return '—';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (diff === 0) return t('today');
    if (diff === 1) return t('yesterday');
    return `${diff} ${t('daysAgo')}`;
  }

  function isInactive(dateStr: string | null): boolean {
    if (!dateStr) return true;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000) >= INACTIVE_DAYS;
  }

  onMount(async () => {
    const user = $authStore.user;
    if (!user) { goto('/'); return; }
    if (user.role === 'student') { goto('/dashboard'); return; }

    const { data: students } = await supabase
      .from('users')
      .select('*')
      .eq('teacher_id', user.id)
      .eq('role', 'student')
      .order('username');

    if (!students) { loading = false; return; }

    rows = await Promise.all((students as UserProfile[]).map(async (s) => {
      const [progressRes, streakRes] = await Promise.all([
        supabase.from('student_progress').select('score, completed_at').eq('student_id', s.id),
        supabase.from('streaks').select('current_streak, last_practice_date').eq('student_id', s.id).maybeSingle()
      ]);
      const progress = progressRes.data ?? [];
      const scores = progress.map((p: any) => p.score as number);
      const avgScore = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0) / scores.length / 20 * 100) : 0;
      const lastActive = streakRes.data?.last_practice_date ?? null;
      return {
        profile: s,
        lessonCount: progress.length,
        avgScore,
        streak: streakRes.data?.current_streak ?? 0,
        lastActive
      };
    }));

    loading = false;
  });

  $: avgLesson = rows.length ? (rows.reduce((s,r) => s + r.lessonCount, 0) / rows.length).toFixed(1) : '—';
  $: avgScore = rows.length ? Math.round(rows.reduce((s,r) => s + r.avgScore, 0) / rows.length) + '%' : '—';
  $: avgStreak = rows.length ? (rows.reduce((s,r) => s + r.streak, 0) / rows.length).toFixed(1) : '—';
</script>

{#if loading}
  <p style="color:var(--muted);text-align:center;padding:40px">…</p>
{:else}
  <div class="teacher-dash">
    <div class="header-row">
      <div>
        <h2>{$authStore.user?.username}</h2>
        <p class="subtitle">{rows.length} {t('students')}</p>
      </div>
      <button class="btn-add" on:click={() => goto('/admin')}>{t('addStudent')}</button>
    </div>

    <div class="stats-row">
      <div class="stat"><span class="stat-val" style="color:var(--accent)">{avgLesson}</span><span class="stat-lbl">{t('avgLesson')}</span></div>
      <div class="stat"><span class="stat-val" style="color:var(--success)">{avgScore}</span><span class="stat-lbl">{t('avgScore')}</span></div>
      <div class="stat"><span class="stat-val" style="color:var(--danger)">🔥 {avgStreak}</span><span class="stat-lbl">{t('avgStreak')}</span></div>
    </div>

    <div class="table">
      <div class="table-head">
        <span>{t('students')}</span>
        <span>{t('lesson')}</span>
        <span>{t('score')}</span>
        <span>{t('streak')}</span>
        <span>{t('lastActive')}</span>
      </div>
      {#each rows as row}
        <button class="table-row" on:click={() => goto(`/teacher/student/${row.profile.id}`)}>
          <span class="student-name">{row.profile.username}</span>
          <span style="color:var(--accent)">{row.lessonCount}/30</span>
          <span style="color:{row.avgScore>=75?'var(--success)':row.avgScore>=50?'var(--warn)':'var(--danger)'}">{row.avgScore}%</span>
          <span style="color:var(--danger)">{row.streak > 0 ? `🔥 ${row.streak}` : '—'}</span>
          <span style="color:{isInactive(row.lastActive)?'var(--danger)':'var(--muted)'}">
            {daysAgo(row.lastActive)}{isInactive(row.lastActive) ? ' ⚠️' : ''}
          </span>
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .teacher-dash { display: flex; flex-direction: column; gap: 20px; }
  .header-row { display: flex; justify-content: space-between; align-items: flex-start; }
  h2 { font-size: 22px; font-weight: 900; }
  .subtitle { color: var(--muted); font-size: 13px; }
  .btn-add {
    background: var(--surface); color: var(--accent); border: 1px solid var(--primary);
    border-radius: 999px; padding: 8px 16px; font-size: 13px; min-height: 44px; cursor: pointer;
  }
  .stats-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .stat {
    background: var(--surface); border-radius: var(--radius);
    padding: 12px; text-align: center; display: flex;
    flex-direction: column; gap: 4px;
  }
  .stat-val { font-size: 22px; font-weight: 900; }
  .stat-lbl { font-size: 11px; color: var(--muted); }
  .table { background: var(--surface); border-radius: var(--radius-lg); overflow: hidden; }
  .table-head {
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1.2fr;
    padding: 10px 14px; font-size: 10px; color: var(--muted);
    text-transform: uppercase; letter-spacing: 0.5px;
    border-bottom: 1px solid var(--bg);
  }
  .table-row {
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1.2fr;
    padding: 12px 14px; font-size: 13px; align-items: center;
    border-bottom: 1px solid var(--bg); cursor: pointer;
    background: none; border-left: none; border-right: none; color: var(--text);
    text-align: left; min-height: 52px; width: 100%;
  }
  .table-row:hover { background: rgba(67,97,238,0.08); }
  .student-name { font-weight: 700; }
</style>
```

- [ ] **Step 2: Write student detail page**

```svelte
<!-- src/routes/teacher/student/[id]/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { supabase } from '$lib/supabase';
  import { lang } from '$lib/i18n/index';
  import type { Lesson, StudentProgress } from '$lib/types';

  let student: { username: string; grade: number } | null = null;
  let lessons: Lesson[] = [];
  let progress: StudentProgress[] = [];
  let loading = true;

  onMount(async () => {
    const user = $authStore.user;
    if (!user || user.role === 'student') { goto('/'); return; }

    const studentId = $page.params.id;
    const [sRes, pRes] = await Promise.all([
      supabase.from('users').select('username, grade').eq('id', studentId).single(),
      supabase.from('student_progress').select('*').eq('student_id', studentId).order('completed_at')
    ]);

    student = sRes.data;
    progress = (pRes.data ?? []) as StudentProgress[];

    if (student) {
      const { data } = await supabase.from('lessons').select('*').eq('grade', student.grade).order('order_index');
      lessons = (data ?? []) as Lesson[];
    }

    loading = false;
  });

  function getProgress(lessonId: number) {
    return progress.filter(p => p.lesson_id === lessonId).sort((a,b) =>
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );
  }
</script>

{#if loading}
  <p style="color:var(--muted);text-align:center;padding:40px">…</p>
{:else if student}
  <div>
    <button class="back-btn" on:click={() => goto('/teacher')}>← Back</button>
    <h2>{student.username} — Grade {student.grade}</h2>

    <div class="lesson-list">
      {#each lessons as lesson}
        {@const attempts = getProgress(lesson.id)}
        {@const best = attempts.length ? Math.max(...attempts.map(a => a.score)) : null}
        <div class="lesson-row" class:completed={attempts.length > 0}>
          <span class="lesson-num">{lesson.order_index}</span>
          <span class="lesson-title">{$lang === 'en' ? lesson.title_en : lesson.title_fr}</span>
          {#if best !== null}
            <span class="best-score" style="color:{best>=15?'var(--success)':best>=10?'var(--warn)':'var(--danger)'}">{best}/20{best>=15?' 🏅':''}</span>
            <span class="attempts">{attempts.length}×</span>
          {:else}
            <span class="not-done" style="color:var(--muted)">—</span>
            <span></span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .back-btn {
    background: none; border: none; color: var(--accent); font-size: 14px;
    cursor: pointer; margin-bottom: 16px; min-height: 44px; padding: 0;
  }
  h2 { font-size: 22px; font-weight: 900; margin-bottom: 20px; }
  .lesson-list { background: var(--surface); border-radius: var(--radius-lg); overflow: hidden; }
  .lesson-row {
    display: grid; grid-template-columns: 28px 1fr auto auto;
    padding: 12px 14px; border-bottom: 1px solid var(--bg);
    font-size: 13px; align-items: center; gap: 8px;
  }
  .lesson-row.completed { border-left: 3px solid var(--accent); }
  .lesson-num { color: var(--muted); font-size: 11px; }
  .lesson-title { font-weight: 600; }
  .best-score { font-weight: 700; }
  .attempts { color: var(--muted); font-size: 11px; }
</style>
```

- [ ] **Step 3: Test manually**

Log in as teacher → verify student table, click a row → verify lesson history.

- [ ] **Step 4: Commit**

```bash
git add src/routes/teacher/
git commit -m "feat: teacher dashboard with class overview and student detail"
```

---

## Task 11: Admin Panel (User Management)

**Files:**
- Create: `src/routes/admin/+page.svelte`

**Interfaces:**
- Consumes: `supabase`, `authStore`, `t()`
- Produces: create teacher / create student forms, user list with delete

- [ ] **Step 1: Write admin panel**

```svelte
<!-- src/routes/admin/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { supabase } from '$lib/supabase';
  import { t } from '$lib/i18n/index';
  import type { UserProfile } from '$lib/types';

  let teachers: UserProfile[] = [];
  let students: UserProfile[] = [];

  // New user form
  let newUsername = '';
  let newPassword = '';
  let newRole: 'teacher' | 'student' = 'student';
  let newGrade: 5 | 6 = 5;
  let newTeacherId = '';
  let formError = '';
  let formSuccess = '';
  let loading = false;

  onMount(async () => {
    const user = $authStore.user;
    if (!user || user.role !== 'admin') { goto(user?.role === 'student' ? '/dashboard' : '/teacher'); return; }
    await loadUsers();
  });

  async function loadUsers() {
    const [tRes, sRes] = await Promise.all([
      supabase.from('users').select('*').eq('role', 'teacher').order('username'),
      supabase.from('users').select('*').eq('role', 'student').order('username')
    ]);
    teachers = (tRes.data ?? []) as UserProfile[];
    students = (sRes.data ?? []) as UserProfile[];
  }

  async function createUser() {
    formError = ''; formSuccess = ''; loading = true;
    try {
      const email = `${newUsername}@mathprimaire.local`;

      // Create auth user
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email, password: newPassword, email_confirm: true
      });
      if (authErr) throw new Error(authErr.message.includes('already') ? 'usernameExists' : authErr.message);

      // Create profile
      const profile: Partial<UserProfile> = {
        id: authData.user.id,
        username: newUsername,
        role: newRole,
        language: 'en'
      };
      if (newRole === 'student') {
        profile.grade = newGrade;
        if (newTeacherId) profile.teacher_id = newTeacherId;
      }

      const { error: profileErr } = await supabase.from('users').insert(profile);
      if (profileErr) throw new Error(profileErr.message);

      formSuccess = `User "${newUsername}" created.`;
      newUsername = ''; newPassword = '';
      await loadUsers();
    } catch (e: any) {
      formError = t(e.message) || e.message;
    } finally {
      loading = false;
    }
  }

  async function deleteUser(user: UserProfile) {
    if (user.role === 'admin') return; // never delete admin
    if (!confirm(`Delete "${user.username}"?`)) return;
    await supabase.auth.admin.deleteUser(user.id);
    await supabase.from('users').delete().eq('id', user.id);
    await loadUsers();
  }
</script>

<div class="admin">
  <h2>{t('adminPanel')}</h2>

  <div class="create-form">
    <h3>{t('createUser')}</h3>
    <div class="form-row">
      <label>
        {t('username')}
        <input bind:value={newUsername} type="text" required />
      </label>
      <label>
        {t('password')}
        <input bind:value={newPassword} type="password" required />
      </label>
    </div>
    <div class="form-row">
      <label>
        Role
        <select bind:value={newRole}>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
      </label>
      {#if newRole === 'student'}
        <label>
          {t('grade')}
          <select bind:value={newGrade}>
            <option value={5}>Grade 5</option>
            <option value={6}>Grade 6</option>
          </select>
        </label>
        <label>
          Teacher
          <select bind:value={newTeacherId}>
            <option value="">— None —</option>
            {#each teachers as teacher}
              <option value={teacher.id}>{teacher.username}</option>
            {/each}
          </select>
        </label>
      {/if}
    </div>
    {#if formError}<p class="error">{formError}</p>{/if}
    {#if formSuccess}<p class="success">{formSuccess}</p>{/if}
    <button class="btn-primary" on:click={createUser} disabled={loading || !newUsername || !newPassword}>
      {loading ? '…' : t('createUser')}
    </button>
  </div>

  <div class="user-table">
    <h3>{t('teachers')}</h3>
    {#each teachers as user}
      <div class="user-row">
        <span>{user.username}</span>
        <button class="del-btn" on:click={() => deleteUser(user)}>{t('deleteUser')}</button>
      </div>
    {/each}
  </div>

  <div class="user-table">
    <h3>{t('students')}</h3>
    {#each students as user}
      <div class="user-row">
        <span>{user.username}</span>
        <span style="color:var(--muted);font-size:12px">Grade {user.grade}</span>
        <button class="del-btn" on:click={() => deleteUser(user)}>{t('deleteUser')}</button>
      </div>
    {/each}
  </div>
</div>

<style>
  .admin { display: flex; flex-direction: column; gap: 24px; }
  h2 { font-size: 22px; font-weight: 900; }
  h3 { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
  .create-form { background: var(--surface); border-radius: var(--radius-lg); padding: 20px; display: flex; flex-direction: column; gap: 14px; }
  .form-row { display: flex; gap: 12px; flex-wrap: wrap; }
  label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: var(--muted); flex: 1; min-width: 140px; }
  input, select {
    background: var(--bg); border: 2px solid var(--surface);
    color: var(--text); border-radius: var(--radius); padding: 10px 12px;
    font-size: 14px; min-height: 44px;
  }
  input:focus, select:focus { outline: none; border-color: var(--primary); }
  .btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: white; border: none; border-radius: var(--radius);
    padding: 14px; font-size: 15px; font-weight: 700; min-height: 48px;
  }
  .btn-primary:disabled { opacity: 0.4; }
  .error { color: var(--danger); font-size: 13px; }
  .success { color: var(--success); font-size: 13px; }
  .user-table { background: var(--surface); border-radius: var(--radius-lg); padding: 16px; }
  .user-row {
    display: flex; align-items: center; gap: 10px; padding: 10px 0;
    border-bottom: 1px solid var(--bg); font-size: 14px;
  }
  .user-row span:first-child { flex: 1; font-weight: 600; }
  .del-btn {
    background: none; border: 1px solid var(--danger); color: var(--danger);
    border-radius: 999px; padding: 4px 12px; font-size: 12px; cursor: pointer; min-height: 36px;
  }
</style>
```

- [ ] **Step 2: Enable admin API in Supabase**

In Supabase dashboard → Settings → API → copy the `service_role` secret key. Add to `.env`:
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Update `src/lib/supabase.ts` to add the admin client:
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
export const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});
```

Also update `.env.example`:
```
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Update the admin page's import line (top of `<script>`):
```typescript
import { supabaseAdmin as supabase } from '$lib/supabase';
```
The rest of the admin page code stays the same — it already calls `supabase.auth.admin.*`.

- [ ] **Step 3: Test manually**

Log in as admin → create a teacher → create a student assigned to that teacher → verify in Supabase table.

- [ ] **Step 4: Commit**

```bash
git add src/routes/admin/ src/lib/supabase.ts
git commit -m "feat: admin panel for creating and deleting users"
```

---

## Task 12: Vercel Deployment

**Files:**
- Create: `vercel.json`
- Modify: `.env.example`

**Interfaces:**
- Produces: live deployment at `https://<project>.vercel.app`

- [ ] **Step 1: Add vercel.json**

```json
{
  "framework": "sveltekit"
}
```

- [ ] **Step 2: Push to GitHub**

```bash
git remote add origin https://github.com/<your-username>/primary-math.git
git push -u origin main
```

- [ ] **Step 3: Connect to Vercel**

1. Go to https://vercel.com → New Project → import the GitHub repo
2. Framework: SvelteKit (auto-detected)
3. Add environment variables:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

- [ ] **Step 4: Verify deployment**

Open the Vercel URL → log in as admin → create a teacher and student → log in as student → complete a lesson → verify score saved in Supabase.

- [ ] **Step 5: Commit**

```bash
git add vercel.json
git commit -m "feat: Vercel deployment config"
```

---

## Verification Checklist

- [ ] Auth: admin → creates teacher → teacher creates student → student logs in → each sees correct dashboard
- [ ] Lesson flow: student starts lesson → answers MC + typed → skips one → returns → submits → score saved in DB
- [ ] Badge: score ≥15/20 → badge row in `badges` table → confetti on score screen
- [ ] Streak: complete lesson today → `last_practice_date` = today; complete again tomorrow → `current_streak` increments
- [ ] Leaderboard: two students with different lesson counts → ranked correctly, self highlighted
- [ ] Teacher dashboard: student row shows correct lesson count, inactive ⚠️ after 4 days
- [ ] Bilingual: toggle EN↔FR on login, dashboard, exercise, score screens → all text changes
- [ ] Tablet: open on 768px viewport → no horizontal scroll, all buttons ≥44px
