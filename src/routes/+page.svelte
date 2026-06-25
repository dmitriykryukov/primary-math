<script lang="ts">
  import { t, lang } from '$lib/i18n/index';
  import { login, authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  let username = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  $effect(() => {
    if ($authStore.user) redirectByRole($authStore.user.role);
  });

  function redirectByRole(role: string) {
    if (role === 'student') goto('/dashboard');
    else goto('/teacher');
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    loading = true;
    try {
      await login(username, password);
      redirectByRole($authStore.user!.role);
    } catch {
      error = t('invalidCredentials', $lang);
    } finally {
      loading = false;
    }
  }
</script>

<div class="login-wrap">
  <h1>MathPrimaire</h1>
  <p class="subtitle">
    {$lang === 'en' ? 'Daily Math Practice · Grades 5 & 6' : 'Pratique quotidienne · 5e et 6e année'}
  </p>

  <form onsubmit={handleSubmit}>
    <label>
      {t('username', $lang)}
      <input bind:value={username} type="text" autocomplete="username" required />
    </label>
    <label>
      {t('password', $lang)}
      <input bind:value={password} type="password" autocomplete="current-password" required />
    </label>
    {#if error}<p class="error">{error}</p>{/if}
    <button type="submit" disabled={loading} class="btn-primary">
      {loading ? '…' : t('login', $lang)}
    </button>
  </form>
</div>

<style>
  .login-wrap {
    max-width: 400px; margin: 60px auto; text-align: center;
  }
  h1 { font-size: 36px; font-weight: 900; color: var(--accent); margin-bottom: 8px; }
  .subtitle { color: var(--muted); margin-bottom: 40px; }
  form { display: flex; flex-direction: column; gap: 16px; text-align: left; }
  label { display: flex; flex-direction: column; gap: 6px; font-size: 14px; color: var(--muted); }
  input {
    background: var(--surface); border: 2px solid var(--surface);
    color: var(--text); border-radius: var(--radius); padding: 12px 16px;
    font-size: 16px; min-height: 44px;
  }
  input:focus { outline: none; border-color: var(--primary); }
  .btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: white; border: none; border-radius: var(--radius);
    padding: 14px; font-size: 16px; font-weight: 700; min-height: 52px;
    cursor: pointer;
  }
  .error { color: var(--danger); font-size: 14px; }
</style>
