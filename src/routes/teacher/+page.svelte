<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { supabase } from '$lib/supabase';
  import { t, lang } from '$lib/i18n/index';
  import type { UserProfile } from '$lib/types';

  interface StudentRow {
    profile: UserProfile;
    lessonCount: number;
    avgScore: number;
    streak: number;
    lastActive: string | null;
  }

  let rows: StudentRow[] = $state([]);
  let loading = $state(true);
  const INACTIVE_DAYS = 4;

  function daysDiff(dateStr: string): number {
    const [y, m, d] = dateStr.split('-').map(Number);
    const then = new Date(y, m - 1, d);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.floor((now.getTime() - then.getTime()) / 86400000);
  }

  function daysAgo(dateStr: string | null): string {
    if (!dateStr) return '—';
    const diff = daysDiff(dateStr);
    if (diff === 0) return t('today', $lang);
    if (diff === 1) return t('yesterday', $lang);
    return `${diff} ${t('daysAgo', $lang)}`;
  }

  function isInactive(dateStr: string | null): boolean {
    if (!dateStr) return true;
    return daysDiff(dateStr) >= INACTIVE_DAYS;
  }

  let avgLesson = $derived(
    rows.length ? (rows.reduce((s, r) => s + r.lessonCount, 0) / rows.length).toFixed(1) : '—'
  );
  let avgScore = $derived(
    rows.length ? Math.round(rows.reduce((s, r) => s + r.avgScore, 0) / rows.length) + '%' : '—'
  );
  let avgStreak = $derived(
    rows.length ? (rows.reduce((s, r) => s + r.streak, 0) / rows.length).toFixed(1) : '—'
  );

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
        supabase.from('student_progress').select('lesson_id, score, completed_at').eq('student_id', s.id),
        supabase.from('streaks').select('current_streak, last_practice_date').eq('student_id', s.id).maybeSingle()
      ]);
      const progress = progressRes.data ?? [];
      const scores = progress.map((p: any) => p.score as number);
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length / 20 * 100) : 0;
      const lessonCount = new Set(progress.map((p: any) => p.lesson_id)).size;
      const lastActive = streakRes.data?.last_practice_date ?? null;
      return {
        profile: s,
        lessonCount,
        avgScore,
        streak: streakRes.data?.current_streak ?? 0,
        lastActive
      };
    }));

    loading = false;
  });
</script>

{#if loading}
  <p style="color:var(--muted);text-align:center;padding:40px">…</p>
{:else}
  <div class="teacher-dash">
    <div class="header-row">
      <div>
        <h2>{$authStore.user?.username}</h2>
        <p class="subtitle">{rows.length} {t('students', $lang)}</p>
      </div>
      <button class="btn-add" onclick={() => goto('/admin')}>{t('addStudent', $lang)}</button>
    </div>

    <div class="stats-row">
      <div class="stat"><span class="stat-val" style="color:var(--accent)">{avgLesson}</span><span class="stat-lbl">{t('avgLesson', $lang)}</span></div>
      <div class="stat"><span class="stat-val" style="color:var(--success)">{avgScore}</span><span class="stat-lbl">{t('avgScore', $lang)}</span></div>
      <div class="stat"><span class="stat-val" style="color:var(--danger)">🔥 {avgStreak}</span><span class="stat-lbl">{t('avgStreak', $lang)}</span></div>
    </div>

    <div class="table">
      <div class="table-head">
        <span>{t('students', $lang)}</span>
        <span>{t('lesson', $lang)}</span>
        <span>{t('score', $lang)}</span>
        <span>{t('streak', $lang)}</span>
        <span>{t('lastActive', $lang)}</span>
      </div>
      {#each rows as row}
        <button class="table-row" onclick={() => goto(`/teacher/student/${row.profile.id}`)}>
          <span class="student-name">{row.profile.username}</span>
          <span style="color:var(--accent)">{row.lessonCount}/30</span>
          <span style="color:{row.avgScore >= 75 ? 'var(--success)' : row.avgScore >= 50 ? 'var(--warn)' : 'var(--danger)'}">{row.avgScore}%</span>
          <span style="color:var(--danger)">{row.streak > 0 ? `🔥 ${row.streak}` : '—'}</span>
          <span style="color:{isInactive(row.lastActive) ? 'var(--danger)' : 'var(--muted)'}">
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
