import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import Icon, { type IconName } from '@/components/Icon';

const RES_TAB_ICONS: Record<string, IconName> = {
  '관리비': 'bills',
  '주차': 'parking',
  '공지': 'notice',
  '커뮤니티': 'community',
  '신고': 'report',
  '설정': 'settings',
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={s.iconWrap}>
      <Icon name={RES_TAB_ICONS[label] ?? 'bills'} size={22} color={focused ? '#4263E8' : '#9CA3AF'} />
      {focused && <View style={s.dot} />}
    </View>
  );
}

export default function ResidentLayout() {
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
        name="bills"
        options={{ title: '관리비', tabBarIcon: ({ focused }) => <TabIcon label="관리비" focused={focused} /> }}
      />
      <Tabs.Screen
        name="parking"
        options={{ title: '주차', tabBarIcon: ({ focused }) => <TabIcon label="주차" focused={focused} /> }}
      />
      <Tabs.Screen
        name="notices"
        options={{ title: '공지', tabBarIcon: ({ focused }) => <TabIcon label="공지" focused={focused} /> }}
      />
      <Tabs.Screen
        name="community"
        options={{ title: '커뮤니티', tabBarIcon: ({ focused }) => <TabIcon label="커뮤니티" focused={focused} /> }}
      />
      <Tabs.Screen
        name="report"
        options={{ title: '신고', tabBarIcon: ({ focused }) => <TabIcon label="신고" focused={focused} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: '설정', tabBarIcon: ({ focused }) => <TabIcon label="설정" focused={focused} /> }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  iconWrap: { alignItems: 'center', gap: 4 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4263E8' },
});
