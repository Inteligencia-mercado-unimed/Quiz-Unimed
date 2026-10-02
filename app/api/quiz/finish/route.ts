import { NextRequest, NextResponse } from 'next/server';
import { finishQuizSchema } from '@/lib/validations';
import { finishQuiz } from '@/lib/quiz-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = finishQuizSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { attemptId } = parsed.data;
    const attempt = finishQuiz(attemptId);

    return NextResponse.json({ attempt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao concluir quiz' }, { status: 500 });
  }
}
