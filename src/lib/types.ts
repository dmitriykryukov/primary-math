export type Role = 'admin' | 'teacher' | 'student';
export type Lang = 'en' | 'fr';
export type QuestionType = 'multiple_choice' | 'typed';

export interface UserProfile {
  id: string;
  username: string;
  role: Role;
  grade: 5 | 6 | null;
  language: Lang;
  teacher_id: string | null;
  created_at: string;
}

export interface Lesson {
  id: number;
  grade: 5 | 6;
  order_index: number;
  title_en: string;
  title_fr: string;
  topic: string;
}

export interface Question {
  id: string;           // generated, e.g. "L5Q7"
  lesson_id: number;
  type: QuestionType;
  question_en: string;
  question_fr: string;
  correct_answer: string;
  options: string[] | null; // 4 items for multiple_choice, null for typed
}

export interface StudentProgress {
  id: string;
  student_id: string;
  lesson_id: number;
  completed_at: string;
  score: number;
  total: number;
  answers: Record<string, string>; // question_id → student_answer
}

export interface Badge {
  id: string;
  student_id: string;
  lesson_id: number;
  earned_at: string;
}

export interface Streak {
  student_id: string;
  current_streak: number;
  longest_streak: number;
  last_practice_date: string | null;
}

export interface LeaderboardEntry {
  username: string;
  student_id: string;
  lessons_completed: number;
  is_self: boolean;
}
