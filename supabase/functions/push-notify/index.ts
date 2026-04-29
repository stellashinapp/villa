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

    const result = await sendExpoPush(tokens, {
      title: body.title,
      body: body.body,
      data: body.data,
      sound: body.sound,
    });

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
