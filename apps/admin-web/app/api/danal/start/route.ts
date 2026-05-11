/**
 * POST /api/danal/start
 *
 * 모바일 앱이 다날 본인확인 시작할 때 호출.
 * 다날 ready API 로 TID 발급 → 모바일 WebView 가 이동할 authUrl 반환.
 *
 * 응답: { txSeq, tid, authUrl }
 *
 * 모바일은 받은 authUrl 로 WebView 이동 → 사용자가 PASS/SMS 인증 →
 * 다날이 /api/danal/callback 으로 redirect.
 */
import { NextResponse } from 'next/server';
import { startDanalAuth, generateTxSeq } from '@/lib/danal-auth';

export const runtime = 'nodejs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const origin = process.env.ADMIN_WEB_URL ?? new URL(req.url).origin;
    const txSeq = generateTxSeq();
    const targetUrl = `${origin}/api/danal/callback?txSeq=${encodeURIComponent(txSeq)}`;

    const { tid, authUrl } = await startDanalAuth({
      txSeq,
      targetUrl,
      cpTitle: '빌라톡',
    });

    return NextResponse.json({ txSeq, tid, authUrl }, { headers: corsHeaders });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'danal start failed';
    return NextResponse.json({ error: msg }, { status: 500, headers: corsHeaders });
  }
}
