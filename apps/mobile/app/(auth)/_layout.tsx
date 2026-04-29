import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup/step1-account" />
      <Stack.Screen name="signup/step2-villa" />
      <Stack.Screen name="signup/step3-plan" />
      <Stack.Screen name="resident-login" />
      <Stack.Screen name="find-account" />
    </Stack>
  );
}
