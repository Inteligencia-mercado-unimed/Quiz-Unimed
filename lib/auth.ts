import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from './quiz-service';

export function getAdminUserFromRequest(req: NextRequest): { email: string } | null {
  const headerEmail = req.headers.get('x-admin-email');
  const cookieEmail = req.cookies.get('admin_email')?.value;

  const email = headerEmail || cookieEmail;
  if (!email || !isAuthorizedAdmin(email)) {
    return null;
  }

  return { email };
}

export function requireAdminApi(req: NextRequest): { email: string } | NextResponse {
  const admin = getAdminUserFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { error: 'Acesso não autorizado. Apenas administradores cadastrados podem realizar esta operação.' },
      { status: 403 }
    );
  }
  return admin;
}
