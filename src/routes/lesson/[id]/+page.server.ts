import { supabase } from '$lib/supabase';
import { generateQuestions } from '$lib/questions/generator';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

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
