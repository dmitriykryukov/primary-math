<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { supabase } from '$lib/supabase';
  import { t, lang } from '$lib/i18n/index';
  import type { UserProfile } from '$lib/types';

  let teachers: UserProfile[] = $state([]);
  let students: UserProfile[] = $state([]);

  // New user form
  let newUsername = $state('');
  let newPassword = $state('');
  let newRole = $state<'teacher' | 'student'>('student');
  let newGrade = $state<5 | 6>(5);
  let newTeacherId = $state('');
  let formError = $state('');
  let formSuccess = $state('');
  let loading = $state(false);

  onMount(async () => {
    const user = $authStore.user;
    if (!user || user.role !== 'admin') {
      goto(user?.role === 'student' ? '/dashboard' : user?.role === 'teacher' ? '/teacher' : '/');
      return;
    }
    await loadUsers();
  });

  async function loadUsers() {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? '';
    const res = await fetch('/admin/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    teachers = (data.teachers ?? []) as UserProfile[];
    students = (data.students ?? []) as UserProfile[];
  }

  async function createUser() {
    formError = '';
    formSuccess = '';
    loading = true;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? '';
      const res = await fetch('/admin/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
          grade: newRole === 'student' ? newGrade : null,
          teacher_id: newRole === 'student' && newTeacherId ? newTeacherId : null
        })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: res.statusText }));
        const key = body.message ?? res.statusText;
        formError = t(key as any, $lang) || key;
        return;
      }

      formSuccess = `${t('createUser', $lang)}: "${newUsername}" ✓`;
      newUsername = '';
      newPassword = '';
      await loadUsers();
    } catch (e: any) {
      formError = e.message;
    } finally {
      loading = false;
    }
  }

  async function deleteUser(user: UserProfile) {
    if (user.role === 'admin') return;
    if (!confirm(t('confirmDelete', $lang).replace('{name}', user.username))) return;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? '';
    const res = await fetch('/admin/api/users', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id: user.id, role: user.role })
    });

    if (res.ok) {
      await loadUsers();
    }
  }
</script>

<div class="admin">
  <h2>{t('adminPanel', $lang)}</h2>

  <!-- Create user form -->
  <div class="create-form">
    <h3>{t('createUser', $lang)}</h3>
    <div class="form-row">
      <label>
        {t('username', $lang)}
        <input bind:value={newUsername} type="text" autocomplete="off" required />
      </label>
      <label>
        {t('password', $lang)}
        <input bind:value={newPassword} type="password" autocomplete="new-password" required />
      </label>
    </div>
    <div class="form-row">
      <label>
        {t('roleLabel', $lang)}
        <select bind:value={newRole}>
          <option value="student">{t('student', $lang)}</option>
          <option value="teacher">{t('teacher', $lang)}</option>
        </select>
      </label>
      {#if newRole === 'student'}
        <label>
          {t('gradeLabel', $lang)}
          <select bind:value={newGrade}>
            <option value={5}>{t('grade5', $lang)}</option>
            <option value={6}>{t('grade6', $lang)}</option>
          </select>
        </label>
        <label>
          {t('assignTeacher', $lang)}
          <select bind:value={newTeacherId}>
            <option value="">{t('noneOption', $lang)}</option>
            {#each teachers as teacher}
              <option value={teacher.id}>{teacher.username}</option>
            {/each}
          </select>
        </label>
      {/if}
    </div>

    {#if formError}<p class="msg error">{formError}</p>{/if}
    {#if formSuccess}<p class="msg success">{formSuccess}</p>{/if}

    <button
      class="btn-primary"
      onclick={createUser}
      disabled={loading || !newUsername || !newPassword}
    >
      {loading ? t('creating', $lang) : t('createUser', $lang)}
    </button>
  </div>

  <!-- Teachers list -->
  <div class="user-table">
    <h3>{t('teachers', $lang)}</h3>
    {#if teachers.length === 0}
      <p class="empty">—</p>
    {:else}
      {#each teachers as user}
        <div class="user-row">
          <span class="uname">{user.username}</span>
          <button class="del-btn" onclick={() => deleteUser(user)}>{t('deleteUser', $lang)}</button>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Students list -->
  <div class="user-table">
    <h3>{t('students', $lang)}</h3>
    {#if students.length === 0}
      <p class="empty">—</p>
    {:else}
      {#each students as user}
        <div class="user-row">
          <span class="uname">{user.username}</span>
          <span class="grade-tag">{user.grade === 6 ? t('grade6', $lang) : t('grade5', $lang)}</span>
          <button class="del-btn" onclick={() => deleteUser(user)}>{t('deleteUser', $lang)}</button>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .admin { display: flex; flex-direction: column; gap: 24px; }
  h2 { font-size: 22px; font-weight: 900; }
  h3 { font-size: 16px; font-weight: 700; margin-bottom: 12px; }

  .create-form {
    background: var(--surface);
    border-radius: var(--radius-lg);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .form-row { display: flex; gap: 12px; flex-wrap: wrap; }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    color: var(--muted);
    flex: 1;
    min-width: 140px;
  }

  input, select {
    background: var(--bg);
    border: 2px solid var(--surface);
    color: var(--text, #fff);
    border-radius: var(--radius);
    padding: 10px 12px;
    font-size: 14px;
    min-height: 44px;
  }
  input:focus, select:focus { outline: none; border-color: var(--primary); }

  .btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: #fff;
    border: none;
    border-radius: var(--radius);
    padding: 14px;
    font-size: 15px;
    font-weight: 700;
    min-height: 48px;
    cursor: pointer;
    align-self: flex-start;
    min-width: 160px;
  }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-primary:not(:disabled):hover { opacity: 0.9; }

  .msg { font-size: 13px; margin: 0; }
  .error { color: var(--danger); }
  .success { color: var(--success); }

  .user-table {
    background: var(--surface);
    border-radius: var(--radius-lg);
    padding: 16px;
  }

  .empty { color: var(--muted); font-size: 13px; text-align: center; padding: 12px 0; }

  .user-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid var(--bg);
    font-size: 14px;
  }
  .user-row:last-child { border-bottom: none; }

  .uname { flex: 1; font-weight: 600; }

  .grade-tag {
    color: var(--muted);
    font-size: 12px;
    background: var(--bg);
    border-radius: 999px;
    padding: 2px 8px;
  }

  .del-btn {
    background: none;
    border: 1px solid var(--danger);
    color: var(--danger);
    border-radius: 999px;
    padding: 4px 12px;
    font-size: 12px;
    cursor: pointer;
    min-height: 44px;
    white-space: nowrap;
  }
  .del-btn:hover { background: var(--danger); color: #fff; }
</style>
