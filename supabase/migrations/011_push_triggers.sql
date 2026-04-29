-- ==============================
-- 이벤트 트리거 → push-notify 자동 호출
-- ==============================
-- 전제: pg_net 확장 활성화 + ALTER DATABASE 로 설정값 등록 필요
--   ALTER DATABASE postgres SET "app.settings.supabase_url" TO 'https://<project>.supabase.co';
--   ALTER DATABASE postgres SET "app.settings.service_role_key" TO 'sb_secret_...';

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION notify_push(payload JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/push-notify',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := payload,
    timeout_milliseconds := 15000
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_push failed: %', SQLERRM;
END;
$$;

-- 1. 공지 발행 → 빌라 입주민 전체
CREATE OR REPLACE FUNCTION trg_notice_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM notify_push(jsonb_build_object(
    'type', 'notice',
    'villaId', NEW.villa_id::text,
    'title', '새 공지: ' || NEW.title,
    'body', substring(NEW.body, 1, 80),
    'data', jsonb_build_object('noticeId', NEW.id, 'villaId', NEW.villa_id)
  ));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notice_push_trigger ON notices;
CREATE TRIGGER notice_push_trigger
  AFTER INSERT ON notices
  FOR EACH ROW EXECUTE FUNCTION trg_notice_insert();

-- 2. 청구서 발행 (bill_months.status = 'published') → 빌라 입주민 전체
CREATE OR REPLACE FUNCTION trg_bill_published()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
    PERFORM notify_push(jsonb_build_object(
      'type', 'bill_published',
      'villaId', NEW.villa_id::text,
      'title', NEW.year_month || ' 관리비 청구',
      'body', '관리비 청구서가 발행되었습니다. 앱에서 확인해주세요.',
      'data', jsonb_build_object('billMonthId', NEW.id, 'villaId', NEW.villa_id)
    ));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'published' AND NEW.status = 'published' THEN
    PERFORM notify_push(jsonb_build_object(
      'type', 'bill_published',
      'villaId', NEW.villa_id::text,
      'title', NEW.year_month || ' 관리비 청구',
      'body', '관리비 청구서가 발행되었습니다. 앱에서 확인해주세요.',
      'data', jsonb_build_object('billMonthId', NEW.id, 'villaId', NEW.villa_id)
    ));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bill_published_trigger ON bill_months;
CREATE TRIGGER bill_published_trigger
  AFTER INSERT OR UPDATE ON bill_months
  FOR EACH ROW EXECUTE FUNCTION trg_bill_published();

-- 3. 메시지 (입주민→관리자)
CREATE OR REPLACE FUNCTION trg_message_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM notify_push(jsonb_build_object(
    'type', 'message_to_admin',
    'villaId', NEW.villa_id::text,
    'title', '새 민원/문의',
    'body', substring(NEW.text, 1, 80),
    'data', jsonb_build_object('messageId', NEW.id, 'villaId', NEW.villa_id)
  ));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS message_push_trigger ON messages;
CREATE TRIGGER message_push_trigger
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION trg_message_insert();

-- 4. 메시지 답변 → 해당 입주민
CREATE OR REPLACE FUNCTION trg_message_reply_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  resident_id_var UUID;
BEGIN
  IF NEW.author_type = 'admin' THEN
    SELECT resident_id INTO resident_id_var FROM messages WHERE id = NEW.message_id;
    IF resident_id_var IS NOT NULL THEN
      PERFORM notify_push(jsonb_build_object(
        'type', 'message_to_resident',
        'residentId', resident_id_var::text,
        'title', '관리자 답변',
        'body', substring(NEW.text, 1, 80),
        'data', jsonb_build_object('messageId', NEW.message_id)
      ));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS message_reply_push_trigger ON message_replies;
CREATE TRIGGER message_reply_push_trigger
  AFTER INSERT ON message_replies
  FOR EACH ROW EXECUTE FUNCTION trg_message_reply_insert();

-- 5. 구독 결제 결과 → 관리자
CREATE OR REPLACE FUNCTION trg_sub_payment_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  admin_id_var UUID;
  title_text TEXT;
  body_text TEXT;
BEGIN
  SELECT admin_id INTO admin_id_var FROM subscriptions WHERE id = NEW.subscription_id;

  IF NEW.status = 'success' THEN
    title_text := '결제 완료';
    body_text := NEW.amount || '원이 정상 결제되었습니다';
  ELSIF NEW.status = 'failed' THEN
    title_text := '결제 실패';
    body_text := '카드 결제에 실패했습니다. 앱에서 확인해주세요.';
  ELSE
    RETURN NEW;
  END IF;

  IF admin_id_var IS NOT NULL THEN
    PERFORM notify_push(jsonb_build_object(
      'type', 'payment_result',
      'adminId', admin_id_var::text,
      'title', title_text,
      'body', body_text,
      'data', jsonb_build_object('paymentId', NEW.id, 'status', NEW.status)
    ));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sub_payment_push_trigger ON subscription_payments;
CREATE TRIGGER sub_payment_push_trigger
  AFTER INSERT ON subscription_payments
  FOR EACH ROW EXECUTE FUNCTION trg_sub_payment_insert();
