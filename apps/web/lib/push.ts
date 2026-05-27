import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from './supabase';

// 푸시 토큰 저장 대상 — 관리자(auth_id)/입주민(id)
type PushTarget =
  | { type: 'admin'; authId: string }
  | { type: 'resident'; id: string };

let currentTarget: PushTarget | null = null;
let listenersReady = false;

async function saveToken(token: string) {
  if (!currentTarget) return;
  try {
    if (currentTarget.type === 'admin') {
      await supabase.from('admins').update({ fcm_token: token }).eq('auth_id', currentTarget.authId);
    } else {
      await supabase.from('residents').update({ fcm_token: token }).eq('id', currentTarget.id);
    }
  } catch (e) {
    console.warn('[push] 토큰 저장 실패', e);
  }
}

/**
 * Capacitor 네이티브 앱(iOS/Android)에서만 푸시 등록.
 * 웹/PWA 브라우저에서는 아무것도 안 함(조용히 스킵).
 * 로그인 직후 호출 → 권한 요청 → FCM/APNs 토큰 발급 → Supabase 저장.
 */
export async function registerPush(target: PushTarget): Promise<void> {
  if (!Capacitor.isNativePlatform()) return; // 웹에선 푸시 플러그인 없음 → 스킵
  currentTarget = target;

  try {
    if (!listenersReady) {
      listenersReady = true;
      await PushNotifications.addListener('registration', (token) => { void saveToken(token.value); });
      await PushNotifications.addListener('registrationError', (err) => { console.warn('[push] 등록 오류', err); });
    }

    let receive = (await PushNotifications.checkPermissions()).receive;
    if (receive === 'prompt' || receive === 'prompt-with-rationale') {
      receive = (await PushNotifications.requestPermissions()).receive;
    }
    if (receive !== 'granted') return; // 사용자 거부 — 조용히 종료
    await PushNotifications.register();
  } catch (e) {
    console.warn('[push] 초기화 실패', e);
  }
}
