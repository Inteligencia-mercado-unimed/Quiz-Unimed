import { createClient, SupabaseClient } from '@supabase/supabase-js';
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

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return cachedClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseKey);
}

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
  url?: string;
  tables?: Record<string, boolean>;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      error: 'SUPABASE_URL ou SUPABASE_SECRET_KEY não estão configurados no arquivo .env',
      url: supabaseUrl || undefined,
    };
  }

  const tableChecks: Record<string, boolean> = {
    Sector: false,
    Question: false,
    Attempt: false,
    AttemptQuestion: false,
    AttemptAnswer: false,
    AppConfig: false,
    User: false,
  };

  try {
    // Check Sector
    const { error: sectorErr } = await client.from('Sector').select('id').limit(1);
    tableChecks.Sector = !sectorErr;

    // Check Question
    const { error: qErr } = await client.from('Question').select('id').limit(1);
    tableChecks.Question = !qErr;

    // Check Attempt
    const { error: attErr } = await client.from('Attempt').select('id').limit(1);
    tableChecks.Attempt = !attErr;

    // Check AttemptQuestion
    const { error: aqErr } = await client.from('AttemptQuestion').select('id').limit(1);
    tableChecks.AttemptQuestion = !aqErr;

    // Check AttemptAnswer
    const { error: aaErr } = await client.from('AttemptAnswer').select('id').limit(1);
    tableChecks.AttemptAnswer = !aaErr;

    // Check AppConfig
    const { error: cfgErr } = await client.from('AppConfig').select('id').limit(1);
    tableChecks.AppConfig = !cfgErr;

    // Check User
    const { error: usrErr } = await client.from('User').select('id').limit(1);
    tableChecks.User = !usrErr;

    const anyConnected = Object.values(tableChecks).some(Boolean);
    return {
      connected: anyConnected,
      url: supabaseUrl,
      tables: tableChecks,
      error: anyConnected ? undefined : 'As tabelas ainda não foram criadas no Supabase. Execute o script supabase/schema.sql no SQL Editor.',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      url: supabaseUrl,
      error: errorMsg,
      tables: tableChecks,
    };
  }
}

/**
 * Automatically seeds initial sectors, questions, users and app config
 * into Supabase if the tables are empty.
 */
export async function seedSupabaseIfNeeded(client: SupabaseClient): Promise<void> {
  try {
    // 1. AppConfig
    const { data: configData } = await client.from('AppConfig').select('id').limit(1);
    if (!configData || configData.length === 0) {
      await client.from('AppConfig').upsert({
        id: INITIAL_APP_CONFIG.id,
        maxWinners: INITIAL_APP_CONFIG.maxWinners,
        campaignCode: INITIAL_APP_CONFIG.campaignCode,
        title: INITIAL_APP_CONFIG.title,
        prizeDescription: INITIAL_APP_CONFIG.prizeDescription,
        updatedAt: new Date().toISOString(),
      });
    }

    // 2. Users
    const { data: userData } = await client.from('User').select('id').limit(1);
    if (!userData || userData.length === 0) {
      for (const u of INITIAL_USERS) {
        await client.from('User').upsert({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt || u.createdAt,
        });
      }
    }

    // 3. Sectors
    const { data: sectorData } = await client.from('Sector').select('id').limit(1);
    if (!sectorData || sectorData.length === 0) {
      for (const s of INITIAL_SECTORS) {
        await client.from('Sector').upsert({
          id: s.id,
          name: s.name,
          active: s.active,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        });
      }
    }

    // 4. Questions
    const { data: qData } = await client.from('Question').select('id').limit(1);
    if (!qData || qData.length === 0) {
      for (const q of INITIAL_QUESTIONS) {
        await client.from('Question').upsert({
          id: q.id,
          pill: q.pill,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption,
          explanation: q.explanation,
          active: q.active,
          order: q.order,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
        });
      }
    }
  } catch (err) {
    console.warn('Erro ao verificar/popular seed inicial no Supabase:', err);
  }
}

// -------------------------------------------------------------
// DATA ACCESS FUNCTIONS FOR SUPABASE
// -------------------------------------------------------------

