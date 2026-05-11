/**
 * POST/GET /api/danal/callback?txSeq=...
 *
 * 다날이 본인확인 완료 후 사용자 브라우저(WebView) 를 redirect.
 * 받은 TID 로 confirm API 호출 → 인증 결과 조회 → WebView 에 postMessage 전달하는 HTML 응답.
 */
import { confirmDanalAuth } from '@/lib/danal-auth';

export const runtime = 'nodejs';

async function handle(req: Request) {
  const url = new URL(req.url);
  const txSeq = url.searchParams.get('txSeq') ?? '';

  let payload: Record<string, string> = {};
  if (req.method === 'POST') {
    const form = await req.formData().catch(() => null);
    if (form) {
      form.forEach((v, k) => {
        payload[k] = String(v);
      });
    }
  } else {
    url.searchParams.forEach((v, k) => {
      payload[k] = v;
    });
  }

  // 다날은 보통 TID 를 callback POST body 의 TID 필드로 전달
  const tid = payload.TID ?? payload.tid ?? '';

  let resultJson: Record<string, unknown>;
  if (!tid) {
    resultJson = { ok: false, error: 'TID 누락', raw: payload };
  } else {
    try {
      const decrypted = await confirmDanalAuth(tid, txSeq);
      resultJson = { ok: true, ...decrypted };
    } catch (e) {
      resultJson = { ok: false, error: e instanceof Error ? e.message : 'confirm failed' };
    }
  }

  const ok = !!resultJson.ok;
  const safeJson = JSON.stringify(resultJson).replace(/</g, '\\u003c');
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>본인인증 결과</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif; padding: 40px 24px; text-align: center; color: #0F2242; }
    h1 { font-size: 18px; margin-bottom: 12px; }
    p { font-size: 14px; color: #5b6d8f; }
  </style>
</head>
<body>
  <h1>${ok ? '본인인증 완료' : '본인인증 실패'}</h1>
  <p>잠시 후 자동으로 닫힙니다…</p>
  <script>
    (function () {
      var msg = ${safeJson};
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DANAL_AUTH_RESULT', payload: msg }));
        } else if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'DANAL_AUTH_RESULT', payload: msg }, '*');
        }
      } catch (e) {}
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function POST(req: Request) {
  return handle(req);
}

export async function GET(req: Request) {
  return handle(req);
}
