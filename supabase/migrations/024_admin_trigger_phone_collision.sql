-- ============================================================================
-- 024: handle_new_admin_user 트리거 보강 + orphan admins row 복구
-- ----------------------------------------------------------------------------
-- 사고: 동일 phone 으로 두 번째 회원가입 시 partial unique index
-- (admins_phone_unique) 가 막아 admins row 생성 실패 → register-dummy-card
-- 함수가 "admin 행 없음" 404 반환 → 더미카드 등록 단계에서 진행 불가.
--
-- 수정:
--   1. trigger 가 unique_violation 캐치 시 phone NULL 로 fallback INSERT.
--      가입 자체는 성공시키고 admins row 도 생성. 사용자는 나중에 phone 보강.
--   2. 5/8 ~ 5/12 사이 trigger silent fail 로 admins row 없는 auth.users 2건
--      (thezoom@villatolk.app, admin@test.com) 수동 복구.
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
  IF v_phone = '' THEN v_phone := NULL; END IF;

  BEGIN
    INSERT INTO public.admins (auth_id, name, phone, email, role)
    VALUES (NEW.id, v_name, v_phone, NEW.email, 'admin')
    ON CONFLICT (auth_id) DO NOTHING;
  EXCEPTION
    WHEN unique_violation THEN
      -- phone 또는 email 충돌 — phone/email NULL fallback 으로 admins row 만큼은 보장
      BEGIN
        INSERT INTO public.admins (auth_id, name, phone, email, role)
        VALUES (NEW.id, v_name, NULL, NULL, 'admin')
        ON CONFLICT (auth_id) DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'handle_new_admin_user fallback INSERT failed for user %: % / SQLSTATE=%',
          NEW.id, SQLERRM, SQLSTATE;
      END;
    WHEN OTHERS THEN
      RAISE WARNING 'handle_new_admin_user failed for user %: % / SQLSTATE=%',
        NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_admin_user() IS
  '신규 auth.users 에 대응하는 admins row 자동 생성. phone/email unique 충돌 시 NULL fallback.';

-- ----------------------------------------------------------------------------
-- Orphan admins row 복구 — 트리거 silent fail 누적분
-- ----------------------------------------------------------------------------
INSERT INTO public.admins (auth_id, name, phone, email, role)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', ''),
  NULL, -- phone 충돌 회피
  u.email,
  'admin'
FROM auth.users u
LEFT JOIN public.admins a ON a.auth_id = u.id
WHERE a.id IS NULL
ON CONFLICT (auth_id) DO NOTHING;
