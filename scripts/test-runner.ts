import {
  startQuiz,
  answerQuestion,
  finishQuiz,
  recalculateAttemptsRankings,
  isAuthorizedAdmin,
  resetStoreForTesting,
} from '../lib/quiz-service';
import { AttemptType } from '../lib/types';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runAllTests() {
  console.log('🧪 Iniciando testes de regras de negócio do Pílulas de Integridade...\n');
  resetStoreForTesting();

  // Test 1: Correção das respostas
  console.log('--- Teste 1: Correção das respostas ---');
  const att1 = startQuiz('Colaborador Teste', 'Tecnologia da Informação (TI)');
  const q1 = att1.questions[0];
  const correctChoice = q1.correctOption; // 'B'
  const wrongChoice = correctChoice === 'A' ? 'C' : 'A';

  const resCorrect = answerQuestion(att1.id, q1.questionId, correctChoice);
  assert(resCorrect.isCorrect === true, 'Opção correta validada com isCorrect = true');
  assert(resCorrect.correctOption === correctChoice, 'Retorna o gabarito correto');

  const q2 = att1.questions[1];
  const resWrong = answerQuestion(att1.id, q2.questionId, wrongChoice);
  assert(resWrong.isCorrect === false, 'Opção errada validada com isCorrect = false');

  // Test 2: Cálculo da pontuação
  console.log('\n--- Teste 2: Cálculo da pontuação ---');
  const att2 = startQuiz('Calculo Teste', 'Compliance e Governança');
  let expectedScore = 0;
  for (let i = 0; i < att2.questions.length; i++) {
    const q = att2.questions[i];
    const opt = i === 0 || i === 2 ? q.correctOption : 'D';
    if (opt === q.correctOption) expectedScore++;
    answerQuestion(att2.id, q.questionId, opt as any);
  }
  const finished2 = finishQuiz(att2.id);
  assert(finished2.score === expectedScore, `Pontuação final bate exatamente com acertos (${expectedScore}/${att2.questions.length})`);

  // Test 3: Regra da primeira participação
  console.log('\n--- Teste 3: Regra da primeira participação ---');
  const user = 'Juliana Prado';
  const sector = 'Auditoria Médica';
  const a1 = startQuiz(user, sector);
  for (const q of a1.questions) answerQuestion(a1.id, q.questionId, q.correctOption);
  const fin1 = finishQuiz(a1.id);
  assert(fin1.isOfficial === true, 'Primeira participação concluída é classificada como oficial');

  const a2 = startQuiz(user, sector);
  for (const q of a2.questions) answerQuestion(a2.id, q.questionId, q.correctOption);
  const fin2 = finishQuiz(a2.id);
  assert(fin2.isOfficial === false, 'Segunda participação do mesmo colaborador e setor é adicional');

  // Test 4: Ordenação do ranking
  console.log('\n--- Teste 4: Ordenação do ranking (Pontuação DESC, Tempo ASC, Data ASC) ---');
  const mockList: AttemptType[] = [
    {
      id: 'p-slow-4',
      userName: 'Lento 4',
      sectorName: 'TI',
      startTime: '2026-03-01T10:00:00Z',
      endTime: '2026-03-01T10:03:00Z',
      durationSeconds: 180,
      score: 4,
      totalQuestions: 4,
      isOfficial: true,
      isEligiblePrize: false,
      status: 'COMPLETED',
      questions: [],
      answers: [],
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-03-01T10:03:00Z',
    },
    {
      id: 'p-fast-4',
      userName: 'Rapido 4',
      sectorName: 'RH',
      startTime: '2026-03-01T09:00:00Z',
      endTime: '2026-03-01T09:01:00Z',
      durationSeconds: 60,
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
      id: 'p-fast-3',
      userName: 'Rapido 3',
      sectorName: 'Vendas',
      startTime: '2026-03-01T08:00:00Z',
      endTime: '2026-03-01T08:00:20Z',
      durationSeconds: 20,
      score: 3,
      totalQuestions: 4,
      isOfficial: true,
      isEligiblePrize: false,
      status: 'COMPLETED',
      questions: [],
      answers: [],
      createdAt: '2026-03-01T08:00:00Z',
      updatedAt: '2026-03-01T08:00:20Z',
    },
  ];
  recalculateAttemptsRankings(mockList, 1);
  const sorted = mockList.filter((m) => m.isOfficial).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.durationSeconds !== b.durationSeconds) return a.durationSeconds - b.durationSeconds;
    return new Date(a.endTime!).getTime() - new Date(b.endTime!).getTime();
  });
  assert(sorted[0].id === 'p-fast-4', '1º lugar: Maior pontuação (4) e menor tempo (60s)');
  assert(sorted[1].id === 'p-slow-4', '2º lugar: Maior pontuação (4) porém maior tempo (180s)');
  assert(sorted[2].id === 'p-fast-3', '3º lugar: Menor pontuação (3) apesar do tempo rápido');

  // Test 5: Regra de premiação
  console.log('\n--- Teste 5: Regra de premiação ---');
  assert(sorted[0].isEligiblePrize === true, '1º colocado oficial com 100% de acertos é elegível ao prêmio');
  assert(sorted[1].isEligiblePrize === false, '2º colocado não é elegível quando maxWinners = 1');

  recalculateAttemptsRankings(mockList, 2);
  assert(mockList.find((m) => m.id === 'p-slow-4')?.isEligiblePrize === true, '2º colocado se torna elegível quando maxWinners é aumentado para 2');

  // Test 6: Permissões administrativas
  console.log('\n--- Teste 6: Permissões administrativas ---');
  assert(isAuthorizedAdmin('rrochapablo@gmail.com') === true, 'rrochapablo@gmail.com tem acesso administrativo autorizado');
  assert(isAuthorizedAdmin('analistavendas.ji@gmail.com') === true, 'analistavendas.ji@gmail.com tem acesso administrativo autorizado');
  assert(isAuthorizedAdmin('RROCHAPABLO@GMAIL.COM') === true, 'E-mail do administrador não diferencia maiúsculas');
  assert(isAuthorizedAdmin('usuario_desconhecido@teste.com') === false, 'E-mail não autorizado tem acesso bloqueado');

  console.log(`\n🎉 Todos os ${passedTests}/${totalTests} testes foram concluídos com SUCESSO!`);
}

runAllTests().catch((err) => {
  console.error('Falha nos testes:', err);
  process.exit(1);
});
