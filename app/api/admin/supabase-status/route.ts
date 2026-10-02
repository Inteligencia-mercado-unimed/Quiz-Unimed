import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin, syncWithSupabase } from '@/lib/quiz-service';
import { testSupabaseConnection } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const adminEmail = req.headers.get('x-admin-email') || req.cookies.get('admin_email')?.value;
  if (!adminEmail || !isAuthorizedAdmin(adminEmail)) {
    return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
  }

  const status = await testSupabaseConnection();
  return NextResponse.json({
    ...status,
    configured: Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY)),
    envVariablesDetected: {
      SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
      SUPABASE_SECRET_KEY: Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
      SUPABASE_PUBLISHABLE_KEY: Boolean(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      SUPABASE_JWKS_URL: Boolean(process.env.SUPABASE_JWKS_URL),
    },
  });
}

export async function POST(req: NextRequest) {
  const adminEmail = req.headers.get('x-admin-email') || req.cookies.get('admin_email')?.value;
  if (!adminEmail || !isAuthorizedAdmin(adminEmail)) {
    return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
  }

  const result = await syncWithSupabase();
  return NextResponse.json(result);
}
