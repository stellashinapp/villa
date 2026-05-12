-- ============================================================================
-- 026: 결제 멱등성 강화 — toss_payment_key UNIQUE 인덱스
-- ----------------------------------------------------------------------------
-- 토스페이먼츠 webhook 은 네트워크/재시도/이중 발사 등으로 동일 paymentKey
-- 가 2회+ 들어올 수 있다. 현재 payment-webhook 함수는 maybeSingle() 후
-- 분기로 멱등성을 시도하지만 race condition 시 두 요청 다 통과해 multi
-- INSERT 가능 → 같은 결제 중복 청구·매출 통계 오류.
--
-- DB 레벨 UNIQUE 제약을 추가해 race 와 무관하게 중복 INSERT 를 거부한다.
-- partial unique (toss_payment_key NULL 허용) — 더미 결제·테스트 데이터 통과.
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS subscription_payments_toss_payment_key_unique
  ON subscription_payments (toss_payment_key)
  WHERE toss_payment_key IS NOT NULL;

COMMENT ON INDEX subscription_payments_toss_payment_key_unique IS
  '토스 paymentKey 중복 INSERT 방지. payment-webhook race condition 멱등성 보장.';
