import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { supabase } from './supabase';

// 푸시 토큰 저장 대상 — 관리자(auth_id)/입주민(id)
type PushTarget =
  | { type: 'admin'; authId: string }
  | { type: 'resident'; id: string };

let currentTarget: PushTarget | null = null;
let listenerReady = false;

async function saveToken(token: string) {
  if (!currentTarget || !token) return;
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
 * Firebase Cloud Messaging 으로 양 플랫폼 통일 — getToken() 이 FCM 토큰 반환.
 * 로그인 직후 호출 → 권한 → FCM 토큰 → Supabase 저장.
 */
export async function registerPush(target: PushTarget): Promise<void> {
  if (!Capacitor.isNativePlatform()) return; // 웹에선 FCM 플러그인 없음 → 스킵
  currentTarget = target;

  try {
    if (!listenerReady) {
      listenerReady = true;
      // 토큰 갱신 시 자동 재저장
      await FirebaseMessaging.addListener('tokenReceived', (event) => { void saveToken(event.token); });
    }

    let receive = (await FirebaseMessaging.checkPermissions()).receive;
    if (receive === 'prompt' || receive === 'prompt-with-rationale') {
      receive = (await FirebaseMessaging.requestPermissions()).receive;
    }
    if (receive !== 'granted') return; // 사용자 거부 — 조용히 종료

    const { token } = await FirebaseMessaging.getToken();
    await saveToken(token);
  } catch (e) {
    console.warn('[push] 초기화 실패', e);
  }
}
