import { describe, it, expect } from 'vitest';
import { generateQuestions } from '$lib/questions/generator';
import type { Lesson } from '$lib/types';

const makeLesson = (topic: string, grade: 5 | 6 = 5): Lesson => ({
  id: 1, grade, order_index: 1, title_en: 'Test', title_fr: 'Test', topic
});

describe('generateQuestions', () => {
  it('returns exactly count questions', () => {
    const qs = generateQuestions(makeLesson('mult_1_2'), 20);
    expect(qs).toHaveLength(20);
  });

  it('all questions have required fields', () => {
    const qs = generateQuestions(makeLesson('mult_5_6'), 20);
    for (const q of qs) {
      expect(q.id).toBeTruthy();
      expect(q.correct_answer).toBeTruthy();
      expect(q.question_en).toContain('×');
    }
  });

  it('multiple_choice questions have exactly 4 options', () => {
    const qs = generateQuestions(makeLesson('mult_mix_all_1'), 20);
    const mc = qs.filter(q => q.type === 'multiple_choice');
    expect(mc.length).toBeGreaterThan(0);
    for (const q of mc) expect(q.options).toHaveLength(4);
  });

  it('typed questions have null options', () => {
    const qs = generateQuestions(makeLesson('div_5_6'), 20);
    const typed = qs.filter(q => q.type === 'typed');
    for (const q of typed) expect(q.options).toBeNull();
  });

  it('correct answer is in multiple_choice options', () => {
    const qs = generateQuestions(makeLesson('mult_7_8'), 20);
    for (const q of qs.filter(q => q.type === 'multiple_choice')) {
      expect(q.options).toContain(q.correct_answer);
    }
  });

  it('generates fraction questions', () => {
    const qs = generateQuestions(makeLesson('frac_add_same_1'), 20);
    expect(qs[0].question_en).toContain('/');
  });
});
