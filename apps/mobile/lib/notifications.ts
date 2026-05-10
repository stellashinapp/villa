import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[push] Must use physical device');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4263E8',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('[push] Permission denied');
    return null;
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const token = projectId
      ? (await Notifications.getExpoPushTokenAsync({ projectId })).data
      : (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch (err) {
    console.warn('[push] Token fetch failed:', err);
    return null;
  }
}

export async function saveAdminPushToken() {
  const token = await registerForPushNotifications();
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  await supabase.from('admins').update({ fcm_token: token }).eq('auth_id', user.id);
  return token;
}

export async function saveResidentPushToken(residentId: string) {
  const token = await registerForPushNotifications();
  if (!token) return null;
  await supabase.from('residents').update({ fcm_token: token }).eq('id', residentId);
  return token;
}

export async function sendPush(payload: {
  type?: 'notice' | 'bill_published' | 'bill_reminder' | 'message_to_admin' | 'message_to_resident' | 'payment_result';
  tokens?: string[];
  villaId?: string;
  adminId?: string;
  residentId?: string;
  unitIds?: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  const { error } = await supabase.functions.invoke('push-notify', { body: payload });
  if (error) console.warn('[push] Send failed:', error.message);
}

export function useNotificationListener(handler: (n: Notifications.Notification) => void) {
  const subscription = Notifications.addNotificationReceivedListener(handler);
  return () => subscription.remove();
}

export function useNotificationTapListener(handler: (r: Notifications.NotificationResponse) => void) {
  const subscription = Notifications.addNotificationResponseReceivedListener(handler);
  return () => subscription.remove();
}
