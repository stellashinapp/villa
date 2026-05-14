-- ============================================================================
-- 027: residents.status enum 확장 — 입주민 자가 신청·이주 흐름
-- ----------------------------------------------------------------------------
-- 기존: 'active', 'moved_out' 만 허용.
-- 추가: 'pending'(신청 대기), 'pending_moveout'(이주 알림 대기), 'rejected'(거부).
--
-- 흐름:
--   pending  → active  (관리자 승인)
--   pending  → rejected (관리자 거부)
--   active   → pending_moveout (입주민 이사 알림)
--   pending_moveout → moved_out (관리자 확정)
-- ============================================================================

ALTER TABLE public.residents DROP CONSTRAINT IF EXISTS residents_status_check;
ALTER TABLE public.residents
  ADD CONSTRAINT residents_status_check
  CHECK (status IN ('pending', 'active', 'pending_moveout', 'moved_out', 'rejected'));

-- 신청 시각·승인 시각 추적용 컬럼
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES admins(id) ON DELETE SET NULL;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS reject_reason TEXT;

-- 본사·관리자 콘솔에서 pending 빠르게 조회
CREATE INDEX IF NOT EXISTS idx_residents_status_villa
  ON public.residents (status, unit_id)
  WHERE status IN ('pending', 'pending_moveout');

COMMENT ON COLUMN public.residents.status IS
  'pending(신청대기) / active(활성) / pending_moveout(이주신청) / moved_out / rejected';
