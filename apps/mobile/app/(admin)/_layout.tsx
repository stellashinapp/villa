import { Tabs, router } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { store } from '@/lib/store';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = { '홈': '🏠', '메시지': '✉️', '빌라': '🏘️', '설정': '⚙️' };
  return (
    <View style={s.iconWrap}>
      <Text style={[s.icon, focused && s.iconActive]}>{icons[label] || '📋'}</Text>
      {focused && <View style={s.dot} />}
    </View>
  );
}

export default function AdminLayout() {
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
  iconWrap: { alignItems: 'center', gap: 2 },
  icon: { fontSize: 20, opacity: 0.4 },
  iconActive: { opacity: 1 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4263E8' },
});
