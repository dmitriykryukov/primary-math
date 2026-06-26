<script lang="ts">
  import { t, lang, setLang } from '$lib/i18n/index';
  import { login, authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  let username = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);
  let showPassword = $state(false);

  $effect(() => {
    if ($authStore.user) redirectByRole($authStore.user.role);
  });

  function redirectByRole(role: string) {
    if (role === 'student') goto('/dashboard');
    else if (role === 'admin') goto('/admin');
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

<div class="page">

  <!-- Language toggle -->
  <button class="lang-btn" onclick={() => setLang($lang === 'en' ? 'fr' : 'en')}>
    {$lang === 'en' ? 'FR' : 'EN'}
  </button>

  <!-- Floating math decorations -->
  <div class="deco" style="top:8%;left:6%;color:#FF9800;animation-delay:0s">3</div>
  <div class="deco" style="top:14%;left:14%;color:#4CAF50;font-size:42px;animation-delay:0.5s">+</div>
  <div class="deco" style="top:60%;left:5%;color:#4361EE;animation-delay:1s">2</div>
  <div class="deco" style="top:78%;left:12%;color:#9C27B0;font-size:36px;animation-delay:1.5s">÷</div>
  <div class="deco" style="top:10%;right:12%;color:#4CC9F0;animation-delay:0.3s">5</div>
  <div class="deco" style="top:20%;right:5%;color:#E91E8C;font-size:38px;animation-delay:0.8s">×</div>
  <div class="deco" style="top:65%;right:8%;color:#FF6B35;animation-delay:1.2s">1</div>
  <div class="deco" style="top:80%;right:15%;color:#FFD93D;font-size:40px;animation-delay:0.2s">−</div>

  <!-- Clouds -->
  <div class="cloud" style="top:12%;left:22%"></div>
  <div class="cloud" style="top:8%;right:25%;width:100px;height:36px"></div>
  <div class="cloud" style="top:18%;left:38%;width:70px;height:26px;opacity:0.6"></div>

  <!-- Characters -->
  <div class="char char-left">👦</div>
  <div class="char char-right">👧</div>

  <!-- Login card -->
  <div class="card">
    <!-- Logo -->
    <div class="logo">
      <span class="l-blue">M</span><span class="l-orange">a</span><span class="l-green">t</span><span class="l-pink">h</span>
      <span class="l-purple"> Primaire</span>
    </div>
    <div class="subtitle-pill">
      {$lang === 'en' ? 'Learning Online' : 'Apprentissage en ligne'}
    </div>

    <!-- Form -->
    <form onsubmit={handleSubmit}>
      <div class="field">
        <span class="field-icon">👤</span>
        <input
          type="text"
          bind:value={username}
          placeholder={t('username', $lang)}
          autocomplete="username"
          required
        />
      </div>
      <div class="field">
        <span class="field-icon">🔒</span>
        <input
          type={showPassword ? 'text' : 'password'}
          bind:value={password}
          placeholder={t('password', $lang)}
          autocomplete="current-password"
          required
        />
        <button
          type="button"
          class="eye-btn"
          onclick={() => showPassword = !showPassword}
          aria-label="Toggle password visibility"
        >
          {showPassword ? '👁' : '🙈'}
        </button>
      </div>
      {#if error}<p class="error">{error}</p>{/if}
      <button type="submit" class="btn-login" disabled={loading}>
        {loading ? '…' : t('login', $lang)}
      </button>
    </form>

    <!-- Tagline -->
    <p class="tagline">
      {$lang === 'en'
        ? 'Learn • Have Fun • Succeed'
        : 'Apprendre • S\'amuser • Réussir'}
    </p>
  </div>

</div>

<style>
  :global(body) { background: #5bb8f5; }

  .page {
    min-height: 100dvh;
    background: linear-gradient(180deg, #5bb8f5 0%, #87CEEB 55%, #7BC67E 80%, #4CAF50 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding: 20px;
  }

  /* Language toggle */
  .lang-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(255,255,255,0.9);
    border: none;
    border-radius: 999px;
    padding: 6px 16px;
    font-size: 13px;
    font-weight: 800;
    color: #4361EE;
    cursor: pointer;
    z-index: 10;
    min-height: 36px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  .lang-btn:hover { background: white; }

  /* Floating decorations */
  .deco {
    position: absolute;
    font-size: 44px;
    font-weight: 900;
    opacity: 0.85;
    animation: float 3s ease-in-out infinite;
    pointer-events: none;
    text-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(-3deg); }
    50%       { transform: translateY(-14px) rotate(3deg); }
  }

  /* Clouds */
  .cloud {
    position: absolute;
    width: 120px;
    height: 44px;
    background: white;
    border-radius: 999px;
    opacity: 0.8;
    pointer-events: none;
  }
  .cloud::before, .cloud::after {
    content: '';
    position: absolute;
    background: white;
    border-radius: 50%;
  }
  .cloud::before { width: 60px; height: 60px; top: -24px; left: 20px; }
  .cloud::after  { width: 44px; height: 44px; top: -18px; right: 22px; }

  /* Characters */
  .char {
    position: absolute;
    font-size: 110px;
    bottom: 0;
    line-height: 1;
    pointer-events: none;
    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));
  }
  .char-left  { left: 4%; }
  .char-right { right: 4%; }

  /* Login card */
  .card {
    background: white;
    border-radius: 24px;
    padding: 32px 28px 24px;
    width: 100%;
    max-width: 360px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.18);
    text-align: center;
    position: relative;
    z-index: 5;
  }

  /* Logo */
  .logo {
    font-size: 40px;
    font-weight: 900;
    line-height: 1;
    margin-bottom: 8px;
    letter-spacing: -1px;
  }
  .l-blue   { color: #4361EE; }
  .l-orange { color: #FF9800; }
  .l-green  { color: #4CAF50; }
  .l-pink   { color: #E91E8C; }
  .l-purple { color: #1a237e; }

  .subtitle-pill {
    display: inline-block;
    background: linear-gradient(135deg, #4361EE, #4CC9F0);
    color: white;
    border-radius: 999px;
    padding: 5px 20px;
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 24px;
  }

  /* Form */
  form { display: flex; flex-direction: column; gap: 12px; }

  .field {
    position: relative;
    display: flex;
    align-items: center;
  }
  .field-icon {
    position: absolute;
    left: 14px;
    font-size: 16px;
    pointer-events: none;
  }
  .field input {
    width: 100%;
    padding: 13px 44px 13px 44px;
    border: 2px solid #e8e8e8;
    border-radius: 999px;
    font-size: 14px;
    color: #333;
    background: #f8f8f8;
    outline: none;
    box-sizing: border-box;
    min-height: 48px;
  }
  .field input:focus { border-color: #4361EE; background: white; }
  .field input::placeholder { color: #aaa; }

  .eye-btn {
    position: absolute;
    right: 14px;
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    padding: 4px;
    line-height: 1;
  }

  .btn-login {
    background: linear-gradient(135deg, #4361EE, #4CC9F0);
    color: white;
    border: none;
    border-radius: 999px;
    padding: 14px;
    font-size: 16px;
    font-weight: 800;
    min-height: 52px;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(67,97,238,0.4);
    transition: opacity 0.15s;
    margin-top: 4px;
  }
  .btn-login:hover { opacity: 0.9; }
  .btn-login:disabled { opacity: 0.5; cursor: not-allowed; }

  .error {
    color: #E53935;
    font-size: 13px;
    margin: 0;
    font-weight: 600;
  }

  .tagline {
    margin: 20px 0 0;
    font-size: 13px;
    font-weight: 700;
    color: #4361EE;
    letter-spacing: 0.5px;
  }

  /* Hide characters on small screens */
  @media (max-width: 640px) {
    .char { display: none; }
    .deco { font-size: 28px; }
  }
</style>
