<script lang="ts">
  let { streak }: { streak: number } = $props();
</script>

<div class="streak">
  <span class="fire">🔥</span>
  <span class="count">{streak}</span>
</div>

<style>
  .streak { display: flex; align-items: center; gap: 4px; }
  .fire { font-size: 24px; }
  .count { font-size: 28px; font-weight: 900; color: var(--danger); }
</style>
