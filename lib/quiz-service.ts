import fs from 'fs';
import path from 'path';
import {
  SectorType,
  QuestionType,
  UserType,
  AppConfigType,
  AttemptType,
  AttemptQuestionSnapshot,
  AttemptAnswerType,
} from './types';
import {
  INITIAL_SECTORS,
  INITIAL_QUESTIONS,
  INITIAL_USERS,
  INITIAL_APP_CONFIG,
} from './initial-data';
import {
  getSupabaseClient,
  saveAttemptToSupabase,
  saveAnswerToSupabase,
  saveSectorToSupabase,
  deleteSectorFromSupabase,
  saveQuestionToSupabase,
  deleteQuestionFromSupabase,
  saveAppConfigToSupabase,
} from './supabase';

interface DatabaseStore {
  users: UserType[];
  sectors: SectorType[];
  questions: QuestionType[];
  attempts: AttemptType[];
  config: AppConfigType;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'db-store.json');

// In-memory fallback if file system write is limited
let inMemoryStore: DatabaseStore | null = null;

function getInitialStore(): DatabaseStore {
  return {
    users: [...INITIAL_USERS],
    sectors: [...INITIAL_SECTORS],
    questions: [...INITIAL_QUESTIONS],
    attempts: [],
    config: { ...INITIAL_APP_CONFIG },
  };
}

export function loadStore(): DatabaseStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(content) as DatabaseStore;
      inMemoryStore = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn('Could not read from file store, using memory:', err);
  }

  if (!inMemoryStore) {
    inMemoryStore = getInitialStore();
    saveStore(inMemoryStore);
  }
  return inMemoryStore;
}

export function resetStoreForTesting(): DatabaseStore {
  inMemoryStore = getInitialStore();
  saveStore(inMemoryStore);
  return inMemoryStore;
}

export function saveStore(store: DatabaseStore): void {
  inMemoryStore = store;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write store to file, persisting in-memory only:', err);
  }
}

// -------------------------------------------------------------
// BUSINESS LOGIC & QUIZ RULES
// -------------------------------------------------------------

export function normalizeText(str: string): string {
  return str.trim().toLowerCase();
}

/**
 * Recalculate ranking flags:
 * - Mark the chronologically first completed attempt per (userName, sectorName) as isOfficial = true.
 * - All other completed attempts for that user+sector are isOfficial = false.
 * - Sort official completed attempts according to:
 *   1. Score (descending)
 *   2. Duration in seconds (ascending)
 *   3. End time (ascending, earlier is better)
 * - Assign isEligiblePrize = true to official attempts with 100% score (score === totalQuestions)
 *   that fall within the config.maxWinners quota.
 */
export function recalculateAttemptsRankings(attempts: AttemptType[], maxWinners: number): AttemptType[] {
  // First, group by user+sector to identify the first completed attempt
  const userSectorFirstCompletedMap = new Map<string, string>(); // key -> attemptId

  // Sort by endTime ascending to determine true chronological order of completion
  const completedAttempts = attempts
    .filter((a) => a.status === 'COMPLETED' && a.endTime)
    .sort((a, b) => new Date(a.endTime!).getTime() - new Date(b.endTime!).getTime());

  for (const attempt of completedAttempts) {
    const key = `${normalizeText(attempt.userName)}||${normalizeText(attempt.sectorName)}`;
    if (!userSectorFirstCompletedMap.has(key)) {
      userSectorFirstCompletedMap.set(key, attempt.id);
    }
  }

  // Update isOfficial on all attempts
  for (const attempt of attempts) {
    if (attempt.status !== 'COMPLETED') {
      attempt.isOfficial = false;
      attempt.isEligiblePrize = false;
      continue;
    }

    const key = `${normalizeText(attempt.userName)}||${normalizeText(attempt.sectorName)}`;
    const officialId = userSectorFirstCompletedMap.get(key);
    attempt.isOfficial = attempt.id === officialId;
    attempt.isEligiblePrize = false; // Reset before ranking calculation
  }

  // Get official attempts and rank them
  const officialAttempts = attempts.filter((a) => a.status === 'COMPLETED' && a.isOfficial);

  officialAttempts.sort((a, b) => {
    // 1. Highest score
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // 2. Lowest time
    if (a.durationSeconds !== b.durationSeconds) {
      return a.durationSeconds - b.durationSeconds;
    }
    // 3. Oldest completion date
    const dateA = new Date(a.endTime || a.createdAt).getTime();
    const dateB = new Date(b.endTime || b.createdAt).getTime();
    return dateA - dateB;
  });

  // Assign prize eligibility to top maxWinners with 100% score
  let eligibleCount = 0;
  for (const att of officialAttempts) {
    if (att.score === att.totalQuestions && att.totalQuestions > 0 && eligibleCount < maxWinners) {
      att.isEligiblePrize = true;
      eligibleCount++;
    } else {
      att.isEligiblePrize = false;
    }
  }

  return attempts;
}

