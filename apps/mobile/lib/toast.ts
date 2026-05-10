// 전역 Toast 이벤트 emitter — UI 어디서든 showToast() 호출 가능
// _layout.tsx 의 ToastHost 가 구독해서 실제 노출 담당.

export type ToastKind = 'success' | 'error' | 'info' | 'warn';

export interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
}

let listeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function emit() {
  listeners.forEach((l) => l(toasts));
}

export function subscribeToasts(fn: (toasts: Toast[]) => void) {
  listeners.push(fn);
  fn(toasts);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function showToast(
  message: string,
  kind: ToastKind = 'info',
  duration: number = 4000,
): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  toasts = [...toasts, { id, message, kind }];
  emit();
  if (duration > 0) {
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      emit();
    }, duration);
  }
  return id;
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}
