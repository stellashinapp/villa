import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// 임시 진단용 — VM 런타임 env 존재여부 / service_role 쿼리 성공여부만 (민감값 노출 X). 확인 후 제거.
export async function GET() {
  const c = await cookies();
  if (!c.get('villatolk_viewer_email')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const diag: Record<string, unknown> = {
    hasUrl: !!process.env.SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    nodeEnv: process.env.NODE_ENV ?? null,
  };
  try {
    const supabase = createServerClient();
    const { error, count } = await supabase
      .from('admins')
      .select('*', { count: 'exact', head: true });
    diag.queryOk = !error;
    diag.queryError = error?.message ?? null;
    diag.adminCount = count ?? null;
  } catch (e) {
    diag.exception = e instanceof Error ? e.message : String(e);
  }
  return NextResponse.json(diag);
}
