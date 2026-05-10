-- ============================================================================
-- 019: 회원가입 시 email 자동 confirm
-- ----------------------------------------------------------------------------
-- 빌라톡은 NICE 본인인증으로 신원을 확인하므로 Supabase 의 email confirmation
-- 절차가 의미가 없고 오히려 가입 마찰만 늘린다. 또한 무료 plan 의 SMTP rate
-- limit 으로 테스트/실사용에 차단이 발생한다.
--
-- 해결: BEFORE INSERT trigger 가 email_confirmed_at / confirmed_at 을 즉시
-- 채워서, GoTrue 가 confirmation email 을 발송하지 않도록 만든다.
-- 결과적으로 signUp 직후 곧바로 session 발급 → 클라이언트에서 정상 흐름.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_confirm_admin_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := now();
    NEW.confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_admin_email();
