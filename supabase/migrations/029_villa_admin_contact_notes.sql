-- ============================================================================
-- 029: 빌라 — 관리자 연락처 노출 여부 + 특이사항 + 은행 코드
-- ----------------------------------------------------------------------------
-- 빌라 추가/수정 시:
--   - expose_admin_contact: 입주민에게 관리자 성함·전화 노출 여부 (기본 false)
--   - special_notes: 특이사항 — 입주민에게 항시 표시되는 안내문
--   - account_bank_code: 금융결제원 표준 은행 코드 (토스페이먼츠 가상계좌·이체 연동 대비)
--                        account_bank(은행명) 와 함께 저장. 기존 데이터는 NULL 허용.
-- ============================================================================

ALTER TABLE villas
  ADD COLUMN IF NOT EXISTS expose_admin_contact BOOLEAN DEFAULT false;

ALTER TABLE villas
  ADD COLUMN IF NOT EXISTS special_notes TEXT;

ALTER TABLE villas
  ADD COLUMN IF NOT EXISTS account_bank_code TEXT;

COMMENT ON COLUMN villas.expose_admin_contact IS
  '입주민 앱에서 관리자 성함·전화번호 노출 여부 (기본 비공개)';
COMMENT ON COLUMN villas.special_notes IS
  '특이사항 — 입주민에게 항시 표시되는 안내문 (예: 분리수거 요일, 주차 규칙)';
COMMENT ON COLUMN villas.account_bank_code IS
  '금융결제원 표준 은행 코드 (토스페이먼츠 연동용). BANKS 상수의 code 와 매핑.';

-- ----------------------------------------------------------------------------
-- 입주민(anon) 이 관리자 연락처를 안전하게 조회하는 RPC
--   - expose_admin_contact = true 인 빌라만 name/phone 반환
--   - admins 테이블 전체를 anon 에 노출하지 않기 위해 SECURITY DEFINER 사용
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_villa_admin_contact(p_villa_id UUID)
RETURNS TABLE (admin_name TEXT, admin_phone TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.name, a.phone
  FROM villas v
  JOIN admins a ON a.id = v.admin_id
  WHERE v.id = p_villa_id
    AND v.expose_admin_contact = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_villa_admin_contact(UUID) TO anon, authenticated;
