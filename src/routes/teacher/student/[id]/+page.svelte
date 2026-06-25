<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { supabase } from '$lib/supabase';
  import { t, lang } from '$lib/i18n/index';
  import type { Lesson, StudentProgress } from '$lib/types';

  let student: { username: string; grade: number; teacher_id: string } | null = $state(null);
  let lessons: Lesson[] = $state([]);
  let progress: StudentProgress[] = $state([]);
  let loading = $state(true);

  onMount(async () => {
    try {
      const user = $authStore.user;
      if (!user || user.role === 'student') { goto('/'); return; }

      const studentId = page.params.id;
      const [sRes, pRes] = await Promise.all([
        supabase.from('users').select('username, grade, teacher_id').eq('id', studentId).single(),
        supabase.from('student_progress').select('*').eq('student_id', studentId).order('completed_at')
      ]);

      student = sRes.data;
      progress = (pRes.data ?? []) as StudentProgress[];

      if (student && user.role !== 'admin' && student.teacher_id !== user.id) {
        goto('/teacher');
        return;
      }

      if (student) {
        const { data } = await supabase.from('lessons').select('*').eq('grade', student.grade).order('order_index');
        lessons = (data ?? []) as Lesson[];
      }
    } finally {
      loading = false;
    }
  });

  function getProgress(lessonId: number) {
    return progress.filter(p => p.lesson_id === lessonId).sort((a, b) =>
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );
  }
</script>

{#if loading}
  <p style="color:var(--muted);text-align:center;padding:40px">…</p>
{:else if student}
  <div>
    <button class="back-btn" onclick={() => goto('/teacher')}>{t('backToDashboard', $lang)}</button>
    <h2>{student.username} — {t('grade', $lang)} {student.grade}</h2>

    <div class="lesson-list">
      {#each lessons as lesson}
        {@const attempts = getProgress(lesson.id)}
        {@const best = attempts.length ? Math.max(...attempts.map(a => a.score)) : null}
        <div class="lesson-row" class:completed={attempts.length > 0}>
          <span class="lesson-num">{lesson.order_index}</span>
          <span class="lesson-title">{$lang === 'en' ? lesson.title_en : lesson.title_fr}</span>
          {#if best !== null}
            <span class="best-score" style="color:{best >= 15 ? 'var(--success)' : best >= 10 ? 'var(--warn)' : 'var(--danger)'}">{best}/20{best >= 15 ? ' 🏅' : ''}</span>
            <span class="attempts">{attempts.length}×</span>
          {:else}
            <span class="not-done" style="color:var(--muted)">—</span>
            <span></span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{:else}
  <p style="color:var(--muted);text-align:center;padding:40px">Student not found.</p>
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
