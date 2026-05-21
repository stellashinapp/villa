import Link from 'next/link';
import LogoutButton from './LogoutButton';

const NAV_ITEMS = [
  { href: '/', icon: '📊', label: '대시보드', group: 'OVERVIEW' },
  { href: '/admins', icon: '👤', label: '관리자 관리', group: 'MANAGEMENT' },
  { href: '/villas', icon: '🏘️', label: '빌라 관리', group: 'MANAGEMENT' },
  { href: '/residents', icon: '👥', label: '입주민', group: 'MANAGEMENT' },
  { href: '/cs', icon: '🛟', label: '고객지원 (CS)', group: 'SUPPORT' },
  { href: '/inquiries', icon: '📩', label: '민원 모니터링', group: 'SUPPORT' },
  { href: '/subscriptions', icon: '📈', label: '구독·매출', group: 'REVENUE' },
  { href: '/payments', icon: '💳', label: '결제 내역', group: 'REVENUE' },
  { href: '/schema', icon: '🗄️', label: 'DB / API', group: 'SYSTEM' },
  { href: '/settings', icon: '⚙️', label: '설정', group: 'SYSTEM' },
];

// 사이드바/레이아웃은 Tailwind 커스텀 테마 컴파일 상태와 무관하게 항상 보이도록 인라인 스타일 사용.
const SIDEBAR_W = 240;

export default function ChromeShell({
  children,
  viewer,
  superAdmin,
}: {
  children: React.ReactNode;
  viewer: string | null;
  superAdmin: boolean;
}) {
  const groups = NAV_ITEMS.reduce<Record<string, typeof NAV_ITEMS>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* 사이드바 hover 효과는 인라인으로 불가 → 작은 전역 스타일 */}
      <style>{`.vt-nav-link:hover{background:rgba(255,255,255,.07);color:#fff!important}`}</style>

      <aside
        style={{
          width: SIDEBAR_W,
          background: '#1B2A4A',
          borderRight: '1px solid #2E4A7A',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          overflowY: 'auto',
          zIndex: 20,
        }}
      >
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #2E4A7A' }}>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', margin: 0 }}>빌라톡 어드민</h1>
          <span style={{ fontSize: 10, color: '#7889A5', letterSpacing: '2px', fontWeight: 600 }}>VILLATOLK ADMIN</span>
        </div>

        <nav style={{ padding: 12 }}>
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#7889A5', letterSpacing: '1.5px', padding: '12px 8px 8px' }}>
                {group}
              </div>
              {items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="vt-nav-link"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#B0BED0',
                    textDecoration: 'none',
                    transition: 'background .15s, color .15s',
                  }}
                >
                  <span style={{ width: 18, textAlign: 'center', fontSize: 16 }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main style={{ flex: 1, marginLeft: SIDEBAR_W, minHeight: '100vh', background: '#F5F6FA' }}>
        <header
          style={{
            height: 60,
            borderBottom: '1px solid #E8EBF0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            background: '#fff',
            position: 'sticky',
            top: 0,
            zIndex: 5,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1D26' }}>빌라톡 어드민</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {viewer && (
              <span style={{ fontSize: 12, color: '#8A93A6' }}>
                <span style={{ fontWeight: 600, color: '#4A5160' }}>{viewer}</span>
                {superAdmin && (
                  <span style={{ marginLeft: 6, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#FEF3C7', color: '#B45309' }}>슈퍼</span>
                )}
              </span>
            )}
            <LogoutButton />
          </div>
        </header>
        <div style={{ padding: 24 }}>{children}</div>
      </main>
    </div>
  );
}
