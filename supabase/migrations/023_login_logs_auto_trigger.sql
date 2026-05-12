-- ============================================================================
-- 023: 로그인 로그 자동 기록 (RPC 기반)
-- ----------------------------------------------------------------------------
-- 당초 auth.users 트리거 방식 시도했으나 Supabase 가 외부에서 auth.users 에
-- 트리거 만드는 걸 막아 둠 (security policy — auth.users 는 supabase_auth_admin
-- 소유). 대신 앱 측에서 로그인 직후 RPC 호출하는 방식으로 전환.
--
-- 사용처:
--   admin-web /api/auth/login → service_role 로 직접 login_logs INSERT
--     (RLS 우회. record_admin_login RPC 안 거치고 INSERT)
--   모바일 앱 → supabase.rpc('record_admin_login', { p_ip, p_device_info })
--     (인증된 사용자 세션 — RPC 가 auth.uid() 로 admin 식별)
--
-- residents 는 현재 auth.users 와 연결되어 있지 않아 (auth_id 컬럼 없음)
-- 본 RPC 는 admin 로그인만 기록. 입주민 로그인 추적은 향후 별도 RPC.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.record_admin_login(
  p_ip TEXT DEFAULT NULL,
  p_device_info TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin RECORD;
  v_log_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT id, name, phone INTO v_admin
  FROM public.admins
  WHERE auth_id = auth.uid()
  LIMIT 1;

  IF v_admin.id IS NULL THEN
    -- admin row 없는 auth 사용자 (테스트 더미 등) — 기록 생략
    RETURN NULL;
  END IF;

  INSERT INTO public.login_logs (
    user_type, user_id, user_name, user_phone, ip_address, device_info, logged_in_at
  ) VALUES (
    'admin', v_admin.id, v_admin.name, v_admin.phone, p_ip, p_device_info, now()
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[record_admin_login] failed: %', SQLERRM;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.record_admin_login(TEXT, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.record_admin_login(TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.record_admin_login(TEXT, TEXT) IS
  '관리자 로그인 직후 클라이언트(모바일/admin-web)에서 호출. login_logs INSERT. IP·device 인자 옵션.';
