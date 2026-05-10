// 회원가입 마지막 단계 — auth.users 생성 + trialing 구독 + (옵션) 빌라 등록 + sync.
//
// step2 의 "나중에 할께요" 와 step3 의 "카드 등록하고 시작" 이 둘 다 사용한다.
// 빌라를 안 만들고 끝낸 사용자는 가입 후 설정 → 빌라 추가에서 등록.

import { Alert } from 'react-native';
import { signUpAdmin, getMyAdmin } from './auth';
import { supabase } from './supabase';
import { getSignupData, clearSignupData } from './signup-store';
import { createVilla } from './villas';
import { syncAdminFromSupabase } from './sync';
import { store } from './store';

export interface CompleteSignupResult {
  ok: boolean;
  adminId: string | null;
  customerName: string;
  /** 사용자에게 alert 으로 노출된 비치명적 경고 (있으면 후속 단계에 전달용) */
  warning?: string;
}

interface CompleteSignupOptions {
  /** false 면 빌라 정보가 있어도 createVilla 를 호출하지 않음 ("나중에 할께요" 케이스) */
  createVillaIfPresent: boolean;
}

/**
 * 가입 완료 처리. 성공 시 ok=true, adminId/customerName 반환 → 호출자가 billing 으로 라우팅.
 * 실패 시 적절한 Alert 띄우고 ok=false 반환.
 */
export async function completeSignup(
  options: CompleteSignupOptions = { createVillaIfPresent: true },
): Promise<CompleteSignupResult> {
  const signupData = await getSignupData();
  if (!signupData?.email || !signupData?.password) {
    Alert.alert('오류', '가입 정보가 누락되었습니다. 처음부터 다시 시도해주세요.');
    return { ok: false, adminId: null, customerName: '' };
  }

  const customerName = signupData.name ?? '관리자';

  // 1) Supabase Auth 회원가입.
  // 이미 가입된 이메일이면 로그인으로 폴백 → 사용자가 막히지 않게.
  try {
    await signUpAdmin({
      email: signupData.email,
      password: signupData.password,
      name: signupData.name,
      phone: signupData.phone,
    });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    const alreadyExists =
      /already.*registered|user.*exists|already.*signed.*up/i.test(msg) ||
      err?.code === 'user_already_exists';

    if (alreadyExists) {
      // 동일 이메일로 재시도 → 비밀번호 일치 시 그대로 진행
      try {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email: signupData.email,
          password: signupData.password,
        });
        if (signInErr || !data.session) {
          Alert.alert(
            '이미 가입된 계정',
            '이 이메일로 이미 가입되어 있습니다. 로그인 화면에서 진행해주세요.',
          );
          return { ok: false, adminId: null, customerName };
        }
        console.log('[signup-complete] existing account — signed in instead');
      } catch (signInCatchErr: any) {
        Alert.alert('로그인 실패', signInCatchErr?.message ?? '로그인 시도 실패');
        return { ok: false, adminId: null, customerName };
      }
    } else {
      Alert.alert('회원가입 실패', msg);
      return { ok: false, adminId: null, customerName };
    }
  }

  // 2) 구독 + (옵션) 빌라 — 실패해도 계정은 살아있으므로 안내 후 진행
  let adminId: string | null = null;
  let createdVillaId: string | null = null;
  let warning: string | undefined;
  try {
    const admin = await getMyAdmin();
    if (!admin) throw new Error('관리자 프로필을 찾을 수 없습니다');
    adminId = admin.id;

    const { error: subError } = await supabase.from('subscriptions').insert({
      admin_id: admin.id,
      status: 'trialing',
      billing_day: 1,
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (subError) {
      console.warn('[signup-complete] subscription insert failed:', subError.message);
    }

    if (options.createVillaIfPresent && signupData.villaName && signupData.totalUnits) {
      const villa = await createVilla({
        name: signupData.villaName,
        address: signupData.villaAddress || '',
        totalUnits: signupData.totalUnits,
        unitsPerFloor: signupData.unitsPerFloor || 2,
        accountBank: signupData.accountBank,
        accountNumber: signupData.accountNumber,
        accountHolder: signupData.accountHolder,
      });
      createdVillaId = villa?.id ?? null;
      console.log('[signup-complete] villa created:', createdVillaId);
    } else {
      console.log('[signup-complete] villa creation skipped');
    }

    // 3) store 동기화 — 빌라가 안 잡히면 1회 재시도 (read-after-write 방어)
    await syncAdminFromSupabase();
    if (createdVillaId && !store.villas.some((v) => v.id === createdVillaId)) {
      console.warn('[signup-complete] villa missing after first sync — retrying...');
      await new Promise((r) => setTimeout(r, 800));
      await syncAdminFromSupabase();
      if (!store.villas.some((v) => v.id === createdVillaId)) {
        console.error('[signup-complete] villa still missing after retry');
      }
    }
  } catch (err: any) {
    console.error('[signup-complete] post-auth error:', err);
    warning = (err?.message ?? String(err)) + '\n계정은 생성됐습니다. 설정에서 빌라를 다시 추가해주세요.';
    Alert.alert('일부 정보 등록 실패', warning);
  }

  await clearSignupData();
  return { ok: true, adminId, customerName, warning };
}
