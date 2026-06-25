<script lang="ts">
  import { lang, setLang, t } from '$lib/i18n/index';
  import { authStore, logout } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  async function handleLogout() {
    await logout();
    goto('/');
  }
</script>

<nav>
  <span class="username">{$authStore.user?.username ?? ''}</span>
  <div class="controls">
    <button
      class="lang-toggle"
      onclick={() => setLang($lang === 'en' ? 'fr' : 'en')}
      aria-label="Toggle language"
    >
      {$lang === 'en' ? 'FR' : 'EN'}
    </button>
    {#if $authStore.user}
      <button class="logout" onclick={handleLogout}>{t('logout', $lang)}</button>
    {/if}
  </div>
</nav>

<style>
  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: var(--surface);
    min-height: 52px;
  }
  .username { color: var(--accent); font-weight: 700; }
  .controls { display: flex; gap: 10px; align-items: center; }
  .lang-toggle, .logout {
    background: var(--bg);
    color: var(--text);
    border: 1px solid var(--primary);
    border-radius: 999px;
    padding: 6px 16px;
    font-size: 13px;
    font-weight: 700;
    min-height: 44px;
    cursor: pointer;
  }
  .lang-toggle:hover, .logout:hover { background: var(--primary); }
</style>
