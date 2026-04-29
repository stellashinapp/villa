import { supabase } from './supabase';

/**
 * 관리자 회원가입
 * 1. Supabase Auth에 계정 생성 (email/password)
 * 2. admins 테이블에 프로필 생성
 */
export async function signUpAdmin(params: {
  email: string;
  password: string;
  name: string;
  phone: string;
}) {
  // 1) Auth 계정 생성
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
  });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error('계정 생성에 실패했습니다');

  // 2) admins 테이블에 프로필 생성
  const { error: profileError } = await supabase.from('admins').insert({
    auth_id: authData.user.id,
    name: params.name,
    phone: params.phone.replace(/\D/g, ''),
    email: params.email,
    role: 'admin',
  });

  if (profileError) {
    // 프로필 생성 실패 시 Auth 계정도 정리 시도
    await supabase.auth.signOut();
    throw new Error('프로필 생성에 실패했습니다: ' + profileError.message);
  }

  return authData;
}

/**
 * 관리자 로그인
 */
export async function signInAdmin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);

  try {
    const { saveAdminPushToken } = await import('./notifications');
    await saveAdminPushToken();
  } catch {}

  try {
    const { syncAdminFromSupabase } = await import('./sync');
    await syncAdminFromSupabase();
  } catch (err) {
    console.warn('[auth] sync failed:', err);
  }

  return data;
}

/**
 * 로그아웃
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
  try {
    const { clearStore } = await import('./sync');
    await clearStore();
  } catch {}
}

/**
 * 현재 로그인된 관리자 프로필 가져오기
 */
export async function getMyAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  if (error) return null;
  return data;
}

/**
 * 세션 상태 확인
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
