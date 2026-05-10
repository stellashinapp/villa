import { Tabs, router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { store, subscribe } from '@/lib/store';
import { syncAdminFromSupabase } from '@/lib/sync';
import { getMyAdmin } from '@/lib/auth';
import Icon, { type IconName } from '@/components/Icon';

const TAB_ICON_MAP: Record<string, IconName> = {
  '홈': 'home',
  '메시지': 'message',
  '빌라': 'villa',
  '설정': 'settings',
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={s.iconWrap}>
      <Icon
        name={TAB_ICON_MAP[label] ?? 'home'}
        size={22}
        color={focused ? '#4263E8' : '#9CA3AF'}
        filled={focused}
      />
      {focused && <View style={s.dot} />}
    </View>
  );
}

// 카드 등록 / 활성 구독 가드 — 미등록 상태에서 admin 진입하면 billing 으로 강제.
function useSubscriptionGuard() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try { await syncAdminFromSupabase(); } catch {}
      if (cancelled) return;
      const sub = store.subscription;
      // 카드 등록되어 있고 active/trialing 이면 통과
      const ok = !!sub.cardLast4 && (sub.status === 'active' || sub.status === 'trialing');
      if (ok) return;
      // 차단 — billing 으로
      const me = await getMyAdmin().catch(() => null);
      router.replace({
        pathname: '/payment/billing',
        params: {
          adminId: me?.id ?? '',
          customerName: me?.name ?? '관리자',
          fromSignup: '1', // 강제 등록 모드 (취소 불가)
        },
      });
    })();
    return () => { cancelled = true; };
  }, []);
}

export default function AdminLayout() {
  useSubscriptionGuard();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E8EBF0',
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#4263E8',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: '홈',
          tabBarIcon: ({ focused }) => <TabIcon label="홈" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: '메시지',
          tabBarIcon: ({ focused }) => <TabIcon label="메시지" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="villas"
        options={{
          title: '빌라',
          tabBarIcon: ({ focused }) => <TabIcon label="빌라" focused={focused} />,
        }}
        listeners={{
          // 빌라 탭 클릭 시:
          // - 빌라 1개 → 그 빌라의 상세 페이지로 직행 (목록 스킵)
          // - 빌라 0개 / 2개+ → 빌라 목록(index) 으로
          // 어느 경우든 /add 등에 갇히지 않도록 강제 리셋.
          tabPress: (e) => {
            e.preventDefault();
            const villas = store.villas;
            if (villas.length === 1) {
              router.replace(`/(admin)/villas/${villas[0].id}`);
            } else {
              router.replace('/(admin)/villas');
            }
          },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          tabBarIcon: ({ focused }) => <TabIcon label="설정" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  iconWrap: { alignItems: 'center', gap: 4 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4263E8' },
});
