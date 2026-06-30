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
  score        int  not null check (score between 0 and 100),
  total        int  not null default 20,
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
