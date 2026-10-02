import { NextRequest, NextResponse } from 'next/server';
import { startQuizSchema } from '@/lib/validations';
import { startQuiz } from '@/lib/quiz-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = startQuizSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { userName, sectorName, sectorId } = parsed.data;
    const attempt = startQuiz(userName, sectorName, sectorId);

    return NextResponse.json({ attempt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao iniciar quiz' }, { status: 500 });
  }
}
