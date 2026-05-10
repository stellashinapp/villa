// 표준 아이콘 — Ionicons. iOS/Android 양쪽 표준 디자인 채택해 가장 익숙한 모양.
// outline / filled 두 변형 지원 (focused 상태일 때 filled 추천).

// React 18 vs vector-icons 타입 호환성 우회 — any 캐스팅.
// 런타임 동작은 정상.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Ionicons: any = require('@expo/vector-icons').Ionicons;

export type IconName =
  | 'home'
  | 'message'
  | 'villa'
  | 'settings'
  | 'bills'
  | 'residents'
  | 'parking'
  | 'notice'
  | 'community'
  | 'report';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  /** true = 채워진 아이콘 (활성/강조), false = 라인 아이콘 (기본) */
  filled?: boolean;
}

const ICON_MAP: Record<IconName, { outline: string; filled: string }> = {
  // 집 — 가장 보편적
  home: { outline: 'home-outline', filled: 'home' },
  // 봉투 (메일/메시지)
  message: { outline: 'mail-outline', filled: 'mail' },
  // 건물/오피스
  villa: { outline: 'business-outline', filled: 'business' },
  // 톱니
  settings: { outline: 'settings-outline', filled: 'settings' },
  // 지갑 — '관리비'/돈에 가장 직관적
  bills: { outline: 'wallet-outline', filled: 'wallet' },
  // 사람들 그룹
  residents: { outline: 'people-outline', filled: 'people' },
  // 자동차
  parking: { outline: 'car-outline', filled: 'car' },
  // 종 (공지/알림)
  notice: { outline: 'notifications-outline', filled: 'notifications' },
  // 말풍선들 (커뮤니티)
  community: { outline: 'chatbubbles-outline', filled: 'chatbubbles' },
  // 문서 (신고/리포트)
  report: { outline: 'document-text-outline', filled: 'document-text' },
};

export default function Icon({ name, size = 22, color = '#1A1D26', filled = false }: IconProps) {
  const ionName = filled ? ICON_MAP[name].filled : ICON_MAP[name].outline;
  return <Ionicons name={ionName} size={size} color={color} />;
}
