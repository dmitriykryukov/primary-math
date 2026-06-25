<!-- src/lib/components/ScoreRing.svelte -->
<script lang="ts">
  let { score, total = 20 }: { score: number; total?: number } = $props();

  let pct = $derived(score / total);
  let circumference = $derived(2 * Math.PI * 42);
  let offset = $derived(circumference * (1 - pct));
</script>

<div class="ring-wrap">
  <svg width="120" height="120" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="var(--primary)"/>
        <stop offset="100%" stop-color="var(--accent)"/>
      </linearGradient>
    </defs>
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
