-- ====================================================================
-- SUPABASE MIGRATION & SEED SCRIPT
-- Pílulas de Integridade — Unimed Centro Rondônia
-- Política Institucional: POL.INT.7.3
-- ====================================================================

-- 1. TABELA: User (Usuários Administrativos)
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- 2. TABELA: Sector (Setores da Cooperativa)
CREATE TABLE IF NOT EXISTS "Sector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- 3. TABELA: Question (Pílulas e Perguntas de Conformidade)
CREATE TABLE IF NOT EXISTS "Question" (
    "id" TEXT NOT NULL,
    "pill" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctOption" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- 4. TABELA: Attempt (Tentativas de Participação dos Colaboradores)
CREATE TABLE IF NOT EXISTS "Attempt" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "sectorName" TEXT NOT NULL,
    "sectorId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL DEFAULT 4,
    "isOfficial" BOOLEAN NOT NULL DEFAULT true,
    "isEligiblePrize" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- 5. TABELA: AttemptQuestion (Snapshot Imutável das Perguntas no Momento do Quiz)
CREATE TABLE IF NOT EXISTS "AttemptQuestion" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "pill" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctOption" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AttemptQuestion_pkey" PRIMARY KEY ("id")
);

-- 6. TABELA: AttemptAnswer (Respostas Enviadas pelo Colaborador)
CREATE TABLE IF NOT EXISTS "AttemptAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOption" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- 7. TABELA: AppConfig (Configurações Gerais e Vagas de Premiação)
CREATE TABLE IF NOT EXISTS "AppConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "maxWinners" INTEGER NOT NULL DEFAULT 1,
    "campaignCode" TEXT NOT NULL DEFAULT 'POL.INT.7.3',
    "title" TEXT NOT NULL DEFAULT 'Pílulas de Integridade — Unimed Centro Rondônia',
    "prizeDescription" TEXT NOT NULL DEFAULT 'O primeiro participante a acertar todas as perguntas ganha um prêmio!',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- ====================================================================
-- ÍNDICES E CHAVES ÚNICAS
-- ====================================================================

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Sector_name_key" ON "Sector"("name");
CREATE INDEX IF NOT EXISTS "Attempt_userName_sectorName_idx" ON "Attempt"("userName", "sectorName");
CREATE INDEX IF NOT EXISTS "Attempt_isOfficial_score_durationSeconds_endTime_idx" ON "Attempt"("isOfficial", "score", "durationSeconds", "endTime");
CREATE INDEX IF NOT EXISTS "AttemptQuestion_attemptId_idx" ON "AttemptQuestion"("attemptId");
CREATE INDEX IF NOT EXISTS "AttemptAnswer_attemptId_idx" ON "AttemptAnswer"("attemptId");

-- ====================================================================
-- CHAVES ESTRANGEIRAS COM ON DELETE CASCADE
-- ====================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AttemptQuestion_attemptId_fkey'
    ) THEN
        ALTER TABLE "AttemptQuestion"
            ADD CONSTRAINT "AttemptQuestion_attemptId_fkey"
            FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AttemptAnswer_attemptId_fkey'
    ) THEN
        ALTER TABLE "AttemptAnswer"
            ADD CONSTRAINT "AttemptAnswer_attemptId_fkey"
            FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ====================================================================
-- DADOS INICIAIS (SEED)
-- ====================================================================

-- Administradores Iniciais Autorizados
INSERT INTO "User" ("id", "email", "name", "role", "createdAt", "updatedAt")
VALUES
  ('usr-admin-1', 'rrochapablo@gmail.com', 'Pablo Rocha', 'ADMIN', NOW(), NOW()),
  ('usr-admin-2', 'analistavendas.ji@gmail.com', 'Analista de Vendas (Admin)', 'ADMIN', NOW(), NOW())
ON CONFLICT ("email") DO UPDATE SET "role" = 'ADMIN';

-- Configuração Padrão
INSERT INTO "AppConfig" ("id", "maxWinners", "campaignCode", "title", "prizeDescription", "updatedAt")
VALUES ('default', 1, 'POL.INT.7.3', 'Pílulas de Integridade — Unimed Centro Rondônia', 'O primeiro participante a acertar todas as perguntas ganha um prêmio!', NOW())
ON CONFLICT ("id") DO NOTHING;

