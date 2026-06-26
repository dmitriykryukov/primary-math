<script lang="ts">
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { t, lang } from '$lib/i18n/index';
  import { supabase } from '$lib/supabase';
  import ProgressDots from '$lib/components/ProgressDots.svelte';
  import type { Question, Lesson } from '$lib/types';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let current = $state(0);
  let answers = $state<Record<string, string>>({});
  let selected = $state<string | null>(null);
  let typedInput = $state('');
  let skipped = $state(new Set<number>());
  let correct = $state(new Set<number>());
  let wrong = $state(new Set<number>());

  let q = $derived(data.questions[current]);
  let isTyped = $derived(q?.type === 'typed');
  let totalAnswered = $derived(Object.keys(answers).length);

  function confirm() {
    const val = isTyped ? typedInput.trim() : (selected ?? '');
    if (!val) return;
    answers = { ...answers, [q.id]: val };
    const isCorrect = val.trim() === q.correct_answer.trim();
    if (isCorrect) {
      correct = new Set([...correct, current]);
    } else {
      wrong = new Set([...wrong, current]);
    }
    skipped = new Set([...skipped].filter(i => i !== current));
    selected = null;
    typedInput = '';
    advance();
  }

  function skip() {
    skipped = new Set([...skipped, current]);
    selected = null;
    typedInput = '';
    advance();
  }

  function advance() {
    // Find next unanswered, non-skipped question
    for (let i = current + 1; i < data.questions.length; i++) {
      if (!answers[data.questions[i].id] && !skipped.has(i)) { current = i; return; }
    }
    for (let i = 0; i < current; i++) {
      if (!answers[data.questions[i].id] && !skipped.has(i)) { current = i; return; }
    }
    // Check if all questions are either answered or skipped
    const answeredOrSkipped = data.questions.every((_, i) => answers[data.questions[i].id] || skipped.has(i));
    if (answeredOrSkipped) {
      finishLesson();
    }
  }

  function jumpTo(i: number) {
    current = i;
    selected = null;
    typedInput = '';
  }

  async function finishLesson() {
    const score = data.questions.filter(q => answers[q.id]?.trim() === q.correct_answer.trim()).length;
    const user = $authStore.user!;

    await Promise.all([
      supabase.from('student_progress').insert({
        student_id: user.id,
        lesson_id: data.lesson.id,
        score,
        answers
      }),
      updateStreak(user.id)
    ]);

    // Award badge if score >= 15; use explicit conflict target to avoid duplicate inserts on retry
    if (score >= 15) {
      await supabase.from('badges').upsert(
        { student_id: user.id, lesson_id: data.lesson.id, earned_at: new Date().toISOString() },
        { onConflict: 'student_id,lesson_id', ignoreDuplicates: true }
      );
    }

    goto(`/lesson/${data.lesson.id}/score?score=${score}&badge=${score >= 15}`);
  }

  async function updateStreak(studentId: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('streaks')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (!existing) {
      await supabase.from('streaks').insert({
        student_id: studentId,
        current_streak: 1,
        longest_streak: 1,
        last_practice_date: today
      });
      return;
    }

    const last = existing.last_practice_date;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let newStreak: number;
    if (last === today) {
      newStreak = existing.current_streak;
    } else if (last === yesterday) {
      newStreak = existing.current_streak + 1;
    } else {
      newStreak = 1;
    }
    const longest = Math.max(newStreak, existing.longest_streak);

    await supabase.from('streaks').update({
      current_streak: newStreak,
      longest_streak: longest,
      last_practice_date: today
    }).eq('student_id', studentId);
  }
</script>

<div class="exercise">
  <div class="lesson-title">{$lang === 'en' ? data.lesson.title_en : data.lesson.title_fr}</div>
  <div class="progress-info">
    <span>{t('question', $lang)} {current + 1} {t('of', $lang)} {data.questions.length}</span>
  </div>
  <ProgressDots
    total={data.questions.length}
    {current}
    {skipped}
    {correct}
    {wrong}
    onJump={jumpTo}
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
        <button class="num-key" onclick={() => {
          if (key === '⌫') typedInput = typedInput.slice(0,-1);
          else typedInput += key;
        }}>{key}</button>
      {/each}
    </div>
    <button class="btn-confirm" onclick={confirm} disabled={!typedInput}>{t('confirm', $lang)}</button>
  {:else}
    <div class="choices">
      {#each (q.options ?? []) as option}
        <button
          class="choice"
          class:chosen={selected === option}
          onclick={() => selected = option}
        >{option}</button>
      {/each}
    </div>
    <button class="btn-confirm" onclick={confirm} disabled={!selected}>{t('confirm', $lang)}</button>
  {/if}

  <button class="skip-btn" onclick={skip}>{t('skip', $lang)}</button>
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
    cursor: pointer;
  }
  .btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
  .skip-btn {
    background: none; border: none; color: var(--muted);
    text-decoration: underline; font-size: 14px; min-height: 44px; cursor: pointer;
  }
</style>
