/**
 * GET /api/keep-alive
 *
 * Vercel Cron 이 매일 호출하여 Supabase 무료 플랜 7일 자동 일시정지를 방지.
 *
 * 보호: Vercel Cron 요청은 `Authorization: Bearer ${CRON_SECRET}` 를 자동 포함.
 *      운영 환경에서는 CRON_SECRET 환경변수 설정 필수 (vercel dashboard 또는 .env).
 *      미설정 시 누구나 호출 가능하므로 production 에서 보호 권장.
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const sb = createServerClient();
  const start = Date.now();

  try {
    const { count, error } = await sb
      .from('admins')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;

    return NextResponse.json({
      ok: true,
      adminCount: count ?? 0,
      latencyMs: Date.now() - start,
      ts: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : 'ping failed',
        latencyMs: Date.now() - start,
      },
      { status: 500 },
    );
  }
}
