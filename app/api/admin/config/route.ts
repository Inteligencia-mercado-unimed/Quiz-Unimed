import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { appConfigSchema } from '@/lib/validations';
import { getAppConfig, updateAppConfig } from '@/lib/quiz-service';

export async function GET(req: NextRequest) {
  const adminCheck = requireAdminApi(req);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const config = getAppConfig();
    return NextResponse.json({ config });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao obter configurações' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const adminCheck = requireAdminApi(req);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const body = await req.json();
    const parsed = appConfigSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Configurações inválidas' },
        { status: 400 }
      );
    }

    const updated = updateAppConfig(parsed.data);
    return NextResponse.json({ config: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao atualizar configurações' }, { status: 400 });
  }
}
