// 모바일 → Supabase 쓰기 안전망.
//
// 기존 bgWrite() 는 "실패해도 console.warn 만 찍고 끝"이라 네트워크 단절 시 유저는
// 저장된 줄 알지만 DB 엔 안 들어가는 사일런트 손실 위험이 있었다.
//
// 이 모듈은:
// 1) 1차 시도 후 실패 시 지수 백오프 재시도 (1s → 3s → 9s, 최대 3회)
// 2) 최종 실패 시 사용자에게 토스트 알림 (한국어 라벨)
// 3) AppState 가 active 로 돌아올 때 in-flight 재시도 — 네트워크 끊김 → 백그라운드 → 복귀 시나리오 대응
// 4) 진행 중 작업 카운터 노출 → UI 에서 "저장 중…" 인디케이터 표시 가능
//
// 주: 클로저는 직렬화 불가능하므로 AsyncStorage 영속화는 하지 않는다.
// 앱 종료 시점에 in-flight 가 남아있으면 손실되지만, 종료 직전이라
// 어차피 사용자가 알 수 없는 케이스. 핵심 시나리오(네트워크 일시 단절) 는 모두 커버.

import { AppState } from 'react-native';
import { showToast } from './toast';

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 3000, 9000];

interface PendingOp {
  id: string;
  label: string;
  fn: () => Promise<unknown>;
  attempt: number;
  scheduledAt: number; // ms epoch
  timer?: ReturnType<typeof setTimeout>;
}

const pendingMap = new Map<string, PendingOp>();
let pendingCountListeners: Array<(n: number) => void> = [];

function emitPending() {
  const n = pendingMap.size;
  pendingCountListeners.forEach((l) => l(n));
}

export function subscribePending(fn: (n: number) => void): () => void {
  pendingCountListeners.push(fn);
  fn(pendingMap.size);
  return () => {
    pendingCountListeners = pendingCountListeners.filter((l) => l !== fn);
  };
}

export function getPendingCount(): number {
  return pendingMap.size;
}

// 사용자 노출용 라벨 매핑 — store.ts 의 bgWrite('label', ...) 라벨과 1:1.
const LABEL_KO: Record<string, string> = {
  registerResident: '입주민 등록',
  moveOutResident: '입주민 이사 처리',
  createBillMonth: '관리비 월 생성',
  addBillItem: '관리비 항목 추가',
  removeBillItem: '관리비 항목 삭제',
  publishBill: '관리비 발송',
  closeBillMonth: '관리비 마감',
  confirmPayment: '납부 확인',
  addNotice: '공지 추가',
  updateNotice: '공지 수정',
  removeNotice: '공지 삭제',
  togglePinNotice: '공지 고정',
  addParking: '주차 등록',
  removeParking: '주차 삭제',
  addPost: '게시글 작성',
  addComment: '댓글 작성',
  likePost: '게시글 좋아요',
  sendMessage: '민원 전송',
  replyMessage: '민원 답변',
  addResidentReply: '입주민 답변',
};

function userLabel(label: string): string {
  return LABEL_KO[label] ?? label;
}

let nextId = 0;
function genOpId(): string {
  return `${Date.now()}-${nextId++}`;
}

/**
 * 안전한 쓰기 — 실패 시 재시도, 최종 실패 시 토스트.
 *
 * 사용 예:
 *   reliableWrite('addBillItem', async () => {
 *     await supabase.from('bill_items').insert(...);
 *   });
 *
 * 반환: 성공 시 결과, 최종 실패 시 null.
 */
export async function reliableWrite<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T | null> {
  const op: PendingOp = {
    id: genOpId(),
    label,
    fn: fn as () => Promise<unknown>,
    attempt: 0,
    scheduledAt: Date.now(),
  };
  pendingMap.set(op.id, op);
  emitPending();

  try {
    return (await runWithRetry(op)) as T | null;
  } finally {
    pendingMap.delete(op.id);
    emitPending();
  }
}

async function runWithRetry(op: PendingOp): Promise<unknown> {
  while (true) {
    try {
      return await op.fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[outbox:${op.label}] attempt ${op.attempt + 1}/${MAX_RETRIES} failed:`,
        msg,
      );
      op.attempt++;
      if (op.attempt >= MAX_RETRIES) {
        showToast(
          `저장 실패: ${userLabel(op.label)}.\n네트워크 확인 후 다시 시도해주세요.`,
          'error',
          6000,
        );
        return null;
      }
      const delay = RETRY_DELAYS_MS[op.attempt - 1] ?? 9000;
      await sleep(delay);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// AppState 변화 추적 — background→active 전환 시 stale pending 작업이 있다면
// JS 타이머가 재개되면서 자연스럽게 재시도된다. 별도 트리거는 불필요하지만,
// 사용자에게 "저장 중인 작업이 있어요" 신호를 토스트로 한 번 띄워준다.
let lastAppState = AppState.currentState;
AppState.addEventListener('change', (next) => {
  if (lastAppState !== 'active' && next === 'active' && pendingMap.size > 0) {
    showToast(
      `${pendingMap.size}건의 저장 작업을 재시도 중입니다…`,
      'info',
      3000,
    );
  }
  lastAppState = next;
});
