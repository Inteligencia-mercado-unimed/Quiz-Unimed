import { NextResponse } from 'next/server';
import { getSectors } from '@/lib/quiz-service';

export async function GET() {
  try {
    const sectors = getSectors().filter((s) => s.active);
    return NextResponse.json({ sectors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar setores' }, { status: 500 });
  }
}
