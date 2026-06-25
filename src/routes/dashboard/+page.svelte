<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { supabase } from '$lib/supabase';
  import { t, lang } from '$lib/i18n/index';
  import StreakBadge from '$lib/components/StreakBadge.svelte';
  import type { Lesson, Streak, LeaderboardEntry } from '$lib/types';

  let lessons: Lesson[] = $state([]);
  let completedLessonIds: number[] = $state([]);
  let streak: Streak = $state({ student_id: '', current_streak: 0, longest_streak: 0, last_practice_date: null });
  let leaderboard: LeaderboardEntry[] = $state([]);
  let badgeCount = $state(0);
  let loading = $state(true);

  let user = $derived($authStore.user);
  let currentLesson = $derived(lessons.find(l => !completedLessonIds.includes(l.id)) ?? null);
  let completedCount = $derived(completedLessonIds.length);

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
    <h2 class="greeting">{t('greeting', $lang)}, {user?.username}!</h2>

    <div class="stats-row">
      <div class="stat-card">
        <StreakBadge streak={streak.current_streak} />
        <span class="stat-label">{t('streak', $lang)}</span>
      </div>
      <div class="stat-card">
        <span class="stat-big" style="color:var(--accent)">{completedCount}/30</span>
        <span class="stat-label">{t('progress', $lang)}</span>
      </div>
      <div class="stat-card">
        <span class="stat-big" style="color:var(--warn)">🏅 {badgeCount}</span>
        <span class="stat-label">{t('badges', $lang)}</span>
      </div>
    </div>

    <div class="progress-bar-wrap">
      <span class="prog-label">{t('lesson', $lang)} {completedCount} {t('of', $lang)} 30</span>
      <div class="progress-track">
        <div class="progress-fill" style="width:{(completedCount/30)*100}%"></div>
      </div>
    </div>

    {#if currentLesson}
      <button class="cta" onclick={() => goto(`/lesson/${currentLesson!.id}`)}>
        <span class="cta-sub">{t('startLesson', $lang)}</span>
        <span class="cta-title">{$lang === 'en' ? currentLesson.title_en : currentLesson.title_fr}</span>
      </button>
    {:else}
      <div class="cta done">🎓 {$lang === 'en' ? 'All lessons complete!' : 'Toutes les leçons terminées!'}</div>
    {/if}

    {#if leaderboard.length > 0}
      <div class="leaderboard-card">
        <h3>🏆 {t('leaderboard', $lang)}</h3>
        {#each leaderboard as entry, i}
          <div class="lb-row" class:self={entry.is_self}>
            <span class="lb-rank">{i + 1}</span>
            <span class="lb-name">{entry.username}{entry.is_self ? ` ← ${t('you', $lang)}` : ''}</span>
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
