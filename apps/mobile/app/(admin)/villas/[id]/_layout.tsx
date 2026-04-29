import { Stack } from 'expo-router';

export default function VillaDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="bills" />
      <Stack.Screen name="residents" />
      <Stack.Screen name="parking" />
      <Stack.Screen name="notices" />
      <Stack.Screen name="messages" />
    </Stack>
  );
}
