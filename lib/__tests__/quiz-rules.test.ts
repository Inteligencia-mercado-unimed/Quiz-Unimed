import {
  startQuiz,
  answerQuestion,
  finishQuiz,
  recalculateAttemptsRankings,
  isAuthorizedAdmin,
} from '../quiz-service';
import { AttemptType } from '../types';

describe('Quiz Rules & Business Logic Tests', () => {
  test('1. Correção das respostas: Deve validar resposta correta e incorreta', () => {
    const attempt = startQuiz('Teste Colaborador', 'Tecnologia da Informação (TI)');
    expect(attempt.questions.length).toBeGreaterThan(0);

    const q1 = attempt.questions[0];
    const correctLetter = q1.correctOption; // 'B'
    const wrongLetter = correctLetter === 'A' ? 'B' : 'A';

    // Test correct answer
    const resultCorrect = answerQuestion(attempt.id, q1.questionId, correctLetter);
    expect(resultCorrect.isCorrect).toBe(true);
    expect(resultCorrect.correctOption).toBe(correctLetter);

    // Test wrong answer on another question if available
    if (attempt.questions.length > 1) {
      const q2 = attempt.questions[1];
      const wrongChoice = q2.correctOption === 'A' ? 'C' : 'A';
      const resultWrong = answerQuestion(attempt.id, q2.questionId, wrongChoice);
      expect(resultWrong.isCorrect).toBe(false);
      expect(resultWrong.correctOption).toBe(q2.correctOption);
    }
  });

  test('2. Cálculo da pontuação: Deve somar apenas acertos', () => {
    const attempt = startQuiz('Calculo Teste', 'Compliance e Governança');
    expect(attempt.score).toBe(0);

    let expectedScore = 0;
    for (let i = 0; i < attempt.questions.length; i++) {
      const q = attempt.questions[i];
      // Alternate correct and incorrect
      const option = i % 2 === 0 ? q.correctOption : (q.correctOption === 'A' ? 'C' : 'A');
      if (option === q.correctOption) expectedScore++;
      const res = answerQuestion(attempt.id, q.questionId, option);
      expect(res.attempt.score).toBe(expectedScore);
    }

    const finished = finishQuiz(attempt.id);
    expect(finished.score).toBe(expectedScore);
  });

  test('3. Regra da primeira participação: Primeira é oficial, seguintes são adicionais', () => {
    const userName = 'Marina Souza';
    const sectorName = 'Auditoria Médica';

    // Attempt 1
    const att1 = startQuiz(userName, sectorName);
    for (const q of att1.questions) {
      answerQuestion(att1.id, q.questionId, q.correctOption);
    }
    const finished1 = finishQuiz(att1.id);
    expect(finished1.isOfficial).toBe(true);

    // Attempt 2 (same name and sector)
    const att2 = startQuiz(userName, sectorName);
    for (const q of att2.questions) {
      answerQuestion(att2.id, q.questionId, q.correctOption);
    }
    const finished2 = finishQuiz(att2.id);
    expect(finished2.isOfficial).toBe(false);

    // Attempt 3 (same name but DIFFERENT sector -> considered official for that sector combination)
    const att3 = startQuiz(userName, 'Marketing e Comunicação');
    for (const q of att3.questions) {
      answerQuestion(att3.id, q.questionId, q.correctOption);
    }
    const finished3 = finishQuiz(att3.id);
    expect(finished3.isOfficial).toBe(true);
  });

  test('4. Ordenação do ranking: 1º Pontuação, 2º Menor Tempo, 3º Data mais antiga', () => {
    const mockAttempts: AttemptType[] = [
      {
        id: 'att-b',
        userName: 'Participante B',
        sectorName: 'TI',
        startTime: '2026-03-01T10:00:00Z',
        endTime: '2026-03-01T10:02:00Z',
        durationSeconds: 120,
        score: 4,
        totalQuestions: 4,
        isOfficial: true,
        isEligiblePrize: false,
        status: 'COMPLETED',
        questions: [],
        answers: [],
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-01T10:02:00Z',
      },
      {
        id: 'att-a',
        userName: 'Participante A',
        sectorName: 'RH',
        startTime: '2026-03-01T09:00:00Z',
        endTime: '2026-03-01T09:01:00Z',
        durationSeconds: 60, // Faster! Should beat B with same score
        score: 4,
        totalQuestions: 4,
        isOfficial: true,
        isEligiblePrize: false,
        status: 'COMPLETED',
        questions: [],
        answers: [],
        createdAt: '2026-03-01T09:00:00Z',
        updatedAt: '2026-03-01T09:01:00Z',
      },
      {
        id: 'att-c',
        userName: 'Participante C',
        sectorName: 'Vendas',
        startTime: '2026-03-01T08:00:00Z',
        endTime: '2026-03-01T08:00:30Z',
        durationSeconds: 30, // Very fast, but score is only 3
        score: 3,
        totalQuestions: 4,
        isOfficial: true,
        isEligiblePrize: false,
        status: 'COMPLETED',
        questions: [],
        answers: [],
        createdAt: '2026-03-01T08:00:00Z',
        updatedAt: '2026-03-01T08:00:30Z',
      },
      {
        id: 'att-d',
        userName: 'Participante D',
        sectorName: 'Financeiro',
        startTime: '2026-03-01T09:30:00Z',
        endTime: '2026-03-01T09:31:00Z',
        durationSeconds: 60, // Same score (4) and same duration (60) as A, but later date
        score: 4,
        totalQuestions: 4,
        isOfficial: true,
        isEligiblePrize: false,
        status: 'COMPLETED',
        questions: [],
        answers: [],
        createdAt: '2026-03-01T09:30:00Z',
        updatedAt: '2026-03-01T09:31:00Z',
      },
    ];

    const ranked = recalculateAttemptsRankings(mockAttempts, 1);
    const completedOfficial = ranked.filter((a) => a.isOfficial && a.status === 'COMPLETED');

    // 1st: Participante A (score 4, 60s, earlier date)
    expect(completedOfficial[0].id).toBe('att-a');
    // 2nd: Participante D (score 4, 60s, later date)
    expect(completedOfficial[1].id).toBe('att-d');
    // 3rd: Participante B (score 4, 120s)
    expect(completedOfficial[2].id).toBe('att-b');
    // 4th: Participante C (score 3, 30s)
    expect(completedOfficial[3].id).toBe('att-c');
  });

  test('5. Regra de premiação: 100% de acertos, participação oficial, limite de ganhadores', () => {
    const mockAttempts: AttemptType[] = [
      {
        id: 'win-1',
        userName: 'Vencedor 1',
        sectorName: 'RH',
        startTime: '2026-03-01T09:00:00Z',
        endTime: '2026-03-01T09:01:00Z',
        durationSeconds: 60,
        score: 4,
        totalQuestions: 4, // 100%
        isOfficial: true,
        isEligiblePrize: false,
        status: 'COMPLETED',
        questions: [],
        answers: [],
        createdAt: '2026-03-01T09:00:00Z',
        updatedAt: '2026-03-01T09:01:00Z',
      },
      {
        id: 'win-2',
        userName: 'Vencedor 2',
        sectorName: 'TI',
        startTime: '2026-03-01T10:00:00Z',
        endTime: '2026-03-01T10:01:30Z',
        durationSeconds: 90,
        score: 4,
        totalQuestions: 4, // 100%
        isOfficial: true,
        isEligiblePrize: false,
        status: 'COMPLETED',
        questions: [],
        answers: [],
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-01T10:01:30Z',
      },
      {
        id: 'non-official',
        userName: 'Vencedor 1', // Additional attempt by same user
        sectorName: 'RH',
        startTime: '2026-03-01T11:00:00Z',
        endTime: '2026-03-01T11:00:30Z',
        durationSeconds: 30, // Faster, but not official
        score: 4,
        totalQuestions: 4,
        isOfficial: false,
        isEligiblePrize: false,
        status: 'COMPLETED',
        questions: [],
        answers: [],
        createdAt: '2026-03-01T11:00:00Z',
        updatedAt: '2026-03-01T11:00:30Z',
      },
    ];

    // If maxWinners = 1: only win-1 is eligible
    recalculateAttemptsRankings(mockAttempts, 1);
    expect(mockAttempts.find((a) => a.id === 'win-1')?.isEligiblePrize).toBe(true);
    expect(mockAttempts.find((a) => a.id === 'win-2')?.isEligiblePrize).toBe(false);
    expect(mockAttempts.find((a) => a.id === 'non-official')?.isEligiblePrize).toBe(false);

    // If maxWinners = 2: win-1 and win-2 are eligible
    recalculateAttemptsRankings(mockAttempts, 2);
    expect(mockAttempts.find((a) => a.id === 'win-1')?.isEligiblePrize).toBe(true);
    expect(mockAttempts.find((a) => a.id === 'win-2')?.isEligiblePrize).toBe(true);
    expect(mockAttempts.find((a) => a.id === 'non-official')?.isEligiblePrize).toBe(false);
  });

  test('6. Permissões administrativas: Administrador autorizado e restrições', () => {
    // Authorized default admin
    expect(isAuthorizedAdmin('rrochapablo@gmail.com')).toBe(true);
    expect(isAuthorizedAdmin('RROCHAPABLO@GMAIL.COM')).toBe(true); // Case-insensitive
    expect(isAuthorizedAdmin('  rrochapablo@gmail.com  ')).toBe(true); // Trim

    // Unauthorized email
    expect(isAuthorizedAdmin('hacker@dominio.com')).toBe(false);
    expect(isAuthorizedAdmin('usuario.comum@unimed.coop.br')).toBe(false);
    expect(isAuthorizedAdmin('')).toBe(false);
  });
});
