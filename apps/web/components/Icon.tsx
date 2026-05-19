/**
 * PWA Icon — 모바일 앱 Icon (Ionicons) 와 동일한 매핑.
 * mobile/components/Icon.tsx 의 react-native 버전을 web 용으로 옮긴 것.
 */
import {
  IoHomeOutline,
  IoHome,
  IoMailOutline,
  IoMail,
  IoBusinessOutline,
  IoBusiness,
  IoSettingsOutline,
  IoSettings,
  IoWalletOutline,
  IoWallet,
  IoPeopleOutline,
  IoPeople,
  IoCarOutline,
  IoCar,
  IoNotificationsOutline,
  IoNotifications,
  IoChatbubblesOutline,
  IoChatbubbles,
  IoDocumentTextOutline,
  IoDocumentText,
} from 'react-icons/io5';

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

const MAP: Record<IconName, { outline: typeof IoHomeOutline; filled: typeof IoHome }> = {
  home: { outline: IoHomeOutline, filled: IoHome },
  message: { outline: IoMailOutline, filled: IoMail },
  villa: { outline: IoBusinessOutline, filled: IoBusiness },
  settings: { outline: IoSettingsOutline, filled: IoSettings },
  bills: { outline: IoWalletOutline, filled: IoWallet },
  residents: { outline: IoPeopleOutline, filled: IoPeople },
  parking: { outline: IoCarOutline, filled: IoCar },
  notice: { outline: IoNotificationsOutline, filled: IoNotifications },
  community: { outline: IoChatbubblesOutline, filled: IoChatbubbles },
  report: { outline: IoDocumentTextOutline, filled: IoDocumentText },
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
