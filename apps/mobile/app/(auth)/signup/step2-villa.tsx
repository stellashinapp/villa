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
} from 'react-native';
import { useRouter } from 'expo-router';
import { saveSignupData } from '@/lib/signup-store';

const C = {
  bg: '#0F1B33',
  card: '#182744',
  cardBorder: '#243555',
  inputBg: '#1A2D4D',
  inputBorder: '#243555',
  primary: '#3B5BDB',
  success: '#1EB06A',
  text: '#E0E4EA',
  sub: '#8893A7',
  error: '#E5423A',
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

  const [villaName, setVillaName] = useState('');
  const [address, setAddress] = useState('');
  const [totalUnits, setTotalUnits] = useState('');
  const [unitsPerFloor, setUnitsPerFloor] = useState('2');
  const [bankAccount, setBankAccount] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!villaName.trim()) e.villaName = '빌라 이름을 입력해주세요';
    if (!address.trim()) e.address = '주소를 입력해주세요';

    if (!totalUnits.trim()) e.totalUnits = '총 세대수를 입력해주세요';
    else if (isNaN(Number(totalUnits)) || Number(totalUnits) < 1)
      e.totalUnits = '유효한 세대수를 입력해주세요';

    if (!unitsPerFloor.trim())
      e.unitsPerFloor = '층당 세대수를 입력해주세요';
    else if (isNaN(Number(unitsPerFloor)) || Number(unitsPerFloor) < 1)
      e.unitsPerFloor = '유효한 세대수를 입력해주세요';

    setErrors(e);
    setTouched({
      villaName: true,
      address: true,
      totalUnits: true,
      unitsPerFloor: true,
      bankAccount: true,
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
        accountInfo: bankAccount,
      });
      router.push({
        pathname: '/(auth)/signup/step3-plan',
        params: { totalUnits },
      });
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/signup/step3-plan');
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
        placeholderTextColor={C.sub}
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
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
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

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
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
            </View>
            <View style={styles.halfInput}>
              {renderInput(
                '층당 세대수',
                unitsPerFloor,
                setUnitsPerFloor,
                'unitsPerFloor',
                {
                  placeholder: '2',
                  keyboardType: 'number-pad',
                }
              )}
            </View>
          </View>

          {renderInput(
            '관리비 입금 계좌',
            bankAccount,
            setBankAccount,
            'bankAccount',
            {
              placeholder: '은행명 계좌번호 (예: 국민 123-456-789)',
              hint: '입주민이 관리비를 입금할 계좌입니다',
            }
          )}
        </View>

        {totalUnits && Number(totalUnits) > 0 && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>빌라 요약</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>총 세대수</Text>
              <Text style={styles.previewValue}>{totalUnits}세대</Text>
            </View>
            {Number(unitsPerFloor) > 0 && (
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>예상 층수</Text>
                <Text style={styles.previewValue}>
                  {Math.ceil(Number(totalUnits) / Number(unitsPerFloor))}층
                </Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>다음 → 플랜 선택</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>나중에 할게요</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg },
  contentContainer: { padding: 24, paddingTop: 56 },

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
  progressDotInactive: { backgroundColor: C.cardBorder },

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
    color: C.white,
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
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.sub,
    marginBottom: 10,
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
});
