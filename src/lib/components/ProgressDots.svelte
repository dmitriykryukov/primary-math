<script lang="ts">
  let { total, current, answers, skipped, correct, wrong } = $props<{
    total: number;
    current: number;
    answers: Record<string, string>;
    skipped: Set<number>;
    correct: Set<number>;
    wrong: Set<number>;
  }>();

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
