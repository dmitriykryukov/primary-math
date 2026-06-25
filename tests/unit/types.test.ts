import { describe, it, expect } from 'vitest';
import type { UserProfile, Question } from '$lib/types';

describe('types', () => {
  it('UserProfile shape is valid', () => {
    const u: UserProfile = {
      id: 'uuid', username: 'lucas', role: 'student',
      grade: 5, language: 'en', teacher_id: null, created_at: ''
    };
    expect(u.role).toBe('student');
  });

  it('Question with options for multiple_choice', () => {
    const q: Question = {
      id: 'q1', lesson_id: 1, type: 'multiple_choice',
      question_en: '3 × 4 = ?', question_fr: '3 × 4 = ?',
      correct_answer: '12', options: ['9', '12', '15', '16']
    };
    expect(q.options).toHaveLength(4);
  });
});
