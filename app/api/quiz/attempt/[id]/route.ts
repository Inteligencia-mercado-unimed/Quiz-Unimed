import { NextRequest, NextResponse } from 'next/server';
import { getAttemptById } from '@/lib/quiz-service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const attempt = getAttemptById(id);

    if (!attempt) {
      return NextResponse.json({ error: 'Tentativa não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ attempt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao buscar tentativa' }, { status: 500 });
  }
}
