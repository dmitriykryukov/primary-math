// Server-side API route for admin user management (create / delete / list)
import { json, error } from '@sveltejs/kit';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import type { RequestHandler } from './$types';

// Returns { client } if the caller is an authenticated admin, or a Response (401/403).
// The returned client uses the caller's JWT so DB operations respect the authenticated role.
async function requireAdmin(request: Request): Promise<{ client: SupabaseClient } | Response> {
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const userClient = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await userClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
  return { client: userClient };
}

// GET /admin/api/users — list all teachers and students
export const GET: RequestHandler = async ({ request }) => {
  const result = await requireAdmin(request);
  if (result instanceof Response) return result;
  const { client } = result;

  const [tRes, sRes] = await Promise.all([
    client.from('users').select('*').eq('role', 'teacher').order('username'),
    client.from('users').select('*').eq('role', 'student').order('username')
  ]);

  return json({
    teachers: tRes.data ?? [],
    students: sRes.data ?? []
  });
};

// POST /admin/api/users — create a user
export const POST: RequestHandler = async ({ request }) => {
  const result = await requireAdmin(request);
  if (result instanceof Response) return result;
  const { client } = result;

  const body = await request.json();
  const { username, password, role, grade, teacher_id } = body;

  if (!username || !password || !role) {
    throw error(400, 'Missing required fields');
  }

  const email = `${username}@mathprimaire.local`;

  // Create auth user via admin API (requires service role)
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

  // Insert public profile using the caller's authenticated session
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

  const { error: profileErr } = await client.from('users').insert(profile);
  if (profileErr) {
    // Roll back auth user if profile insert fails
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw error(500, profileErr.message);
  }

  return json({ id: authData.user.id, username });
};

// DELETE /admin/api/users — delete a user by id
export const DELETE: RequestHandler = async ({ request }) => {
  const result = await requireAdmin(request);
  if (result instanceof Response) return result;

  const { id, role } = await request.json();

  if (!id) throw error(400, 'Missing user id');
  if (role === 'admin') throw error(403, 'Cannot delete admin');

  // Deleting the auth user cascades to public.users via ON DELETE CASCADE
  const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (authErr) throw error(500, authErr.message);

  return json({ ok: true });
};
