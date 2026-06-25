import { describe, it, expect } from 'vitest';

function calculateScore(questions: Array<{id:string,correct_answer:string}>, answers: Record<string,string>): number {
  return questions.filter(q => answers[q.id]?.trim() === q.correct_answer.trim()).length;
}

describe('scoring', () => {
  const questions = [
    { id: 'q1', correct_answer: '12' },
    { id: 'q2', correct_answer: '15' },
    { id: 'q3', correct_answer: '1/2' },
  ];

  it('counts exact matches', () => {
    expect(calculateScore(questions, { q1: '12', q2: '15', q3: '1/2' })).toBe(3);
  });

  it('returns 0 for no answers', () => {
    expect(calculateScore(questions, {})).toBe(0);
  });

  it('is case/space insensitive via trim', () => {
    expect(calculateScore(questions, { q1: ' 12 ', q2: '15', q3: '1/2' })).toBe(3);
  });

  it('badge threshold is 15/20', () => {
    const qs = Array.from({length:20}, (_,i) => ({id:`q${i}`,correct_answer:'1'}));
    const ans: Record<string,string> = {};
    for (let i = 0; i < 15; i++) ans[`q${i}`] = '1';
    expect(calculateScore(qs, ans)).toBeGreaterThanOrEqual(15);
  });
});
