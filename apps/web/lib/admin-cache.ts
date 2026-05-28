'use client';

import { supabase } from './supabase';

/**
 * 관리자 본인 정보 모듈 캐시 (탭 전환 시마다 같은 쿼리 반복 방지)
 *
 * 효과: 한 세션 내에서 auth.getUser() + admins 쿼리를 1번만 → 이후 호출 즉시 반환.
 * 무효화는 로그아웃·프로필 수정 시 clearAdminCache() 명시 호출.
 */

export type CachedAdmin = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  auth_id: string | null;
};

let cached: CachedAdmin | null = null;
let inflight: Promise<CachedAdmin | null> | null = null;

export async function getCurrentAdmin(): Promise<CachedAdmin | null> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('admins')
        .select('id, name, email, phone, role, auth_id')
        .eq('auth_id', user.id)
        .maybeSingle();
      cached = data as CachedAdmin | null;
      return cached;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function clearAdminCache() {
  cached = null;
}
