import { createClient } from '@supabase/supabase-js';

// 본사 웹은 service_role 키 사용 (RLS 바이패스)
export function createServerClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
