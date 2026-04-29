-- ==============================
-- Supabase Storage 버킷 설정
-- ==============================
-- 버킷:
--   villa-images  : 빌라 대표 사진 (public)
--   notice-images : 공지 첨부 (public)
--   message-images: 메시지/민원 사진 (private, signed URL)
--   bill-docs     : 청구서 PDF/이미지 (private)
--   avatars       : 관리자/입주민 프로필 (public)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('villa-images',   'villa-images',   true,  5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('notice-images',  'notice-images',  true,  5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('message-images', 'message-images', false, 5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('bill-docs',      'bill-docs',      false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('avatars',        'avatars',        true,  2097152,  ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ==============================
-- RLS 정책
-- ==============================

-- 공개 버킷 읽기
CREATE POLICY "Public read villa-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'villa-images');

CREATE POLICY "Public read notice-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'notice-images');

CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- 관리자만 villa-images, notice-images, bill-docs 쓰기
CREATE POLICY "Admin write villa-images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'villa-images'
    AND EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid())
  );

CREATE POLICY "Admin update villa-images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'villa-images'
    AND EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid())
  );

CREATE POLICY "Admin delete villa-images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'villa-images'
    AND EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid())
  );

CREATE POLICY "Admin write notice-images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'notice-images'
    AND EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid())
  );

CREATE POLICY "Admin write bill-docs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'bill-docs'
    AND EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid())
  );

-- 로그인한 사용자는 본인 폴더에 avatar/message-image 쓰기
-- path 규칙: <auth_id>/<filename>
CREATE POLICY "User write own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "User update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authenticated write message-images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'message-images'
    AND auth.uid() IS NOT NULL
  );

-- bill-docs, message-images는 해당 빌라 관계자만 읽기 (간단화: 인증된 사용자)
CREATE POLICY "Auth read bill-docs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'bill-docs' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Auth read message-images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'message-images' AND auth.uid() IS NOT NULL
  );
