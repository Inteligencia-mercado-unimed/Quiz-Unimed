export interface UserType {
  id: string;
  email: string;
  name?: string | null;
  role: 'ADMIN' | 'VIEWER';
  createdAt: string;
  updatedAt?: string;
}

export interface SectorType {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionType {
  id: string;
  pill: string; // e.g. "Pílula #01"
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttemptQuestionSnapshot {
  id: string;
  attemptId: string;
  questionId: string;
  pill: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  order: number;
}

export interface AttemptAnswerType {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  answeredAt: string;
}

export interface AttemptType {
  id: string;
  userName: string;
  sectorName: string;
  sectorId?: string | null;
  startTime: string;
  endTime?: string | null;
  durationSeconds: number;
  score: number;
  totalQuestions: number;
  isOfficial: boolean; // First completed attempt per user+sector
  isEligiblePrize: boolean;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  questions: AttemptQuestionSnapshot[];
  answers: AttemptAnswerType[];
  createdAt: string;
  updatedAt: string;
}

export interface AppConfigType {
  id: string;
  maxWinners: number;
  campaignCode: string;
  title: string;
  prizeDescription: string;
  updatedAt: string;
}

export interface QuizStartPayload {
  userName: string;
  sectorName: string;
  sectorId?: string;
}

export interface AnswerQuestionPayload {
  attemptId: string;
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D';
}

export interface FinishQuizPayload {
  attemptId: string;
}
