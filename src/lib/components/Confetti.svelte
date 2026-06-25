<!-- src/lib/components/Confetti.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  type Particle = { x: number; y: number; color: string; size: number; vx: number; vy: number; opacity: number };

  let particles = $state<Particle[]>([]);
  const colors = ['#4361EE', '#4CC9F0', '#FFD93D', '#FF6B35', '#6BCB77'];

  onMount(() => {
    particles = Array.from({ length: 60 }, () => ({
      x: 50 + (Math.random() - 0.5) * 60,
      y: 20 + Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 3,
      opacity: 1
    }));

    let frame: number;
    function animate() {
      particles = particles
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.1, opacity: p.opacity - 0.012 }))
        .filter(p => p.opacity > 0);
      if (particles.length > 0) frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  });
</script>

<div class="confetti-wrap" aria-hidden="true">
  {#each particles as p}
    <div
      class="particle"
      style="left:{p.x}%;top:{p.y}%;width:{p.size}px;height:{p.size}px;background:{p.color};opacity:{p.opacity}"
    ></div>
  {/each}
</div>

<style>
  .confetti-wrap { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 100; }
  .particle { position: absolute; border-radius: 2px; }
</style>
