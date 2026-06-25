<script lang="ts">
  let { total, current, skipped, correct, wrong, onJump } = $props<{
    total: number;
    current: number;
    skipped: Set<number>;
    correct: Set<number>;
    wrong: Set<number>;
    onJump?: (i: number) => void;
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
    {#if onJump}
      <button
        class="dot {dotColor(i)}"
        title={`Q${i+1}`}
        onclick={() => onJump(i)}
        onkeydown={(e) => e.key === 'Enter' && onJump(i)}
      ></button>
    {:else}
      <div class="dot {dotColor(i)}" title={`Q${i+1}`}></div>
    {/if}
  {/each}
</div>

<style>
  .dots { display: flex; flex-wrap: wrap; gap: 5px; }
  .dot {
    width: 12px; height: 12px; border-radius: 50%;
    background: var(--surface); transition: background 0.2s;
    border: none; padding: 0; cursor: default;
  }
  .dot.correct { background: var(--accent); }
  .dot.wrong { background: var(--danger); }
  .dot.skipped { background: var(--warn); }
  .dot.current { background: var(--surface); border: 2px solid var(--accent); }
  .dot.empty { background: var(--surface); }
  button.dot { cursor: pointer; }
</style>
