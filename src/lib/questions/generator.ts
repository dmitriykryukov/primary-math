import type { Question, Lesson, QuestionType } from '$lib/types';

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function simplify(n: number, d: number): [number, number] {
  const g = gcd(Math.abs(n), Math.abs(d));
  return [n / g, d / g];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickType(index: number, total: number): QuestionType {
  // First 60% are typed, remaining 40% are multiple_choice
  return index < Math.ceil(total * 0.6) ? 'typed' : 'multiple_choice';
}

function makeMultChoiceOptions(correct: string, distractors: string[]): string[] {
  const unique = [...new Set([correct, ...distractors])].slice(0, 4);
  while (unique.length < 4) {
    const num = parseInt(correct);
    if (!isNaN(num)) {
      const candidate = String(num + unique.length);
      if (!unique.includes(candidate)) unique.push(candidate);
    } else {
      break; // non-numeric answer, can't generate meaningful numeric distractors
    }
  }
  return shuffle(unique);
}

function multQuestion(a: number, b: number, index: number, lessonId: number, total: number): Question {
  const type = pickType(index, total);
  const answer = String(a * b);
  const distractors = [
    String(a * b + 1), String(a * b - 1),
    String((a + 1) * b), String(a * (b + 1))
  ].filter(d => d !== answer && parseInt(d) > 0);
  return {
    id: `L${lessonId}Q${index}`,
    lesson_id: lessonId,
    type,
    question_en: `${a} × ${b} = ?`,
    question_fr: `${a} × ${b} = ?`,
    correct_answer: answer,
    options: type === 'multiple_choice' ? makeMultChoiceOptions(answer, distractors) : null
  };
}

function divQuestion(dividend: number, divisor: number, index: number, lessonId: number, total: number): Question {
  const type = pickType(index, total);
  const answer = String(Math.round(dividend / divisor));
  const distractors = [
    String(parseInt(answer) + 1), String(parseInt(answer) - 1),
    String(divisor), String(dividend)
  ].filter(d => d !== answer && parseInt(d) > 0);
  return {
    id: `L${lessonId}Q${index}`,
    lesson_id: lessonId,
    type,
    question_en: `${dividend} ÷ ${divisor} = ?`,
    question_fr: `${dividend} ÷ ${divisor} = ?`,
    correct_answer: answer,
    options: type === 'multiple_choice' ? makeMultChoiceOptions(answer, distractors) : null
  };
}

function fracQuestion(
  num1: number, den1: number, num2: number, den2: number,
  op: '+' | '-' | '×' | '÷',
  index: number, lessonId: number, total: number
): Question {
  const type = pickType(index, total);
  let rn: number, rd: number;
  if (op === '+') { rn = num1 * den2 + num2 * den1; rd = den1 * den2; }
  else if (op === '-') { rn = num1 * den2 - num2 * den1; rd = den1 * den2; }
  else if (op === '×') { rn = num1 * num2; rd = den1 * den2; }
  else { rn = num1 * den2; rd = den1 * num2; }
  const [sn, sd] = simplify(rn, rd);
  const answer = sd === 1 ? String(sn) : `${sn}/${sd}`;
  const q_en = `${num1}/${den1} ${op} ${num2}/${den2} = ?`;
  const distractors = [`${sn + 1}/${sd}`, `${sn - 1}/${sd}`, `${sn}/${sd + 1}`]
    .filter(d => d !== answer);
  return {
    id: `L${lessonId}Q${index}`,
    lesson_id: lessonId,
    type,
    question_en: q_en,
    question_fr: q_en,
    correct_answer: answer,
    options: type === 'multiple_choice' ? makeMultChoiceOptions(answer, distractors) : null
  };
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateQuestions(lesson: Lesson, count: number): Question[] {
  const topic = lesson.topic;
  const id = lesson.id;
  const qs: Question[] = [];

  for (let i = 0; i < count; i++) {
    if (topic.startsWith('mult_')) {
      if (topic === 'mult_1_2') qs.push(multQuestion(rand(1,2), rand(1,12), i, id, count));
      else if (topic === 'mult_3_4') qs.push(multQuestion(rand(3,4), rand(1,12), i, id, count));
      else if (topic === 'mult_5_6') qs.push(multQuestion(rand(5,6), rand(1,12), i, id, count));
      else if (topic === 'mult_7_8') qs.push(multQuestion(rand(7,8), rand(1,12), i, id, count));
      else if (topic === 'mult_9_10') qs.push(multQuestion(rand(9,10), rand(1,12), i, id, count));
      else if (topic === 'mult_11_12') qs.push(multQuestion(rand(11,12), rand(1,12), i, id, count));
      else if (topic === 'mult_mix_1_6') qs.push(multQuestion(rand(1,6), rand(1,12), i, id, count));
      else if (topic === 'mult_mix_7_12') qs.push(multQuestion(rand(7,12), rand(1,12), i, id, count));
      else if (topic.includes('mix_all') || topic === 'mult_div_mix' || topic === 'mult_g6_review')
        qs.push(multQuestion(rand(1,12), rand(1,12), i, id, count));
      else if (topic === 'mult_2x1_1') qs.push(multQuestion(rand(10,50), rand(2,9), i, id, count));
      else if (topic === 'mult_2x1_2') qs.push(multQuestion(rand(50,99), rand(2,9), i, id, count));
      else if (topic === 'mult_2x2_1') qs.push(multQuestion(rand(10,30), rand(10,30), i, id, count));
      else if (topic === 'mult_2x2_2') qs.push(multQuestion(rand(30,60), rand(10,30), i, id, count));
      else if (topic === 'mult_hard_1') qs.push(multQuestion(rand(12,50), rand(12,50), i, id, count));
      else if (topic === 'mult_hard_2') qs.push(multQuestion(rand(50,99), rand(12,30), i, id, count));
      else qs.push(multQuestion(rand(1,12), rand(1,12), i, id, count));
    } else if (topic.startsWith('div_')) {
      if (topic === 'div_1_4') { const b = rand(1,4); qs.push(divQuestion(b*rand(1,12), b, i, id, count)); }
      else if (topic === 'div_5_6') { const b = rand(5,6); qs.push(divQuestion(b*rand(1,12), b, i, id, count)); }
      else if (topic === 'div_7_8') { const b = rand(7,8); qs.push(divQuestion(b*rand(1,12), b, i, id, count)); }
      else if (topic === 'div_9_10') { const b = rand(9,10); qs.push(divQuestion(b*rand(1,12), b, i, id, count)); }
      else if (topic === 'div_11_12') { const b = rand(11,12); qs.push(divQuestion(b*rand(1,12), b, i, id, count)); }
      else if (topic.includes('rem')) { const b = rand(2,12); qs.push(divQuestion(rand(b+1, b*12+b-1), b, i, id, count)); }
      else if (topic.includes('long')) { const b = rand(2,9); qs.push(divQuestion(rand(100,999), b, i, id, count)); }
      else { const b = rand(1,12); qs.push(divQuestion(b*rand(1,12), b, i, id, count)); }
    } else if (topic.startsWith('frac_')) {
      const dens = [2,3,4,5,6,8,10];
      if (topic.includes('equiv')) {
        const d = dens[rand(0,4)]; const n = rand(1, d-1); const m = rand(2,4);
        const type = pickType(i, count);
        qs.push({ id:`L${id}Q${i}`, lesson_id:id, type, question_en:`Find equivalent: ${n}/${d} = ?/${d*m}`, question_fr:`Trouver équivalent: ${n}/${d} = ?/${d*m}`, correct_answer: String(n*m), options: type==='multiple_choice' ? makeMultChoiceOptions(String(n*m), [String(n*m+1),String(n*m-1),String(n)]) : null });
      } else if (topic.includes('compare')) {
        const d = dens[rand(0,4)]; const n1 = rand(1,d-1); const n2 = rand(1,d-1);
        const type = pickType(i, count);
        const answer = n1 > n2 ? `${n1}/${d}` : (n1 < n2 ? `${n2}/${d}` : 'equal');
        let options: string[] | null = null;
        if (type === 'multiple_choice') {
          const opts = new Set([answer]);
          const candidates = [
            `${n1}/${d}`, `${n2}/${d}`, 'equal',
            `${Math.min(n1,n2)+1}/${d}`, `${Math.max(n1,n2)+1}/${d}`,
            `${Math.max(n1,n2)+2}/${d}`, `${Math.max(n1,n2)+3}/${d}`
          ];
          for (const c of candidates) { if (opts.size < 4) opts.add(c); }
          options = shuffle([...opts]);
        }
        qs.push({ id:`L${id}Q${i}`, lesson_id:id, type, question_en:`Which is larger? ${n1}/${d} or ${n2}/${d}`, question_fr:`Laquelle est plus grande? ${n1}/${d} ou ${n2}/${d}`, correct_answer: answer, options });
      } else if (topic.includes('add_same')) {
        const d = dens[rand(0,4)]; const n1 = rand(1,d); const n2 = rand(1,d);
        qs.push(fracQuestion(n1,d,n2,d,'+',i,id,count));
      } else if (topic.includes('sub_same')) {
        const d = dens[rand(0,4)]; const n1 = rand(2,d); const n2 = rand(1,n1-1);
        qs.push(fracQuestion(n1,d,n2,d,'-',i,id,count));
      } else if (topic.includes('add_unlike') || topic === 'frac_lcd_1') {
        const d1 = dens[rand(0,4)]; const d2 = dens[rand(0,4)];
        qs.push(fracQuestion(rand(1,d1-1),d1,rand(1,d2-1),d2,'+',i,id,count));
      } else if (topic.includes('sub_unlike')) {
        const d1 = dens[rand(1,4)]; const d2 = dens[rand(0,3)];
        qs.push(fracQuestion(rand(2,d1),d1,rand(1,d2),d2,'-',i,id,count));
      } else if (topic.includes('mult')) {
        const d1 = dens[rand(0,4)]; const d2 = dens[rand(0,4)];
        qs.push(fracQuestion(rand(1,d1),d1,rand(1,d2),d2,'×',i,id,count));
      } else if (topic.includes('div')) {
        const d1 = dens[rand(0,4)]; const d2 = dens[rand(0,4)];
        qs.push(fracQuestion(rand(1,d1),d1,rand(1,d2),d2,'÷',i,id,count));
      } else {
        const d = dens[rand(0,4)]; qs.push(fracQuestion(rand(1,d),d,rand(1,d),d,'+',i,id,count));
      }
    } else {
      // review: mix of all lesson types for that grade
      const a = rand(1,12); const b = rand(1,12);
      qs.push(multQuestion(a, b, i, id, count));
    }
  }
  return qs;
}
