// Server-side API route for admin user management (create / delete)
import { json, error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

// POST /admin/api/users — create a user
export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { username, password, role, grade, teacher_id } = body;

  if (!username || !password || !role) {
    throw error(400, 'Missing required fields');
  }

  const email = `${username}@mathprimaire.local`;

  // Create auth user via admin API
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authErr) {
    const msg = authErr.message.toLowerCase().includes('already')
      ? 'usernameExists'
      : authErr.message;
    throw error(409, msg);
  }

  // Create public profile
  const profile: Record<string, unknown> = {
    id: authData.user.id,
    username,
    role,
    language: 'en'
  };
  if (role === 'student') {
    profile.grade = grade ?? 5;
    if (teacher_id) profile.teacher_id = teacher_id;
  }

  const { error: profileErr } = await supabaseAdmin.from('users').insert(profile);
  if (profileErr) {
    // Roll back auth user if profile insert fails
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw error(500, profileErr.message);
  }

  return json({ id: authData.user.id, username });
};

// DELETE /admin/api/users — delete a user by id
export const DELETE: RequestHandler = async ({ request }) => {
  const { id, role } = await request.json();

  if (!id) throw error(400, 'Missing user id');
  if (role === 'admin') throw error(403, 'Cannot delete admin');

  // Delete profile first (FK constraint), then auth user
  await supabaseAdmin.from('users').delete().eq('id', id);
  const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id);

  if (authErr) throw error(500, authErr.message);

  return json({ ok: true });
};
