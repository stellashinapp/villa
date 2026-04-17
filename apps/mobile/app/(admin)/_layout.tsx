import { Tabs } from 'expo-router';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(15,27,51,0.95)',
          borderTopColor: '#243555',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#2558D6',
        tabBarInactiveTintColor: '#8893A7',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: '홈', tabBarIcon: () => null /* TODO: 아이콘 */ }}
      />
      <Tabs.Screen
        name="inbox"
        options={{ title: '메시지', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="villas"
        options={{ title: '빌라', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: '설정', tabBarIcon: () => null }}
      />
    </Tabs>
  );
}