// -------------------------------------------------------------
// QUIZ SERVICE FUNCTIONS
// -------------------------------------------------------------

export function startQuiz(userName: string, sectorName: string, sectorId?: string): AttemptType {
  const store = loadStore();

  // Snapshot active questions in order
  const activeQuestions = store.questions
    .filter((q) => q.active)
    .sort((a, b) => a.order - b.order);

  const attemptId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const startTime = new Date().toISOString();

  const questionSnapshots: AttemptQuestionSnapshot[] = activeQuestions.map((q, idx) => ({
    id: `snap-${attemptId}-${idx + 1}`,
    attemptId,
    questionId: q.id,
    pill: q.pill,
    question: q.question,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    correctOption: q.correctOption,
    explanation: q.explanation,
    order: idx + 1,
  }));

  const newAttempt: AttemptType = {
    id: attemptId,
    userName: userName.trim(),
    sectorName: sectorName.trim(),
    sectorId: sectorId || null,
    startTime,
    endTime: null,
    durationSeconds: 0,
    score: 0,
    totalQuestions: questionSnapshots.length,
    isOfficial: false,
    isEligiblePrize: false,
    status: 'IN_PROGRESS',
    questions: questionSnapshots,
    answers: [],
    createdAt: startTime,
    updatedAt: startTime,
  };

  store.attempts.push(newAttempt);
  saveStore(store);

  // Asynchronously persist to Supabase if configured
  const supabase = getSupabaseClient();
  if (supabase) {
    saveAttemptToSupabase(supabase, newAttempt).catch((err) =>
      console.warn('Supabase async saveAttempt error:', err)
    );
  }

  return newAttempt;
}

export function answerQuestion(
  attemptId: string,
  questionId: string,
  selectedOption: 'A' | 'B' | 'C' | 'D'
): { attempt: AttemptType; isCorrect: boolean; correctOption: string; explanation: string } {
  const store = loadStore();
  const attempt = store.attempts.find((a) => a.id === attemptId);

  if (!attempt) {
    throw new Error('Tentativa não encontrada.');
  }

  // Find snapshotted question
  const questionSnapshot = attempt.questions.find((q) => q.questionId === questionId);
  if (!questionSnapshot) {
    throw new Error('Pergunta não encontrada no snapshot desta tentativa.');
  }

  // Check if already answered
  const existingAnswerIndex = attempt.answers.findIndex((ans) => ans.questionId === questionId);
  const isCorrect = selectedOption === questionSnapshot.correctOption;

  const answerRecord: AttemptAnswerType = {
    id: `ans-${attemptId}-${questionId}`,
    attemptId,
    questionId,
    selectedOption,
    isCorrect,
    answeredAt: new Date().toISOString(),
  };

  if (existingAnswerIndex >= 0) {
    attempt.answers[existingAnswerIndex] = answerRecord;
  } else {
    attempt.answers.push(answerRecord);
  }

  // Recalculate score from current answers
  attempt.score = attempt.answers.filter((ans) => ans.isCorrect).length;
  attempt.updatedAt = new Date().toISOString();

  saveStore(store);

  // Asynchronously persist answer to Supabase if configured
  const supabase = getSupabaseClient();
  if (supabase) {
    saveAnswerToSupabase(supabase, attemptId, answerRecord, attempt.score).catch((err) =>
      console.warn('Supabase async saveAnswer error:', err)
    );
  }

  return {
    attempt,
    isCorrect,
    correctOption: questionSnapshot.correctOption,
    explanation: questionSnapshot.explanation,
  };
}

export function finishQuiz(attemptId: string): AttemptType {
  const store = loadStore();
  const attempt = store.attempts.find((a) => a.id === attemptId);

  if (!attempt) {
    throw new Error('Tentativa não encontrada.');
  }

  const endTime = new Date().toISOString();
  attempt.endTime = endTime;
  attempt.status = 'COMPLETED';

  // Calculate duration
  const startMs = new Date(attempt.startTime).getTime();
  const endMs = new Date(endTime).getTime();
  attempt.durationSeconds = Math.max(1, Math.round((endMs - startMs) / 1000));

  // Recalculate total score
  attempt.score = attempt.answers.filter((a) => a.isCorrect).length;
  attempt.updatedAt = endTime;

  // Recalculate all rankings, official flags, and prize eligibility
  recalculateAttemptsRankings(store.attempts, store.config.maxWinners);

  saveStore(store);

  // Asynchronously persist completed attempt to Supabase if configured
  const supabase = getSupabaseClient();
  if (supabase) {
    saveAttemptToSupabase(supabase, attempt).catch((err) =>
      console.warn('Supabase async saveAttempt on finish error:', err)
    );
  }

  return attempt;
}

