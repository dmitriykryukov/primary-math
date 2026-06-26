<script lang="ts">
  import '../app.css';
  import TopBar from '$lib/components/TopBar.svelte';
  import { authStore, loadSession } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { page } from '$app/state';

  let { children } = $props();

  onMount(async () => {
    await loadSession();
    const path = page.url.pathname;
    const user = $authStore.user;
    if (!user && path !== '/') goto('/');
  });
</script>

<svelte:head>
  <link rel="icon" href="/favicon.ico" />
</svelte:head>

{#if page.url.pathname !== '/'}
  <TopBar />
{/if}
<main class:login-main={page.url.pathname === '/'}>
  {@render children()}
</main>

<style>
  main { max-width: 800px; margin: 0 auto; padding: 20px 16px; }
  main.login-main { max-width: 100%; padding: 0; margin: 0; }
</style>
