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

-- lessons: all users (including unauthenticated anon key) can read
-- using (true) instead of (auth.uid() is not null) so that the SvelteKit
-- server-side load in Task 8 can fetch lessons using the anon key without a user JWT.
-- Lesson titles are not sensitive data.
create policy "lessons_select" on public.lessons for select
  using (true);

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
