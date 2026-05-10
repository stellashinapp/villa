-- ============================================================================
-- 017: admins 자동 생성 트리거 (Supabase 공식 권장 패턴)
-- ----------------------------------------------------------------------------
-- 회원가입 시 admins row를 client에서 직접 INSERT하면:
--   1. Email confirmation ON이면 session이 없어 RLS 통과 못함
--   2. 두 번의 네트워크 호출(signUp + insert)로 부분 실패 가능성
--   3. admins 생성과 auth.users 생성이 트랜잭션 분리 → 일관성 깨짐
--
-- 해결: SECURITY DEFINER 트리거가 auth.users INSERT 시점에 admins를
-- 자동으로 만든다. signUp options.data 로 name/phone을 전달.
--
-- 클라이언트 호출 변경:
--   supabase.auth.signUp({
--     email, password,
--     options: { data: { name, phone } }
--   });
-- 그 후 admins.insert() 호출 제거. signUp 한 번이면 끝.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_name  text;
  v_phone text;
BEGIN
  v_name  := COALESCE(NEW.raw_user_meta_data->>'name', '');
  v_phone := REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'phone', ''), '\D', '', 'g');

  -- EXCEPTION 핸들러: trigger 내부 INSERT 가 실패해도 auth.users INSERT 자체는
  -- 통과시켜 회원가입은 성공시킨다. 실제 에러는 Postgres logs 의 RAISE WARNING 으로
  -- 추적 가능. unique 충돌 등 일시적 문제로 가입 차단되지 않도록 안전망.
  BEGIN
    INSERT INTO public.admins (auth_id, name, phone, email, role)
    VALUES (NEW.id, v_name, v_phone, NEW.email, 'admin')
    ON CONFLICT (auth_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_admin_user failed for user %: % / SQLSTATE=%',
      NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_admin_user();

-- 016에서 추가한 admins_insert RLS 정책은 유지(이중 안전장치).
-- 트리거가 SECURITY DEFINER 라 RLS 와 무관하게 INSERT 가능.
