/**
 * PWA Icon — 모바일 앱 Icon (Ionicons) 와 동일한 매핑.
 * 앱 전체 아이콘은 이 컴포넌트로 통일 (이모지 사용 금지).
 */
import {
  IoHomeOutline, IoHome,
  IoMailOutline, IoMail,
  IoMailOpenOutline, IoMailOpen,
  IoBusinessOutline, IoBusiness,
  IoSettingsOutline, IoSettings,
  IoWalletOutline, IoWallet,
  IoPeopleOutline, IoPeople,
  IoCarOutline, IoCar,
  IoNotificationsOutline, IoNotifications,
  IoChatbubblesOutline, IoChatbubbles,
  IoDocumentTextOutline, IoDocumentText,
  IoCardOutline, IoCard,
  IoCheckmarkCircleOutline, IoCheckmarkCircle,
  IoCallOutline, IoCall,
  IoCameraOutline, IoCamera,
  IoSearchOutline, IoSearch,
  IoWarningOutline, IoWarning,
  IoCreateOutline, IoCreate,
  IoCubeOutline, IoCube,
  IoPersonAddOutline, IoPersonAdd,
} from 'react-icons/io5';

export type IconName =
  | 'home'
  | 'message'
  | 'mailOpen'
  | 'villa'
  | 'settings'
  | 'bills'
  | 'residents'
  | 'parking'
  | 'notice'
  | 'community'
  | 'report'
  | 'card'
  | 'check'
  | 'phone'
  | 'camera'
  | 'search'
  | 'alert'
  | 'edit'
  | 'box'
  | 'personAdd';

const MAP: Record<IconName, { outline: typeof IoHomeOutline; filled: typeof IoHome }> = {
  home: { outline: IoHomeOutline, filled: IoHome },
  message: { outline: IoMailOutline, filled: IoMail },
  mailOpen: { outline: IoMailOpenOutline, filled: IoMailOpen },
  villa: { outline: IoBusinessOutline, filled: IoBusiness },
  settings: { outline: IoSettingsOutline, filled: IoSettings },
  bills: { outline: IoWalletOutline, filled: IoWallet },
  residents: { outline: IoPeopleOutline, filled: IoPeople },
  parking: { outline: IoCarOutline, filled: IoCar },
  notice: { outline: IoNotificationsOutline, filled: IoNotifications },
  community: { outline: IoChatbubblesOutline, filled: IoChatbubbles },
  report: { outline: IoDocumentTextOutline, filled: IoDocumentText },
  card: { outline: IoCardOutline, filled: IoCard },
  check: { outline: IoCheckmarkCircleOutline, filled: IoCheckmarkCircle },
  phone: { outline: IoCallOutline, filled: IoCall },
  camera: { outline: IoCameraOutline, filled: IoCamera },
  search: { outline: IoSearchOutline, filled: IoSearch },
  alert: { outline: IoWarningOutline, filled: IoWarning },
  edit: { outline: IoCreateOutline, filled: IoCreate },
  box: { outline: IoCubeOutline, filled: IoCube },
  personAdd: { outline: IoPersonAddOutline, filled: IoPersonAdd },
};

export default function Icon({
  name,
  size = 22,
  color = '#1A1D26',
  filled = false,
}: {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  const C = filled ? MAP[name].filled : MAP[name].outline;
  return <C size={size} color={color} />;
}
