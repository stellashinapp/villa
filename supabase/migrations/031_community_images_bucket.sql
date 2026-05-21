-- ============================================================================
-- 031: 커뮤니티 게시글 사진 첨부용 스토리지 버킷
-- ----------------------------------------------------------------------------
-- 입주민(anon)이 커뮤니티 글에 사진을 첨부할 수 있어야 함.
-- 입주민은 Supabase Auth 세션이 없고 anon 키로 접근하므로
-- (resident-login 은 service_role 로 데이터만 반환, auth.uid() = null),
-- posts / parking / messages 와 동일한 permissive 모델(anon write)을 적용한다.
--
-- 보안 모델: security_pipa_pending 메모와 동일.
--   - 현재는 anon insert 허용 (출시 전 PIPA 단계에서 SECURITY DEFINER/JWT 로 강화 예정)
--   - 5MB 제한 + 이미지 MIME 만 허용으로 남용 범위 축소
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('community-images', 'community-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 공개 읽기 (입주민/관리자 모두 표시)
DROP POLICY IF EXISTS "Public read community-images" ON storage.objects;
CREATE POLICY "Public read community-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'community-images');

-- anon(입주민) + authenticated(관리자) 쓰기
DROP POLICY IF EXISTS "Anon write community-images" ON storage.objects;
CREATE POLICY "Anon write community-images" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'community-images');
