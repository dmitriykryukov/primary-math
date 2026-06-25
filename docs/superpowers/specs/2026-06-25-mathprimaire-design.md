# MathPrimaire — Design Spec

**Date:** 2026-06-25
**Status:** Approved by user

---

## Context

A web platform for Canadian primary school students (Grades 5 & 6) to practice math daily. The goal is to make practicing multiplication tables, division, and fractions engaging, measurable, and fun — with a teacher-visible progress dashboard. The platform is fully bilingual (English/French) and designed tablet-first for classroom use.

---

## Tech Stack

| Layer           | Choice     | Reason                                                                     |
| --------------- | ---------- | -------------------------------------------------------------------------- |
| Frontend + API  | SvelteKit  | Excellent animation/reactivity support for celebrations and interactive UI |
| Database + Auth | Supabase   | Built-in auth, PostgreSQL, realtime (leaderboard)                          |
| Hosting         | Vercel     | Free tier, automatic deploys from git                                      |
| Language        | TypeScript | Type safety across SvelteKit + Supabase client                             |

---

## User Roles

Three roles, strictly hierarchical:

**Admin** — one permanent account (never deletable), can create teachers and students.
**Teacher** — created by admin or another teacher, can create students, sees class progress dashboard.
**Student** — created by teacher or admin only (no self-registration), can log in and practice.

No public registration page. Login page only.

---

## Authentication Flow

- Single login page for all roles — username + password
- After login, role is checked: student → student dashboard, teacher/admin → teacher dashboard
- Sessions managed by Supabase Auth (JWT)
- Language preference (EN/FR) stored in user profile, toggleable at any time via top-bar button

---

## Curriculum Structure

### Grade 5 — 30 Lessons

| Lessons | Topic                                      |
| ------- | ------------------------------------------ |
| 1–6     | Multiplication tables 1–6 (up to ×12)      |
| 7–12    | Multiplication tables 7–12 (up to ×12)     |
| 13–18   | Division (linked to multiplication facts)  |
| 19–22   | Equivalent fractions + comparing fractions |
| 23–26   | Adding fractions (same denominator)        |
| 27–30   | Subtracting fractions (same denominator)   |

### Grade 6 — 30 Lessons

| Lessons | Topic                                                         |
| ------- | ------------------------------------------------------------- |
| 1–6     | Mixed multiplication (larger combinations, 2-digit × 1-digit) |
| 7–12    | Mixed division (harder, with remainders)                      |
| 13–16   | Adding/subtracting fractions (different denominators)         |
| 17–20   | Finding common denominators                                   |
| 21–24   | Multiplying fractions                                         |
| 25–30   | Dividing fractions                                            |

Each lesson has **20 questions**: ~12 typed answer + ~8 multiple choice.
Lessons unlock sequentially. A student must complete the current lesson before the next unlocks (regardless of score).

---

## Exercise Types

### Multiple Choice

- Large question displayed in a card
- 4 answer options in a 2×2 grid (big touch targets)
- Distractors include common mistakes (e.g., off-by-one, reversed operation)
- Tap to select (highlights chosen answer), then tap "Confirm" button to submit — prevents accidental answer on tablets

### Typed Answer

- Large question card
- Large display box shows typed digits
- Number-pad style input (tablet-friendly — no tiny keyboard)
- "Confirm Answer" button to submit

### Shared behaviour

- 20-dot progress tracker at top (blue = done, yellow = skipped, red = wrong, current = outlined)
- "Skip for now →" link on every question
- Student can review skipped questions at end of lesson before submitting

---

## Scoring & Badges

- Badge earned when score **≥ 15/20 (75%)**
- Lower scores: encouraging screen with retry option OR continue anyway
- All lessons advance regardless of score — no student gets stuck
- Retry is always available from the lesson history

---

## Gamification

| Feature      | Detail                                                                                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Daily streak | Increments each calendar day the student completes at least one lesson. Resets if a day is missed.                                                                          |
| Progress bar | X/30 lessons shown on dashboard                                                                                                                                             |
| Badges       | One badge per lesson, earned at ≥15/20. Displayed in profile.                                                                                                               |
| Leaderboard  | Class-scoped (students linked to the same teacher), ranked by lessons completed. Student's own rank highlighted. If student has no teacher assigned, leaderboard is hidden. |

---

## UI Design

**Style:** Cool & Modern — dark navy background (#0f1729), deep blue (#4361EE), electric teal (#4CC9F0), white text.
**Layout:** Tablet-first (min touch target 44px), fully responsive to desktop.
**Typography:** Heavy weights (800–900) for numbers and scores; clean sans-serif.
**Animations:** Celebration screen uses confetti/star burst on badge earned. Dot tracker animates on answer. Score ring animates fill on reveal.
**Language toggle:** Always visible in top bar, switches all UI text instantly.

---

## Key Screens

1. **Login** — username/password, language toggle, role auto-detected
2. **Student Dashboard** — streak, lesson progress bar, "Start Today's Lesson" CTA, leaderboard
3. **Exercise Screen** — question card, answer input (choice or typed), progress dots, skip link
4. **Score Screen** — circular score ring, badge if earned, streak update, retry/continue options
5. **Teacher Dashboard** — class stats row, student table (lesson/score/streak/last active), ⚠️ flag for 4+ days inactive, click row → student detail
6. **Student Detail (Teacher)** — full lesson history, scores per lesson
7. **Admin Panel** — create/manage teacher accounts, create/manage student accounts

---

## Database Schema (Supabase / PostgreSQL)

```
users  (extends Supabase auth.users — same UUID as primary key)
  id (fk → auth.users), username (unique), role (admin|teacher|student),
  grade (5|6|null), language (en|fr), teacher_id (fk → users.id),
  created_at
  NOTE: Supabase Auth is used with username stored as the "email" field
  (e.g. "lucas" is stored as "lucas" in auth metadata). Passwords are
  managed by Supabase Auth — never stored in the public users table.

lessons
  id, grade, order_index, title_en, title_fr, topic

questions
  id, lesson_id, type (multiple_choice|typed), question_en, question_fr,
  correct_answer, options (jsonb — for multiple choice), order_index

student_progress
  id, student_id, lesson_id, completed_at, score (0–20),
  answers (jsonb — question_id → student_answer)

badges
  id, student_id, lesson_id, earned_at

streaks
  student_id (pk), current_streak, longest_streak, last_practice_date
```

---

## Future Features (out of scope for v1)

- Mistake analysis: surface which question types a student gets wrong most
- Additional exercises generated from mistake patterns
- "Presents" / reward system beyond badges
- Class join codes for student self-enrollment
- Parent accounts

---

## Verification

1. **Auth:** Log in as admin, create a teacher, log in as teacher, create a student, log in as student — verify each role sees the correct dashboard
2. **Lesson flow:** As student, start a lesson, answer questions, skip one, come back, submit — verify score calculation and badge logic (≥15 earns badge)
3. **Streak:** Complete a lesson, log out, log back in next day — verify streak increments
4. **Leaderboard:** Two students complete different lesson counts — verify ranking order
5. **Teacher dashboard:** Verify student rows update after student completes lessons; verify ⚠️ flag appears after 4 days inactive
6. **Bilingual:** Toggle EN/FR — verify all UI text switches, questions display in correct language
7. **Tablet layout:** Open on iPad-sized viewport — verify all touch targets are comfortably tappable, no horizontal scroll
