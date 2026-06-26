<script lang="ts">
  import { lang, setLang, t } from "$lib/i18n/index"
  import { authStore, logout } from "$lib/stores/auth"
  import { goto } from "$app/navigation"

  let showModal = $state(false);
  let modalEl = $state<HTMLElement | null>(null);

  $effect(() => { if (showModal) modalEl?.focus(); });

  async function handleLogout() {
    showModal = false;
    await logout();
    goto("/");
  }
</script>

<nav>
  <span class="username">{$authStore.user?.username ?? ""}</span>
  <div class="controls">
    {#if $authStore.user}
      <button class="logout" onclick={() => showModal = true}>{t("logout", $lang)}</button>
      <button class="lang-toggle" onclick={() => setLang($lang === "en" ? "fr" : "en")} aria-label="Toggle language">
        {$lang === "en" ? "FR" : "EN"}
      </button>
    {/if}
  </div>
</nav>

{#if showModal}
  <div
    class="overlay"
    role="presentation"
    onclick={() => showModal = false}
    onkeydown={(e) => e.key === 'Escape' && (showModal = false)}
  >
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      bind:this={modalEl}
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => { if (e.key === 'Escape') showModal = false; else e.stopPropagation(); }}
    >
      <p>{t("logoutConfirm", $lang)}</p>
      <div class="modal-actions">
        <button class="btn-cancel" onclick={() => showModal = false}>{t("logoutCancel", $lang)}</button>
        <button class="btn-logout" onclick={handleLogout}>{t("logout", $lang)}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: var(--surface);
    min-height: 52px;
  }
  .username {
    color: var(--accent);
    font-weight: 700;
  }
  .controls {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .lang-toggle,
  .logout {
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
  .lang-toggle:hover,
  .logout:hover {
    background: var(--primary);
  }

  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }
  .modal {
    background: var(--surface);
    border-radius: var(--radius-lg);
    padding: 28px 24px;
    max-width: 320px;
    width: 90%;
    text-align: center;
  }
  .modal p {
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 24px;
  }
  .modal-actions {
    display: flex;
    gap: 10px;
  }
  .btn-cancel {
    flex: 1;
    background: var(--bg);
    color: var(--muted);
    border: 1px solid var(--muted);
    border-radius: var(--radius);
    font-size: 14px;
    font-weight: 700;
    min-height: 48px;
    cursor: pointer;
  }
  .btn-cancel:hover { border-color: var(--text); color: var(--text); }
  .btn-logout {
    flex: 1;
    background: var(--danger);
    color: white;
    border: none;
    border-radius: var(--radius);
    font-size: 14px;
    font-weight: 700;
    min-height: 48px;
    cursor: pointer;
  }
  .btn-logout:hover { opacity: 0.85; }
</style>
