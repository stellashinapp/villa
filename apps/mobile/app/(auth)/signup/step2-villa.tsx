import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveSignupData } from '@/lib/signup-store';
import { completeSignup } from '@/lib/signup-complete';
import { BANK_NAMES } from '@villatolk/shared';

const C = {
  bg: '#F5F6FA',
  card: '#FFFFFF',
  cardBorder: '#E8EBF0',
  inputBg: '#F0F2F6',
  inputBorder: '#E5E7EB',
  primary: '#4263E8',
  success: '#4CAF50',
  text: '#1A1D26',
  sub: '#6B7280',
  error: '#E74C3C',
  white: '#FFFFFF',
};

function ProgressBar({ step }: { step: number }) {
  return (
    <View style={styles.progressRow}>
      {[1, 2, 3].map((s) => (
        <View
          key={s}
          style={[
            styles.progressDot,
            s <= step ? styles.progressDotActive : styles.progressDotInactive,
          ]}
        />
      ))}
    </View>
  );
}

export default function SignupStep2Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [skipping, setSkipping] = useState(false);

  // __DEV__ 일 때만 더미 데이터로 자동 채움
  const [villaName, setVillaName] = useState(__DEV__ ? '테스트빌라' : '');
  const [address, setAddress] = useState(__DEV__ ? '서울특별시 강남구 역삼동 123-4' : '');
  const [totalUnits, setTotalUnits] = useState(__DEV__ ? '8' : '');
  const [unitsPerFloor, setUnitsPerFloor] = useState(__DEV__ ? '2' : '2');
  const [accountBank, setAccountBank] = useState(__DEV__ ? '국민은행' : '');
  const [accountNumber, setAccountNumber] = useState(__DEV__ ? '123-456-789012' : '');
  const [accountHolder, setAccountHolder] = useState(__DEV__ ? '김테스트' : '');
  const [bankPickerOpen, setBankPickerOpen] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!villaName.trim()) e.villaName = '빌라 이름을 입력해주세요';
    if (!address.trim()) e.address = '주소를 입력해주세요';

    if (!totalUnits.trim()) e.totalUnits = '총 세대수를 입력해주세요';
    else if (isNaN(Number(totalUnits)) || Number(totalUnits) < 1)
      e.totalUnits = '유효한 세대수를 입력해주세요';

    if (!accountBank.trim()) e.accountBank = '은행을 선택해주세요';
    if (!accountNumber.trim()) e.accountNumber = '계좌번호를 입력해주세요';
    if (!accountHolder.trim()) e.accountHolder = '예금주를 입력해주세요';

    setErrors(e);
    setTouched({
      villaName: true,
      address: true,
      totalUnits: true,
      accountBank: true,
      accountNumber: true,
      accountHolder: true,
    });
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (validate()) {
      await saveSignupData({
        villaName: villaName,
        villaAddress: address,
        totalUnits: Number(totalUnits),
        unitsPerFloor: Number(unitsPerFloor),
        accountBank,
        accountNumber,
        accountHolder,
      });
      router.push({
        pathname: '/(auth)/signup/step3-plan',
        params: { totalUnits },
      });
    }
  };

  const handleSkip = async () => {
    if (skipping) return;
    setSkipping(true);
    try {
      // 빌라 미등록으로 가입 완료 → 바로 카드 등록 화면으로.
      // 어떤 단계에서 실패해도 사용자는 무조건 다음으로 진행하도록 강제.
      const result = await completeSignup({ createVillaIfPresent: false });
      if (result.adminId) {
        router.replace({
          pathname: '/payment/billing',
          params: {
            adminId: result.adminId,
            customerName: result.customerName,
            fromSignup: '1',
          },
        });
      } else if (result.ok) {
        // ok 인데 adminId 가 없는 희귀 케이스 → 홈
        router.replace('/(admin)/home');
      } else {
        // 가입 자체가 실패 (이메일 중복 + 비번 불일치 등) → 로그인 화면으로 보내 갇히지 않게
        router.replace('/(auth)/login');
      }
    } finally {
      setSkipping(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (t: string) => void,
    field: string,
    options?: {
      placeholder?: string;
      keyboardType?: 'default' | 'number-pad' | 'numeric';
      hint?: string;
    }
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          touched[field] && errors[field] ? styles.inputError : null,
        ]}
        value={value}
        onChangeText={(t) => {
          onChangeText(t);
          if (errors[field]) {
            setErrors((prev) => {
              const next = { ...prev };
              delete next[field];
              return next;
            });
          }
        }}
        onBlur={() => setTouched((prev) => ({ ...prev, [field]: true }))}
        placeholder={options?.placeholder || ''}
        placeholderTextColor="#9CA3AF"
        keyboardType={options?.keyboardType || 'default'}
        autoCapitalize="none"
      />
      {options?.hint && !errors[field] && (
        <Text style={styles.hintText}>{options.hint}</Text>
      )}
      {touched[field] && errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ProgressBar step={2} />

        <Text style={styles.stepLabel}>STEP 2 / 3</Text>
        <Text style={styles.title}>첫 번째 빌라 등록</Text>
        <Text style={styles.subtitle}>
          {'관리할 빌라 정보를 입력해주세요\n나중에 더 추가할 수 있어요'}
        </Text>

        <View style={styles.card}>
          {renderInput('빌라 이름', villaName, setVillaName, 'villaName', {
            placeholder: '예: 행복빌라, 그린파크 201동',
          })}
          {renderInput('주소', address, setAddress, 'address', {
            placeholder: '서울시 강남구 역삼동 123-45',
          })}

          {renderInput(
            '총 세대수',
            totalUnits,
            setTotalUnits,
            'totalUnits',
            {
              placeholder: '예: 12',
              keyboardType: 'number-pad',
            }
          )}

          {/* 은행 (드롭다운) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>입금 은행</Text>
            <TouchableOpacity
              style={[
                styles.input,
                { justifyContent: 'center' },
                touched.accountBank && errors.accountBank ? styles.inputError : null,
              ]}
              onPress={() => setBankPickerOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 15, color: accountBank ? C.text : '#9CA3AF' }}>
                {accountBank || '은행 선택'}
              </Text>
            </TouchableOpacity>
            {touched.accountBank && errors.accountBank && (
              <Text style={styles.errorText}>{errors.accountBank}</Text>
            )}
          </View>

          {renderInput(
            '계좌번호',
            accountNumber,
            setAccountNumber,
            'accountNumber',
            {
              placeholder: '예: 123-456-789012',
              keyboardType: 'numeric',
            }
          )}

          {renderInput(
            '예금주',
            accountHolder,
            setAccountHolder,
            'accountHolder',
            {
              placeholder: '예금주 이름',
              hint: '입주민이 관리비를 입금할 계좌의 예금주입니다',
            }
          )}
        </View>

        {/* 은행 선택 모달 */}
        <Modal
          visible={bankPickerOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setBankPickerOpen(false)}
        >
          <TouchableOpacity
            style={styles.bankModalBg}
            activeOpacity={1}
            onPress={() => setBankPickerOpen(false)}
          >
            <View style={styles.bankModalCard}>
              <Text style={styles.bankModalTitle}>은행 선택</Text>
              <ScrollView style={{ maxHeight: 380 }}>
                {BANK_NAMES.map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[
                      styles.bankItem,
                      accountBank === b && { backgroundColor: '#F1F6FF' },
                    ]}
                    onPress={() => {
                      setAccountBank(b);
                      setBankPickerOpen(false);
                      if (errors.accountBank) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.accountBank;
                          return next;
                        });
                      }
                    }}
                  >
                    <Text style={[
                      styles.bankItemText,
                      accountBank === b && { color: C.primary, fontWeight: '700' },
                    ]}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>다음</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.skipButton, skipping && { opacity: 0.5 }]}
          onPress={handleSkip}
          disabled={skipping}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>{skipping ? '계정 생성 중...' : '나중에 할게요'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },
  contentContainer: { padding: 24 },

  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressDotActive: { backgroundColor: C.primary },
  progressDotInactive: { backgroundColor: '#E5E7EB' },

  stepLabel: {
    fontSize: 11,
    color: C.primary,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: C.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: C.sub,
    lineHeight: 20,
    marginBottom: 24,
  },

  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.text,
  },
  inputError: {
    borderColor: C.error,
  },
  errorText: {
    fontSize: 12,
    color: C.error,
    marginTop: 6,
  },
  hintText: {
    fontSize: 12,
    color: C.sub,
    marginTop: 6,
  },

  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },

  previewCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.primary,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  previewLabel: {
    fontSize: 14,
    color: C.sub,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  planAutoCard: {
    backgroundColor: 'rgba(52,84,209,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(52,84,209,0.15)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  planAutoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  planAutoName: {
    fontSize: 18,
    fontWeight: '900',
    color: C.text,
  },
  planAutoRange: {
    fontSize: 12,
    color: C.sub,
  },
  planAutoPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: C.primary,
    marginBottom: 12,
  },
  planAutoDivider: {
    height: 1,
    backgroundColor: C.cardBorder,
    marginBottom: 8,
  },
  trialBanner: {
    backgroundColor: '#F1F6FF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  trialText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4263E8',
  },
  trialSub: {
    fontSize: 12,
    color: '#5B6D8F',
    marginTop: 4,
  },

  primaryButton: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },

  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    color: C.sub,
    fontSize: 14,
  },
  bankModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  bankModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  bankModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  bankItem: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  bankItemText: {
    fontSize: 15,
    color: C.text,
  },
});
