// Expo Push 전송 Edge Function
// Expo Push Service 사용 (FCM 서버키 불필요, Expo가 중계)
// 입력:
//   직접 토큰: { tokens: string[], title, body, data? }
//   타입별:    { type, villaId/adminId/residentId, title, body, data? }
// 모바일 토큰 형식: "ExponentPushToken[...]"

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type PayloadBase = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
};

type Payload = PayloadBase & (
  | { tokens: string[] }
  | { type: 'notice'; villaId: string }
  | { type: 'bill_published'; villaId: string }
  | { type: 'bill_reminder'; villaId: string; unitIds?: string[] }
  | { type: 'message_to_admin'; villaId: string; adminId?: string }
  | { type: 'message_to_resident'; residentId: string }
  | { type: 'payment_result'; adminId: string }
);

async function sendExpoPush(tokens: string[], payload: PayloadBase) {
  if (tokens.length === 0) return { accepted: 0, tickets: [] };

  const messages = tokens
    .filter((t) => t && t.startsWith('ExponentPushToken['))
    .map((to) => ({
      to,
      sound: payload.sound ?? 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
    }));

  if (messages.length === 0) return { accepted: 0, tickets: [] };

  const chunks: Array<typeof messages> = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  const tickets: unknown[] = [];
  for (const chunk of chunks) {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chunk),
    });
    const json = await res.json();
    tickets.push(json);
  }

  return { accepted: messages.length, tickets };
}

// ---- FCM HTTP v1 (Capacitor 네이티브 앱 토큰용) ----
// 서비스계정 키는 Supabase secret FCM_SERVICE_ACCOUNT (JSON 문자열) 로 주입.
let cachedFcmToken: { token: string; exp: number } | null = null;

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN [^-]+-----/, '').replace(/-----END [^-]+-----/, '').replace(/\s/g, '');
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function base64url(data: string | Uint8Array): string {
  const str = typeof data === 'string' ? btoa(data) : btoa(String.fromCharCode(...data));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getFcmAccessToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedFcmToken && cachedFcmToken.exp > now + 60) return cachedFcmToken.token;

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }));
  const unsigned = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    'pkcs8', pemToArrayBuffer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned)));
  const jwt = `${unsigned}.${base64url(sig)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const json = await res.json();
  if (!json.access_token) throw new Error('FCM access token 발급 실패: ' + JSON.stringify(json));
  cachedFcmToken = { token: json.access_token, exp: now + (json.expires_in ?? 3600) };
  return json.access_token;
}

async function sendFcmV1(tokens: string[], payload: PayloadBase) {
  if (tokens.length === 0) return { accepted: 0, results: [] };
  const saRaw = Deno.env.get('FCM_SERVICE_ACCOUNT');
  if (!saRaw) { console.warn('[push] FCM_SERVICE_ACCOUNT 미설정 — FCM 발송 스킵'); return { accepted: 0, results: [], skipped: 'no_service_account' }; }
  const sa = JSON.parse(saRaw) as { client_email: string; private_key: string; project_id: string };
  const accessToken = await getFcmAccessToken(sa);
  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
  const dataStr = Object.fromEntries(Object.entries(payload.data ?? {}).map(([k, v]) => [k, String(v)]));

  let accepted = 0;
  const results: unknown[] = [];
  for (const token of tokens) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: payload.title, body: payload.body },
          data: dataStr,
          android: { priority: 'high', notification: { sound: 'default' } },
          apns: { payload: { aps: { sound: payload.sound === null ? undefined : 'default' } } },
        },
      }),
    });
    const json = await res.json();
    if (res.ok) accepted++;
    results.push(json);
  }
  return { accepted, results };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json() as Payload;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let tokens: string[] = [];

    if ('tokens' in body) {
      tokens = body.tokens;
    } else {
      switch (body.type) {
        case 'notice':
        case 'bill_published': {
          const { data } = await supabase
            .from('residents')
            .select('fcm_token, units!inner(villa_id)')
            .eq('units.villa_id', body.villaId)
            .eq('status', 'active')
            .not('fcm_token', 'is', null);
          tokens = (data ?? []).map((r: { fcm_token: string }) => r.fcm_token).filter(Boolean);
          break;
        }
        case 'bill_reminder': {
          let query = supabase
            .from('residents')
            .select('fcm_token, unit_id, units!inner(villa_id)')
            .eq('units.villa_id', body.villaId)
            .eq('status', 'active')
            .not('fcm_token', 'is', null);
          if (body.unitIds?.length) {
            query = query.in('unit_id', body.unitIds);
          }
          const { data } = await query;
          tokens = (data ?? []).map((r: { fcm_token: string }) => r.fcm_token).filter(Boolean);
          break;
        }
        case 'message_to_admin': {
          if (body.adminId) {
            const { data } = await supabase
              .from('admins')
              .select('fcm_token')
              .eq('id', body.adminId)
              .maybeSingle();
            if (data?.fcm_token) tokens = [data.fcm_token];
          } else {
            const { data } = await supabase
              .from('villas')
              .select('admins:admin_id(fcm_token)')
              .eq('id', body.villaId)
              .maybeSingle();
            const t = (data as { admins?: { fcm_token?: string } } | null)?.admins?.fcm_token;
            if (t) tokens = [t];
          }
          break;
        }
        case 'message_to_resident': {
          const { data } = await supabase
            .from('residents')
            .select('fcm_token')
            .eq('id', body.residentId)
            .maybeSingle();
          if (data?.fcm_token) tokens = [data.fcm_token];
          break;
        }
        case 'payment_result': {
          const { data } = await supabase
            .from('admins')
            .select('fcm_token')
            .eq('id', body.adminId)
            .maybeSingle();
          if (data?.fcm_token) tokens = [data.fcm_token];
          break;
        }
      }
    }

    // 토큰 형식으로 분기 — Expo(ExponentPushToken[...]) vs FCM(Capacitor 네이티브 raw 토큰)
    const payload = { title: body.title, body: body.body, data: body.data, sound: body.sound };
    const expoTokens = tokens.filter((t) => t && t.startsWith('ExponentPushToken['));
    const fcmTokens = tokens.filter((t) => t && !t.startsWith('ExponentPushToken['));
    const [expo, fcm] = await Promise.all([
      sendExpoPush(expoTokens, payload),
      sendFcmV1(fcmTokens, payload),
    ]);
    const result = { accepted: expo.accepted + fcm.accepted, expo, fcm };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[push-notify]', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
