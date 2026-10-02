import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, loadStore } from '@/lib/quiz-service';
import { getSupabaseClient } from '@/lib/supabase';

function extractEmailFromGoogleHeader(rawHeader: string | null): string | null {
  if (!rawHeader) return null;
  // Format is often "accounts.google.com:user@gmail.com" or just "user@gmail.com"
  const clean = rawHeader.replace(/^accounts\.google\.com:/i, '').trim().toLowerCase();
  return clean.includes('@') ? clean : null;
}

export async function GET(req: NextRequest) {
  // 1. Check Google Cloud Run / IAP / AI Studio headers
  const iapEmail = extractEmailFromGoogleHeader(req.headers.get('x-goog-authenticated-user-email'));
  const xUserEmail = extractEmailFromGoogleHeader(req.headers.get('x-user-email'));
  const xForwardedEmail = extractEmailFromGoogleHeader(req.headers.get('x-forwarded-email'));

  // 2. Check Cookie / Session
  const cookieEmail = req.cookies.get('google_user_email')?.value?.trim().toLowerCase() || null;

  // Candidate email
  const detectedEmail = iapEmail || xUserEmail || xForwardedEmail || cookieEmail;

  if (!detectedEmail) {
    return NextResponse.json({
      authenticated: false,
      email: null,
      isAdmin: false,
      message: 'Nenhuma conta Google ativa detectada no navegador.',
    });
  }

  // Check if admin in local store or Supabase
  let isAdmin = isAuthorizedAdmin(detectedEmail);

  if (!isAdmin) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('User')
          .select('role')
          .eq('email', detectedEmail)
          .maybeSingle();
        if (data?.role === 'ADMIN') {
          isAdmin = true;
        }
      } catch {
        // Ignore
      }
    }
  }

  return NextResponse.json({
    authenticated: true,
    email: detectedEmail,
    isAdmin,
    message: isAdmin
      ? 'Conta Google de Administrador identificada com sucesso.'
      : 'Conta Google identificada, porém não possui privilégios de Administrador. Acesso restrito ao Quiz.',
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'E-mail do Google inválido' }, { status: 400 });
    }

    let isAdmin = isAuthorizedAdmin(email);

    if (!isAdmin) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data } = await supabase
            .from('User')
            .select('role')
            .eq('email', email)
            .maybeSingle();
          if (data?.role === 'ADMIN') {
            isAdmin = true;
          }
        } catch {
          // Ignore
        }
      }
    }

    const response = NextResponse.json({
      success: true,
      email,
      isAdmin,
      message: isAdmin
        ? 'Conta Google autenticada como Administrador.'
        : 'Esta conta Google não está cadastrada como Administrador. Apenas o Quiz está liberado.',
    });

    // Store in cookie for persistent browser identification
    response.cookies.set('google_user_email', email, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
