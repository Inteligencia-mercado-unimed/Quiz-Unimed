import { NextRequest, NextResponse } from 'next/server';
import { adminAuthSchema } from '@/lib/validations';
import { isAuthorizedAdmin } from '@/lib/quiz-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = adminAuthSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'E-mail inválido' },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const authorized = isAuthorizedAdmin(email);

    if (!authorized) {
      return NextResponse.json(
        { error: 'Acesso negado. Este e-mail não possui permissão de administrador.' },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        email,
        role: 'ADMIN',
      },
    });

    // Set cookie for session persistence
    response.cookies.set('admin_email', email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro na autenticação' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_email');
  return response;
}
