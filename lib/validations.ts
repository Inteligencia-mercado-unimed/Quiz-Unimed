import { z } from 'zod';

export const startQuizSchema = z.object({
  userName: z.string().trim().min(2, 'Nome completo deve ter pelo menos 2 caracteres').max(120, 'Nome muito longo'),
  sectorName: z.string().trim().min(2, 'Selecione ou informe um setor válido').max(120, 'Nome do setor muito longo'),
  sectorId: z.string().optional(),
});

export const answerQuestionSchema = z.object({
  attemptId: z.string().min(1, 'ID da tentativa obrigatório'),
  questionId: z.string().min(1, 'ID da pergunta obrigatório'),
  selectedOption: z.enum(['A', 'B', 'C', 'D'], {
    message: 'Opção inválida. Deve ser A, B, C ou D.',
  }),
});

export const finishQuizSchema = z.object({
  attemptId: z.string().min(1, 'ID da tentativa obrigatório'),
});

export const sectorSchema = z.object({
  name: z.string().trim().min(2, 'Nome do setor deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  active: z.boolean().optional().default(true),
});

export const questionSchema = z.object({
  pill: z.string().trim().min(2, 'A identificação da pílula é obrigatória (ex: Pílula #01)').max(50),
  question: z.string().trim().min(10, 'O enunciado deve ter pelo menos 10 caracteres'),
  optionA: z.string().trim().min(1, 'A alternativa A é obrigatória'),
  optionB: z.string().trim().min(1, 'A alternativa B é obrigatória'),
  optionC: z.string().trim().min(1, 'A alternativa C é obrigatória'),
  optionD: z.string().trim().min(1, 'A alternativa D é obrigatória'),
  correctOption: z.enum(['A', 'B', 'C', 'D'], {
    message: 'Selecione a resposta correta entre A, B, C ou D',
  }),
  explanation: z.string().trim().min(5, 'A explicação é obrigatória'),
  active: z.boolean().optional().default(true),
  order: z.number().int().optional().default(1),
});

export const appConfigSchema = z.object({
  maxWinners: z.number().int().min(1, 'Pelo menos 1 ganhador deve ser configurado').max(100),
  campaignCode: z.string().trim().optional(),
  title: z.string().trim().optional(),
  prizeDescription: z.string().trim().min(5, 'Descrição do prêmio é obrigatória'),
});

export const adminAuthSchema = z.object({
  email: z.string().trim().email('E-mail inválido'),
  password: z.string().optional(),
});
