import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { getDashboardMetrics } from '@/lib/quiz-service';

export async function GET(req: NextRequest) {
  const adminCheck = requireAdminApi(req);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const metrics = getDashboardMetrics();
    return NextResponse.json(metrics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar métricas' }, { status: 500 });
  }
}
