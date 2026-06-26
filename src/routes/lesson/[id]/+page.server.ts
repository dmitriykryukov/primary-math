import { supabase } from '$lib/supabase';
import { generateQuestions } from '$lib/questions/generator';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// v1 known gap: sequential lesson unlock is NOT enforced here.
// This server load uses the anon Supabase client ($lib/supabase) which has no
// access to the authenticated user's session in a server context — the project
// has no hooks.server.ts, no @supabase/ssr cookie integration, and no
// event.locals session. Adding a server-side guard would require introducing
// @supabase/ssr and a hooks.server.ts to propagate the session server-side.
// Security note: RLS policies ensure students can only read/write their own
// progress rows; skipping lessons gains no data access advantage, only a UX
// bypass. Enforce the sequential unlock client-side (dashboard CTA) until a
// proper SSR session layer is added in v2.

export const load: PageServerLoad = async ({ params }) => {
  const lessonId = parseInt(params.id);
  if (isNaN(lessonId)) throw error(404, 'Not found');

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single();

  if (!lesson) throw error(404, 'Lesson not found');

  const questions = generateQuestions(lesson, 20);
  return { lesson, questions };
};
