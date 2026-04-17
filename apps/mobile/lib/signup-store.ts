import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'signup_pending';

export interface SignupData {
  // Step 1
  name: string;
  phone: string;
  email: string;
  password: string;
  // Step 2
  villaName?: string;
  villaAddress?: string;
  totalUnits?: number;
  unitsPerFloor?: number;
  accountInfo?: string;
  // Step 3
  plan?: 'small' | 'popular' | 'large';
}

export async function saveSignupData(data: Partial<SignupData>) {
  const existing = await getSignupData();
  const merged = { ...existing, ...data };
  await AsyncStorage.setItem(KEY, JSON.stringify(merged));
  return merged;
}

export async function getSignupData(): Promise<SignupData | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearSignupData() {
  await AsyncStorage.removeItem(KEY);
}
