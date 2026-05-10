import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'signup_pending';

export interface SignupFloorData {
  label: string; // '1', '2', 'B1' 등 — 호수 prefix 로 사용
  displayLabel: string; // '1층', '지하1층' 등 — 표시용
  units: Array<{ name: string }>; // 각 호실 이름 (사용자가 수정 가능)
}

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
  /** step2 에서 사용자가 구성한 층/호수 목록. 있으면 createVilla 가 이걸 사용. */
  floorPlan?: SignupFloorData[];
  accountBank?: string;
  accountNumber?: string;
  accountHolder?: string;
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
