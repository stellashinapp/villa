/**
 * 브라우저(클라이언트) 측 Supabase. anon 키 사용.
 *
 * NEXT_PUBLIC_* 는 빌드 시 inline 되어 클라이언트에 노출됨 → 보안 등급은
 * "공개 설정값". Vercel env 등록 누락 시 fallback 값으로 안전 동작.
 * (anon 키 자체는 RLS 가 보호 — Supabase 공식 권장)
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://tdgieeupxxalwxikdxji.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_1Ey6yq_QITDQ76SzEwljPQ_x37wLGly';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
