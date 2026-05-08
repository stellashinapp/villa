/**
 * POST /api/nice/callback?status=success|fail
 *
 * NICE 가 본인인증 후 이 URL 로 사용자 브라우저(WebView) 를 redirect 함.
 * 받은 EncodeData 를 복호화 → 모바일 앱(WebView) 으로 postMessage 전달하는 HTML 응답.
 *
 * NICE 는 form POST 로 호출하므로 POST 만 처리. (일부 케이스 GET 도 호환)
 */
import { decryptCheckplus } from '@/lib/nice-checkplus';

export const runtime = 'nodejs';

async function handle(req: Request, status: 'success' | 'fail') {
  let payload: Record<string, string> = {};

  if (req.method === 'POST') {
    const form = await req.formData();
    form.forEach((v, k) => {
      payload[k] = String(v);
    });
  } else {
    const url = new URL(req.url);
    url.searchParams.forEach((v, k) => {
      payload[k] = v;
    });
  }

  let resultJson: Record<string, unknown>;

  if (status === 'success' && payload.EncodeData) {
    try {
      const decrypted = decryptCheckplus(payload.EncodeData);
      resultJson = { ok: true, ...decrypted };
    } catch (e) {
      resultJson = { ok: false, error: e instanceof Error ? e.message : 'decrypt failed' };
    }
  } else {
    resultJson = {
      ok: false,
      error: payload.EncodeData ? 'fail callback with data' : 'no data',
      raw: payload,
    };
  }

  // WebView 가 받을 수 있도록 postMessage 후 자동 close
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
  <h1>${status === 'success' ? '본인인증 완료' : '본인인증 실패'}</h1>
  <p>잠시 후 자동으로 닫힙니다…</p>
  <script>
    (function () {
      var msg = ${safeJson};
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'NICE_AUTH_RESULT', payload: msg }));
        } else if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'NICE_AUTH_RESULT', payload: msg }, '*');
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
  const status = (new URL(req.url).searchParams.get('status') === 'fail' ? 'fail' : 'success') as
    | 'success'
    | 'fail';
  return handle(req, status);
}

export async function GET(req: Request) {
  const status = (new URL(req.url).searchParams.get('status') === 'fail' ? 'fail' : 'success') as
    | 'success'
    | 'fail';
  return handle(req, status);
}
