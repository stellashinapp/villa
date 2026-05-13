/**
 * 브라우저(클라이언트) 측 Supabase. anon 키 사용.
 * 인증·일반 RLS 데이터 접근 모두 이걸 통해.
 */
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