export function getAttemptById(attemptId: string): AttemptType | null {
  const store = loadStore();
  return store.attempts.find((a) => a.id === attemptId) || null;
}

// -------------------------------------------------------------
// ADMIN & DASHBOARD QUERIES
// -------------------------------------------------------------

export function getDashboardMetrics() {
  const store = loadStore();
  recalculateAttemptsRankings(store.attempts, store.config.maxWinners);

  const completedAttempts = store.attempts.filter((a) => a.status === 'COMPLETED');

  // Unique collaborators by name+sector
  const collaboratorKeys = new Set(
    store.attempts.map((a) => `${normalizeText(a.userName)}||${normalizeText(a.sectorName)}`)
  );
  const totalCollaborators = collaboratorKeys.size;

  const totalCompleted = completedAttempts.length;

  // Gabaritos (100% de acertos)
  const gabaritos = completedAttempts.filter((a) => a.score === a.totalQuestions && a.totalQuestions > 0).length;

  // Participações adicionais
  const participacoesAdicionais = completedAttempts.filter((a) => !a.isOfficial).length;

  // Official Ranking sorted by score DESC, durationSeconds ASC, endTime ASC
  const ranking = completedAttempts
    .filter((a) => a.isOfficial)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.durationSeconds !== b.durationSeconds) return a.durationSeconds - b.durationSeconds;
      return new Date(a.endTime || a.createdAt).getTime() - new Date(b.endTime || b.createdAt).getTime();
    })
    .map((att, index) => ({
      position: index + 1,
      ...att,
    }));

  const winners = ranking.filter((r) => r.isEligiblePrize);

  // Performance by sector
  const sectorPerformanceMap: Record<string, { attempts: number; totalScore: number; maxScore: number }> = {};
  for (const att of completedAttempts) {
    if (!sectorPerformanceMap[att.sectorName]) {
      sectorPerformanceMap[att.sectorName] = { attempts: 0, totalScore: 0, maxScore: 0 };
    }
    sectorPerformanceMap[att.sectorName].attempts += 1;
    sectorPerformanceMap[att.sectorName].totalScore += att.score;
    sectorPerformanceMap[att.sectorName].maxScore += att.totalQuestions;
  }

  const sectorPerformance = Object.entries(sectorPerformanceMap).map(([sector, data]) => ({
    sector,
    attempts: data.attempts,
    avgScore: data.maxScore > 0 ? ((data.totalScore / data.maxScore) * 100).toFixed(1) : '0',
    totalScore: data.totalScore,
  }));

  // Score distribution: 0, 1, 2, 3, 4 (or up to max questions)
  const scoreDistribution: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const att of completedAttempts) {
    const s = att.score;
    scoreDistribution[s] = (scoreDistribution[s] || 0) + 1;
  }

  return {
    totalCollaborators,
    totalCompleted,
    gabaritos,
    participacoesAdicionais,
    ranking,
    winners,
    sectorPerformance,
    scoreDistribution,
    config: store.config,
    allAttempts: store.attempts.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  };
}

// -------------------------------------------------------------
// SECTORS CRUD
// -------------------------------------------------------------

