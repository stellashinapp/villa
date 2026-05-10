import { supabase } from './supabase';

/**
 * 관리자 회원가입 — Supabase 권장 패턴
 *
 * auth.users INSERT 시 트리거(handle_new_admin_user)가 admins row를
 * 자동 생성한다. name/phone 은 user_metadata 로 전달 → 트리거가 읽어서 admins 에 저장.
 *
 * Email confirmation 이 ON 인 환경에서도 동작하도록 signUp 직후 세션이
 * 발급되지 않으면 signInWithPassword 로 즉시 세션을 강제 발급한다.
 */
export async function signUpAdmin(params: {
  email: string;
  password: string;
  name: string;
  phone: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        name: params.name,
        phone: params.phone.replace(/\D/g, ''),
      },
    },
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('계정 생성에 실패했습니다');

  // Email confirmation ON 시 session 미발급 → 즉시 비밀번호 로그인으로 강제
  if (!data.session) {
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });
    if (signInErr) throw new Error('자동 로그인 실패: ' + signInErr.message);
  }

  return data;
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
