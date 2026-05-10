// 크로스플랫폼 확인 다이얼로그.
// react-native-web 의 Alert.alert 다중버튼은 onPress 콜백이 호출되지 않아 막힘.
// web 에서는 window.confirm 으로 폴백.

import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string; // 기본: '확인'
  cancelText?: string; // 기본: '취소'
  destructive?: boolean;
}

/**
 * 사용자 확인을 받아 true/false 반환. 크로스플랫폼 호환.
 *
 * 사용 예:
 *   if (await confirmAction({ title: '삭제', message: '정말?', destructive: true })) {
 *     // 삭제 처리
 *   }
 */
export function confirmAction(opts: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return Promise.resolve(false);
    const text = [opts.title, opts.message].filter(Boolean).join('\n\n');
    return Promise.resolve(window.confirm(text));
  }
  return new Promise((resolve) => {
    Alert.alert(
      opts.title,
      opts.message,
      [
        { text: opts.cancelText ?? '취소', style: 'cancel', onPress: () => resolve(false) },
        {
          text: opts.confirmText ?? '확인',
          style: opts.destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
