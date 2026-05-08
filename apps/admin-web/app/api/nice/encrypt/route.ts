/**
 * POST /api/nice/encrypt
 *
 * 모바일 앱이 NICE 본인인증 시작할 때 호출.
 * 암호화된 요청 데이터(encData) + NICE 인증 URL 을 반환.
 *
 * 모바일은 받은 encData/niceUrl 로 WebView 에서 NICE 인증 페이지 자동 submit.
 */
import { NextResponse } from 'next/server';
import { encryptCheckplus, generateRequestId } from '@/lib/nice-checkplus';

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
    const body = (await req.json().catch(() => ({}))) as { authType?: 'M' | 'X' | 'C' | 'F' };
    const origin = process.env.ADMIN_WEB_URL ?? new URL(req.url).origin;

    const requestId = generateRequestId();
    const successUrl = `${origin}/api/nice/callback?status=success`;
    const failUrl = `${origin}/api/nice/callback?status=fail`;

    const { encData, niceUrl } = encryptCheckplus({
      requestId,
      successUrl,
      failUrl,
      authType: body.authType ?? 'M',
    });

    return NextResponse.json({ requestId, encData, niceUrl }, { headers: corsHeaders });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'encrypt failed';
    return NextResponse.json({ error: msg }, { status: 500, headers: corsHeaders });
  }
}