export async function fetchSectorsFromSupabase(client: SupabaseClient): Promise<SectorType[] | null> {
  try {
    const { data, error } = await client
      .from('Sector')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) {
      await seedSupabaseIfNeeded(client);
      return [...INITIAL_SECTORS];
    }
    return data as SectorType[];
  } catch (err) {
    console.warn('Supabase fetchSectors failed:', err);
    return null;
  }
}

export async function saveSectorToSupabase(client: SupabaseClient, sector: SectorType): Promise<boolean> {
  try {
    const { error } = await client.from('Sector').upsert({
      id: sector.id,
      name: sector.name,
      active: sector.active,
      createdAt: sector.createdAt,
      updatedAt: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase saveSector failed:', err);
    return false;
  }
}

export async function deleteSectorFromSupabase(client: SupabaseClient, sectorId: string): Promise<boolean> {
  try {
    const { error } = await client.from('Sector').delete().eq('id', sectorId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase deleteSector failed:', err);
    return false;
  }
}

export async function fetchQuestionsFromSupabase(client: SupabaseClient): Promise<QuestionType[] | null> {
  try {
    const { data, error } = await client
      .from('Question')
      .select('*')
      .order('order', { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) {
      await seedSupabaseIfNeeded(client);
      return [...INITIAL_QUESTIONS];
    }
    return data as QuestionType[];
  } catch (err) {
    console.warn('Supabase fetchQuestions failed:', err);
    return null;
  }
}

export async function saveQuestionToSupabase(client: SupabaseClient, question: QuestionType): Promise<boolean> {
  try {
    const { error } = await client.from('Question').upsert({
      id: question.id,
      pill: question.pill,
      question: question.question,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctOption: question.correctOption,
      explanation: question.explanation,
      active: question.active,
      order: question.order,
      createdAt: question.createdAt,
      updatedAt: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase saveQuestion failed:', err);
    return false;
  }
}

export async function deleteQuestionFromSupabase(client: SupabaseClient, questionId: string): Promise<boolean> {
  try {
    const { error } = await client.from('Question').delete().eq('id', questionId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase deleteQuestion failed:', err);
    return false;
  }
}

export async function fetchAppConfigFromSupabase(client: SupabaseClient): Promise<AppConfigType | null> {
  try {
    const { data, error } = await client
      .from('AppConfig')
      .select('*')
      .eq('id', 'default')
      .single();
    if (error) throw error;
    return data as AppConfigType;
  } catch {
    return null;
  }
}

export async function saveAppConfigToSupabase(client: SupabaseClient, config: AppConfigType): Promise<boolean> {
  try {
    const { error } = await client.from('AppConfig').upsert({
      id: 'default',
      maxWinners: config.maxWinners,
      campaignCode: config.campaignCode,
      title: config.title,
      prizeDescription: config.prizeDescription,
      updatedAt: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase saveAppConfig failed:', err);
    return false;
  }
}

export async function fetchAttemptsFromSupabase(client: SupabaseClient): Promise<AttemptType[] | null> {
  try {
    // 1. Fetch attempts
    const { data: attemptsData, error: attError } = await client
      .from('Attempt')
      .select('*')
      .order('createdAt', { ascending: false });

    if (attError) throw attError;
    if (!attemptsData) return [];

    const attemptIds = attemptsData.map((a) => a.id);
    if (attemptIds.length === 0) return [];

    // 2. Fetch questions snapshots and answers
    const [{ data: questionsData }, { data: answersData }] = await Promise.all([
      client.from('AttemptQuestion').select('*').in('attemptId', attemptIds),
      client.from('AttemptAnswer').select('*').in('attemptId', attemptIds),
    ]);

    const questionsByAttempt = new Map<string, AttemptQuestionSnapshot[]>();
    for (const q of (questionsData || [])) {
      const list = questionsByAttempt.get(q.attemptId) || [];
      list.push(q as AttemptQuestionSnapshot);
      questionsByAttempt.set(q.attemptId, list);
    }

    const answersByAttempt = new Map<string, AttemptAnswerType[]>();
    for (const a of (answersData || [])) {
      const list = answersByAttempt.get(a.attemptId) || [];
      list.push(a as AttemptAnswerType);
      answersByAttempt.set(a.attemptId, list);
    }

    return attemptsData.map((att) => ({
      ...att,
      questions: (questionsByAttempt.get(att.id) || []).sort((a, b) => a.order - b.order),
      answers: answersByAttempt.get(att.id) || [],
    })) as AttemptType[];
  } catch (err) {
    console.warn('Supabase fetchAttempts failed:', err);
    return null;
  }
}

export async function saveAttemptToSupabase(client: SupabaseClient, attempt: AttemptType): Promise<boolean> {
  try {
    // Upsert main Attempt row
    const { error: attErr } = await client.from('Attempt').upsert({
      id: attempt.id,
      userName: attempt.userName,
      sectorName: attempt.sectorName,
      sectorId: attempt.sectorId,
      startTime: attempt.startTime,
      endTime: attempt.endTime,
      durationSeconds: attempt.durationSeconds,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      isOfficial: attempt.isOfficial,
      isEligiblePrize: attempt.isEligiblePrize,
      status: attempt.status,
      createdAt: attempt.createdAt,
      updatedAt: new Date().toISOString(),
    });
    if (attErr) throw attErr;

    // Upsert AttemptQuestions snapshot if present
    if (attempt.questions && attempt.questions.length > 0) {
      const questionsToUpsert = attempt.questions.map((q) => ({
        id: q.id,
        attemptId: attempt.id,
        questionId: q.questionId,
        pill: q.pill,
        question: q.question,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        explanation: q.explanation,
        order: q.order,
      }));
      await client.from('AttemptQuestion').upsert(questionsToUpsert);
    }

    // Upsert AttemptAnswers if present
    if (attempt.answers && attempt.answers.length > 0) {
      const answersToUpsert = attempt.answers.map((a) => ({
        id: a.id,
        attemptId: attempt.id,
        questionId: a.questionId,
        selectedOption: a.selectedOption,
        isCorrect: a.isCorrect,
        answeredAt: a.answeredAt,
      }));
      await client.from('AttemptAnswer').upsert(answersToUpsert);
    }

    return true;
  } catch (err) {
    console.error('Supabase saveAttempt failed:', err);
    return false;
  }
}

export async function saveAnswerToSupabase(
  client: SupabaseClient,
  attemptId: string,
  answer: AttemptAnswerType,
  currentScore: number
): Promise<boolean> {
  try {
    // 1. Insert/upsert answer
    await client.from('AttemptAnswer').upsert({
      id: answer.id,
      attemptId,
      questionId: answer.questionId,
      selectedOption: answer.selectedOption,
      isCorrect: answer.isCorrect,
      answeredAt: answer.answeredAt,
    });

    // 2. Update attempt score
    await client
      .from('Attempt')
      .update({ score: currentScore, updatedAt: new Date().toISOString() })
      .eq('id', attemptId);

    return true;
  } catch (err) {
    console.error('Supabase saveAnswer failed:', err);
    return false;
  }
}

export async function syncAllToSupabase(client: SupabaseClient, store: {
  sectors: SectorType[];
  questions: QuestionType[];
  attempts: AttemptType[];
  config: AppConfigType;
  users: UserType[];
}): Promise<{ success: boolean; message: string }> {
  try {
    // Config
    await client.from('AppConfig').upsert({
      id: 'default',
      maxWinners: store.config.maxWinners,
      campaignCode: store.config.campaignCode,
      title: store.config.title,
      prizeDescription: store.config.prizeDescription,
      updatedAt: new Date().toISOString(),
    });

    // Users
    for (const u of store.users) {
      await client.from('User').upsert(u);
    }

    // Sectors
    for (const s of store.sectors) {
      await client.from('Sector').upsert(s);
    }

    // Questions
    for (const q of store.questions) {
      await client.from('Question').upsert(q);
    }

    // Attempts
    for (const att of store.attempts) {
      await saveAttemptToSupabase(client, att);
    }

    return { success: true, message: 'Todos os dados foram sincronizados com o Supabase com sucesso!' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Erro ao sincronizar: ${errorMsg}` };
  }
}
