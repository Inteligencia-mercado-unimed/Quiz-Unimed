import { NextRequest, NextResponse } from 'next/server';
import { answerQuestionSchema } from '@/lib/validations';
import { answerQuestion } from '@/lib/quiz-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = answerQuestionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { attemptId, questionId, selectedOption } = parsed.data;
    const result = answerQuestion(attemptId, questionId, selectedOption);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao registrar resposta' }, { status: 500 });
  }
}
