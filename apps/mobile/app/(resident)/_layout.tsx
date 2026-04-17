import { Tabs } from 'expo-router';

export default function ResidentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderTopColor: '#EAEBEF',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#2558D6',
        tabBarInactiveTintColor: '#B8BBC2',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="bills" options={{ title: '관리비' }} />
      <Tabs.Screen name="parking" options={{ title: '주차' }} />
      <Tabs.Screen name="notices" options={{ title: '공지' }} />
      <Tabs.Screen name="community" options={{ title: '커뮤니티' }} />
      <Tabs.Screen name="report" options={{ title: '신고' }} />
    </Tabs>
  );
}
