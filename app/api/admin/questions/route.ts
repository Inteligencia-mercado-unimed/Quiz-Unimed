import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { questionSchema } from '@/lib/validations';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '@/lib/quiz-service';

export async function GET(req: NextRequest) {
  const adminCheck = requireAdminApi(req);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const questions = getQuestions();
    return NextResponse.json({ questions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar perguntas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const adminCheck = requireAdminApi(req);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const body = await req.json();
    const parsed = questionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }

    const question = createQuestion({
      pill: parsed.data.pill,
      question: parsed.data.question,
      optionA: parsed.data.optionA,
      optionB: parsed.data.optionB,
      optionC: parsed.data.optionC,
      optionD: parsed.data.optionD,
      correctOption: parsed.data.correctOption,
      explanation: parsed.data.explanation,
      active: parsed.data.active ?? true,
      order: parsed.data.order ?? 1,
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao criar pergunta' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const adminCheck = requireAdminApi(req);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da pergunta obrigatório' }, { status: 400 });
    }

    const question = updateQuestion(id, data);
    return NextResponse.json({ question });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao atualizar pergunta' }, { status: 400 });
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

    deleteQuestion(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao excluir pergunta' }, { status: 400 });
  }
}
