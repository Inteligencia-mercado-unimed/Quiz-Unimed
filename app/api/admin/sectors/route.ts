import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { sectorSchema } from '@/lib/validations';
import { getSectors, createSector, updateSector, deleteSector } from '@/lib/quiz-service';

export async function GET(req: NextRequest) {
  const adminCheck = requireAdminApi(req);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const sectors = getSectors();
    return NextResponse.json({ sectors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar setores' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const adminCheck = requireAdminApi(req);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const body = await req.json();
    const parsed = sectorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }

    const sector = createSector(parsed.data.name);
    return NextResponse.json({ sector }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao criar setor' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const adminCheck = requireAdminApi(req);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const body = await req.json();
    const { id, name, active } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'ID e Nome são obrigatórios' }, { status: 400 });
    }

    const sector = updateSector(id, name, active);
    return NextResponse.json({ sector });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao atualizar setor' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const adminCheck = requireAdminApi(req);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    deleteSector(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao excluir setor' }, { status: 400 });
  }
}