export function getSectors(): SectorType[] {
  const store = loadStore();
  return store.sectors.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export function createSector(name: string): SectorType {
  const store = loadStore();
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Nome do setor não pode ser vazio.');

  if (store.sectors.some((s) => normalizeText(s.name) === normalizeText(trimmed))) {
    throw new Error('Já existe um setor com este nome.');
  }

  const newSector: SectorType = {
    id: `sec-${Date.now()}`,
    name: trimmed,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.sectors.push(newSector);
  saveStore(store);

  const supabase = getSupabaseClient();
  if (supabase) {
    saveSectorToSupabase(supabase, newSector).catch((err) =>
      console.warn('Supabase async saveSector error:', err)
    );
  }

  return newSector;
}

export function updateSector(id: string, name: string, active?: boolean): SectorType {
  const store = loadStore();
  const sector = store.sectors.find((s) => s.id === id);
  if (!sector) throw new Error('Setor não encontrado.');

  const trimmed = name.trim();
  if (!trimmed) throw new Error('Nome do setor não pode ser vazio.');

  const existingWithSameName = store.sectors.find(
    (s) => s.id !== id && normalizeText(s.name) === normalizeText(trimmed)
  );
  if (existingWithSameName) {
    throw new Error('Já existe outro setor com este nome.');
  }

  sector.name = trimmed;
  if (typeof active === 'boolean') {
    sector.active = active;
  }
  sector.updatedAt = new Date().toISOString();

  saveStore(store);

  const supabase = getSupabaseClient();
  if (supabase) {
    saveSectorToSupabase(supabase, sector).catch((err) =>
      console.warn('Supabase async updateSector error:', err)
    );
  }

  return sector;
}

export function deleteSector(id: string): void {
  const store = loadStore();
  const index = store.sectors.findIndex((s) => s.id === id);
  if (index === -1) throw new Error('Setor não encontrado.');

  store.sectors.splice(index, 1);
  saveStore(store);

  const supabase = getSupabaseClient();
  if (supabase) {
    deleteSectorFromSupabase(supabase, id).catch((err) =>
      console.warn('Supabase async deleteSector error:', err)
    );
  }
}

// -------------------------------------------------------------
// QUESTIONS CRUD
// -------------------------------------------------------------

export function getQuestions(): QuestionType[] {
  const store = loadStore();
  return store.questions.sort((a, b) => a.order - b.order);
}

export function getActiveQuestions(): QuestionType[] {
  const store = loadStore();
  return store.questions.filter((q) => q.active).sort((a, b) => a.order - b.order);
}

export function createQuestion(data: Omit<QuestionType, 'id' | 'createdAt' | 'updatedAt'>): QuestionType {
  const store = loadStore();
  const newQuestion: QuestionType = {
    ...data,
    id: `q-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.questions.push(newQuestion);
  saveStore(store);

  const supabase = getSupabaseClient();
  if (supabase) {
    saveQuestionToSupabase(supabase, newQuestion).catch((err) =>
      console.warn('Supabase async saveQuestion error:', err)
    );
  }

  return newQuestion;
}

export function updateQuestion(id: string, data: Partial<Omit<QuestionType, 'id' | 'createdAt'>>): QuestionType {
  const store = loadStore();
  const question = store.questions.find((q) => q.id === id);
  if (!question) throw new Error('Pergunta não encontrada.');

  Object.assign(question, data);
  question.updatedAt = new Date().toISOString();

  saveStore(store);

  const supabase = getSupabaseClient();
  if (supabase) {
    saveQuestionToSupabase(supabase, question).catch((err) =>
      console.warn('Supabase async updateQuestion error:', err)
    );
  }

  return question;
}

export function deleteQuestion(id: string): void {
  const store = loadStore();
  const index = store.questions.findIndex((q) => q.id === id);
  if (index === -1) throw new Error('Pergunta não encontrada.');

  store.questions.splice(index, 1);
  saveStore(store);

  const supabase = getSupabaseClient();
  if (supabase) {
    deleteQuestionFromSupabase(supabase, id).catch((err) =>
      console.warn('Supabase async deleteQuestion error:', err)
    );
  }
}

// -------------------------------------------------------------
// APP CONFIG & SETTINGS
// -------------------------------------------------------------

export function getAppConfig(): AppConfigType {
  const store = loadStore();
  return store.config;
}

export function updateAppConfig(data: Partial<AppConfigType>): AppConfigType {
  const store = loadStore();
  Object.assign(store.config, data);
  store.config.updatedAt = new Date().toISOString();

  // Re-rank attempts if maxWinners changed
  recalculateAttemptsRankings(store.attempts, store.config.maxWinners);

  saveStore(store);

  const supabase = getSupabaseClient();
  if (supabase) {
    saveAppConfigToSupabase(supabase, store.config).catch((err) =>
      console.warn('Supabase async saveAppConfig error:', err)
    );
  }

  return store.config;
}

export async function syncWithSupabase(): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'SUPABASE_URL ou SUPABASE_SECRET_KEY não estão configurados no arquivo .env' };
  }
  const store = loadStore();
  return (await import('./supabase')).syncAllToSupabase(supabase, store);
}

// -------------------------------------------------------------
// ADMIN AUTHENTICATION
// -------------------------------------------------------------

export function isAuthorizedAdmin(email: string): boolean {
  if (!email) return false;
  const store = loadStore();
  const normalized = normalizeText(email);

  // Authorized default admin emails
  if (normalized === 'rrochapablo@gmail.com' || normalized === 'analistavendas.ji@gmail.com') {
    return true;
  }

  return store.users.some((u) => normalizeText(u.email) === normalized && u.role === 'ADMIN');
}
