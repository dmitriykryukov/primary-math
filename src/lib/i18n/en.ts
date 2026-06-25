// src/lib/i18n/en.ts
export const en = {
  // Auth
  login: 'Log In',
  username: 'Username',
  password: 'Password',
  // Nav
  dashboard: 'Dashboard',
  logout: 'Log Out',
  // Dashboard
  greeting: 'Hello',
  streak: 'Day streak',
  progress: 'Progress',
  badges: 'Badges',
  startLesson: 'Start Today\'s Lesson',
  lesson: 'Lesson',
  of: 'of',
  leaderboard: 'Leaderboard',
  you: 'you',
  // Exercise
  question: 'Question',
  skip: 'Skip for now →',
  confirm: 'Confirm Answer',
  // Score
  excellent: 'Excellent',
  goodEffort: 'Good effort',
  badgeEarned: 'Badge Unlocked!',
  tryAgain: 'Try Again',
  continueNext: 'Continue to Next Lesson',
  backToDashboard: 'Back to Dashboard',
  needForBadge: 'more correct answers for the badge!',
  // Teacher
  avgLesson: 'Avg. Lesson',
  avgScore: 'Avg. Score',
  avgStreak: 'Avg. Streak',
  lastActive: 'Last Active',
  today: 'Today',
  yesterday: 'Yesterday',
  daysAgo: 'days ago',
  addStudent: '+ Add Student',
  addTeacher: '+ Add Teacher',
  students: 'Students',
  grade: 'Grade',
  score: 'Score',
  // Admin
  adminPanel: 'Admin Panel',
  teachers: 'Teachers',
  createUser: 'Create User',
  deleteUser: 'Delete',
  // Errors
  invalidCredentials: 'Invalid username or password.',
  usernameExists: 'Username already taken.',
};

export type I18nKeys = keyof typeof en;
