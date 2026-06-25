<!-- src/routes/lesson/[id]/score/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { t, lang } from '$lib/i18n/index';
  import ScoreRing from '$lib/components/ScoreRing.svelte';
  import Confetti from '$lib/components/Confetti.svelte';
  import { authStore } from '$lib/stores/auth';
  import { onMount } from 'svelte';

  let score = $derived(parseInt($page.url.searchParams.get('score') ?? '0'));
  let badgeEarned = $derived($page.url.searchParams.get('badge') === 'true');
  let lessonId = $derived($page.params.id);
  let great = $derived(score >= 15);
  let toEarnBadge = $derived(15 - score);

  let streak = $state(0);

  onMount(async () => {
    const { supabase } = await import('$lib/supabase');
    const { data } = await supabase
      .from('streaks')
      .select('current_streak')
      .eq('student_id', $authStore.user!.id)
      .maybeSingle();
    streak = data?.current_streak ?? 0;
  });
</script>

{#if badgeEarned}
  <Confetti />
{/if}

<div class="score-screen">
  <div class="emoji">{great ? '🎉' : '💪'}</div>
  <h1>{t(great ? 'excellent' : 'goodEffort', $lang)}, {$authStore.user?.username}!</h1>

  <ScoreRing {score} />

  {#if badgeEarned}
    <div class="badge-banner">
      <span class="badge-icon">🏅</span>
      <div>
        <div class="badge-title">{t('badgeEarned', $lang)}</div>
      </div>
    </div>
  {:else}
    <div class="encouragement">
      <div class="enc-bar-wrap">
        <div class="enc-bar"><div class="enc-fill" style="width:{(score / 15) * 100}%"></div></div>
        <span>{score} / 15</span>
      </div>
      <p>{toEarnBadge} {t('needForBadge', $lang)}</p>
    </div>
  {/if}

  {#if streak > 0}
    <div class="streak-update">🔥 {streak}-day streak!</div>
  {/if}

  <div class="actions">
    {#if !great}
      <button class="btn-primary" onclick={() => goto(`/lesson/${lessonId}`)}>
        {t('tryAgain', $lang)}
      </button>
    {/if}
    <button class="btn-secondary" onclick={() => goto('/dashboard')}>
      {great ? t('backToDashboard', $lang) : t('continueNext', $lang)}
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
    cursor: pointer;
  }
  .btn-secondary {
    background: var(--surface); color: var(--muted); border: none;
    border-radius: var(--radius); padding: 14px; font-size: 15px; min-height: 52px;
    cursor: pointer;
  }
</style>
