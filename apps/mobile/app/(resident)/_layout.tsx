import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = { '관리비': '💰', '주차': '🚗', '공지': '📢', '커뮤니티': '👥', '신고': '✉️' };
  return (
    <View style={s.iconWrap}>
      <Text style={[s.icon, focused && s.iconActive]}>{icons[label] || '📋'}</Text>
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
        tabBarActiveTintColor: '#3454D1',
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
    </Tabs>
  );
}

const s = StyleSheet.create({
  iconWrap: { alignItems: 'center', gap: 2 },
  icon: { fontSize: 20, opacity: 0.4 },
  iconActive: { opacity: 1 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#3454D1' },
});