-- Setores Iniciais
INSERT INTO "Sector" ("id", "name", "active", "createdAt", "updatedAt") VALUES
('sec-1', 'Atendimento ao Cliente / Call Center', true, NOW(), NOW()),
('sec-2', 'Auditoria Médica', true, NOW(), NOW()),
('sec-3', 'Compliance e Governança', true, NOW(), NOW()),
('sec-4', 'Contabilidade e Finanças', true, NOW(), NOW()),
('sec-5', 'Gestão de Pessoas (RH)', true, NOW(), NOW()),
('sec-6', 'Marketing e Comunicação', true, NOW(), NOW()),
('sec-7', 'Tecnologia da Informação (TI)', true, NOW(), NOW()),
('sec-8', 'Vendas e Mercado', true, NOW(), NOW()),
('sec-9', 'Operações e Rede Própria', true, NOW(), NOW())
ON CONFLICT ("name") DO UPDATE SET "active" = true;

-- Perguntas Iniciais (Pílulas #01 a #04)
INSERT INTO "Question" ("id", "pill", "question", "optionA", "optionB", "optionC", "optionD", "correctOption", "explanation", "active", "order", "createdAt", "updatedAt") VALUES
(
    'q-1',
    'Pílula #01',
    'De acordo com a Pílula #01 da política POL.INT.7.3, o que caracteriza primordialmente um conflito de interesses no ambiente cooperativo da Unimed Centro Rondônia?',
    'Quando o colaborador possui uma opinião técnica divergente da diretoria em reuniões de planejamento.',
    'Quando interesses pessoais, familiares ou financeiros de um colaborador podem interferir na imparcialidade e na tomada de decisão em benefício da cooperativa.',
    'Quando o colaborador faz horas extras sem autorização prévia do seu gestor imediato.',
    'Quando há troca de e-mails entre diferentes setores sem a cópia da supervisão.',
    'B',
    'Interesses particulares podem comprometer a imparcialidade. A situação deve ser comunicada com transparência.',
    true,
    1,
    NOW(),
    NOW()
),
(
    'q-2',
    'Pílula #02',
    'Sobre a aceitação de brindes, presentes e hospitalidades corporativas regida pela Pílula #02, qual conduta é permitida?',
    'Aceitar viagens custeadas por fornecedores durante uma negociação de contratos.',
    'Receber brindes institucionais de baixo valor, distribuídos de forma genérica e sem finalidade de influência.',
    'Aceitar dinheiro ou cartões-presente de beneficiários em troca de atendimento preferencial.',
    'Receber descontos particulares exclusivos de empresas contratadas pela Unimed.',
    'B',
    'Brindes de baixo valor e sem intenção de influenciar decisões preservam a transparência institucional.',
    true,
    2,
    NOW(),
    NOW()
),
(
    'q-3',
    'Pílula #03',
    'A Pílula #03 aborda a integridade nas relações com entes públicos e privados. Qual atitude é obrigatória ao lidar com agentes públicos?',
    'Oferecer gratificações para acelerar procedimentos.',
    'Atuar com transparência, respeitar as leis e recusar qualquer vantagem indevida.',
    'Fornecer informações confidenciais de beneficiários mediante pedido verbal.',
    'Conduzir reuniões institucionais sem registro.',
    'B',
    'A relação com agentes públicos exige transparência e recusa de qualquer vantagem indevida.',
    true,
    3,
    NOW(),
    NOW()
),
(
    'q-4',
    'Pílula #04',
    'Segundo a Pílula #04, qual é o canal correto para relatar suspeitas de violação à política de integridade?',
    'Comentar o caso em grupos informais de mensagens.',
    'Utilizar o Canal de Denúncias oficial da cooperativa.',
    'Enviar uma carta à residência dos membros do Conselho.',
    'Ignorar a situação quando não envolver seu setor.',
    'B',
    'O Canal de Denúncias oficial protege o sigilo do relato e o tratamento adequado da situação.',
    true,
    4,
    NOW(),
    NOW()
)
ON CONFLICT ("id") DO UPDATE SET
    "question" = EXCLUDED."question",
    "optionA" = EXCLUDED."optionA",
    "optionB" = EXCLUDED."optionB",
    "optionC" = EXCLUDED."optionC",
    "optionD" = EXCLUDED."optionD",
    "correctOption" = EXCLUDED."correctOption",
    "explanation" = EXCLUDED."explanation";
