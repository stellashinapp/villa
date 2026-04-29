import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export type BucketId = 'villa-images' | 'notice-images' | 'message-images' | 'bill-docs' | 'avatars';

export async function pickImage(options?: ImagePicker.ImagePickerOptions) {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error('사진 접근 권한이 필요합니다');
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
    ...options,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
}

export async function takePhoto(options?: ImagePicker.ImagePickerOptions) {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    throw new Error('카메라 권한이 필요합니다');
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
    ...options,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
}

export async function uploadImage(params: {
  bucket: BucketId;
  path: string;
  uri: string;
  contentType?: string;
}): Promise<{ publicUrl: string | null; path: string }> {
  const { bucket, path, uri, contentType = 'image/jpeg' } = params;

  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`업로드 실패: ${error.message}`);

  const isPublic = ['villa-images', 'notice-images', 'avatars'].includes(bucket);
  if (isPublic) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { publicUrl: data.publicUrl, path };
  }
  return { publicUrl: null, path };
}

export async function getSignedUrl(bucket: BucketId, path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function deleteFile(bucket: BucketId, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(error.message);
}

export function buildUserPath(userId: string, ext = 'jpg') {
  return `${userId}/${Date.now()}.${ext}`;
}
