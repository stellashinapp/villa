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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveSignupData } from '@/lib/signup-store';
import NiceAuthModal, { type NiceAuthSuccess } from '@/components/NiceAuthModal';

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

export default function SignupStep1Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // __DEV__ 일 때만 더미 데이터로 자동 채움 (이메일/아이디는 timestamp 로 매번 새로 — 중복 방지)
  const devSuffix = String(Date.now()).slice(-6);
  const [name, setName] = useState(__DEV__ ? '김테스트' : '');
  const [phone, setPhone] = useState(__DEV__ ? '01012345678' : '');
  const [email, setEmail] = useState(__DEV__ ? `admin${devSuffix}@andnew.kr` : '');
  const [username, setUsername] = useState(__DEV__ ? `admin${devSuffix}` : '');
  const [password, setPassword] = useState(__DEV__ ? 'Villatolk1234!' : '');
  const [passwordConfirm, setPasswordConfirm] = useState(__DEV__ ? 'Villatolk1234!' : '');

  const [agreeAll, setAgreeAll] = useState(__DEV__);
  const [agreeTerms, setAgreeTerms] = useState(__DEV__);
  const [agreePrivacy, setAgreePrivacy] = useState(__DEV__);
  const [agreeMarketing, setAgreeMarketing] = useState(__DEV__);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // 본인인증 (NICE 체크플러스)
  const [phoneVerified, setPhoneVerified] = useState(__DEV__);
  const [niceModalVisible, setNiceModalVisible] = useState(false);

  const handlePassVerify = () => setNiceModalVisible(true);

  const handleNiceSuccess = (result: NiceAuthSuccess) => {
    setNiceModalVisible(false);
    const inputPhone = phone.replace(/\D/g, '');
    if (inputPhone && inputPhone !== result.phone) {
      Alert.alert(
        '전화번호 불일치',
        `입력한 번호(${phone})와 인증된 번호가 다릅니다.\n인증된 번호로 자동 변경할까요?`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '자동 변경',
            onPress: () => {
              setPhone(result.phone);
              if (!name.trim()) setName(result.name);
              setPhoneVerified(true);
            },
          },
        ],
      );
      return;
    }
    if (!name.trim()) setName(result.name);
    if (!phone.trim()) setPhone(result.phone);
    setPhoneVerified(true);
  };

  const handleNiceFail = (reason: string) => {
    setNiceModalVisible(false);
    Alert.alert('본인인증 실패', reason);
  };

  const handleDevBypassVerify = () => setPhoneVerified(true);

  const handleAgreeAll = () => {
    const next = !agreeAll;
    setAgreeAll(next);
    setAgreeTerms(next);
    setAgreePrivacy(next);
    setAgreeMarketing(next);
  };

  const handleIndividualAgree = (
    setter: (v: boolean) => void,
    current: boolean,
    others: boolean[]
  ) => {
    const next = !current;
    setter(next);
    const allChecked = others.every(Boolean) && next;
    setAgreeAll(allChecked);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!name.trim()) e.name = '이름을 입력해주세요';
    if (!phone.trim()) e.phone = '전화번호를 입력해주세요';
    else if (!/^01[0-9]{8,9}$/.test(phone.replace(/-/g, '')))
      e.phone = '올바른 전화번호를 입력해주세요';

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = '올바른 이메일 형식을 입력해주세요';

    if (!username.trim()) e.username = '아이디를 입력해주세요';
    else if (username.trim().length < 4)
      e.username = '아이디는 4자 이상이어야 합니다';

    if (!password) e.password = '비밀번호를 입력해주세요';
    else if (password.length < 6)
      e.password = '비밀번호는 6자 이상이어야 합니다';

    if (!passwordConfirm) e.passwordConfirm = '비밀번호 확인을 입력해주세요';
    else if (password !== passwordConfirm)
      e.passwordConfirm = '비밀번호가 일치하지 않습니다';

    if (!agreeTerms) e.terms = '서비스 이용약관에 동의해주세요';
    if (!agreePrivacy) e.privacy = '개인정보 수집·이용에 동의해주세요';

    setErrors(e);
    setTouched({
      name: true,
      phone: true,
      email: true,
      username: true,
      password: true,
      passwordConfirm: true,
    });
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (!phoneVerified) {
      Alert.alert('알림', '본인인증을 먼저 완료해주세요');
      return;
    }
    if (validate()) {
      await saveSignupData({
        name,
        phone,
        email: email || `${username}@villatolk.app`,
        password,
      });
      router.push('/(auth)/signup/step2-villa');
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (t: string) => void,
    field: string,
    options?: {
      placeholder?: string;
      keyboardType?: 'default' | 'phone-pad' | 'email-address';
      secureTextEntry?: boolean;
      optional?: boolean;
    }
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}
        {options?.optional && <Text style={styles.optionalTag}> (선택)</Text>}
      </Text>
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
        secureTextEntry={options?.secureTextEntry}
        autoCapitalize="none"
      />
      {touched[field] && errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  const renderCheckbox = (
    label: string,
    checked: boolean,
    onPress: () => void,
    isAll?: boolean,
    hasError?: boolean,
    viewLink?: string,
  ) => (
    <View style={[styles.checkRow, isAll && styles.checkRowAll]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View
          style={[
            styles.checkbox,
            checked && styles.checkboxChecked,
            hasError && styles.checkboxError,
          ]}
        >
          {checked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[styles.checkLabel, isAll && styles.checkLabelAll]}>
          {label}
        </Text>
      </TouchableOpacity>
      {viewLink && (
        <TouchableOpacity onPress={() => router.push(viewLink as never)}>
          <Text style={{ fontSize: 12, color: '#4263E8', textDecorationLine: 'underline' }}>보기</Text>
        </TouchableOpacity>
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
      >
        <ProgressBar step={1} />

        <Text style={styles.stepLabel}>STEP 1 / 3</Text>
        <Text style={styles.title}>관리자 계정 만들기</Text>
        <Text style={styles.subtitle}>
          빌라 건물주·관리 담당자 전용입니다
        </Text>

        <View style={styles.card}>
          {renderInput('이름', name, setName, 'name', {
            placeholder: '홍길동',
          })}
          {renderInput('전화번호', phone, setPhone, 'phone', {
            placeholder: '01012345678',
            keyboardType: 'phone-pad',
          })}
          {renderInput('이메일', email, setEmail, 'email', {
            placeholder: 'example@email.com',
            keyboardType: 'email-address',
            optional: true,
          })}
          {renderInput('아이디', username, setUsername, 'username', {
            placeholder: '4자 이상',
          })}
          {renderInput('비밀번호', password, setPassword, 'password', {
            placeholder: '6자 이상',
            secureTextEntry: true,
          })}
          {renderInput(
            '비밀번호 확인',
            passwordConfirm,
            setPasswordConfirm,
            'passwordConfirm',
            {
              placeholder: '비밀번호를 다시 입력',
              secureTextEntry: true,
            }
          )}
        </View>

        <View style={styles.termsCard}>
          {renderCheckbox('전체 동의', agreeAll, handleAgreeAll, true)}
          <View style={styles.termsDivider} />
          {renderCheckbox(
            '[필수] 서비스 이용약관',
            agreeTerms,
            () =>
              handleIndividualAgree(setAgreeTerms, agreeTerms, [
                agreePrivacy,
                agreeMarketing,
              ]),
            false,
            !!errors.terms,
            '/legal/terms'
          )}
          {renderCheckbox(
            '[필수] 개인정보 수집·이용',
            agreePrivacy,
            () =>
              handleIndividualAgree(setAgreePrivacy, agreePrivacy, [
                agreeTerms,
                agreeMarketing,
              ]),
            false,
            !!errors.privacy,
            '/legal/privacy'
          )}
          {renderCheckbox(
            '[선택] 마케팅 수신',
            agreeMarketing,
            () =>
              handleIndividualAgree(setAgreeMarketing, agreeMarketing, [
                agreeTerms,
                agreePrivacy,
              ])
          )}
          {(errors.terms || errors.privacy) && (
            <Text style={styles.errorText}>
              {errors.terms || errors.privacy}
            </Text>
          )}
        </View>

        {/* 본인인증 (PASS) */}
        <View style={styles.passCard}>
          <Text style={styles.label}>본인인증</Text>
          <TouchableOpacity
            style={[styles.passButton, phoneVerified && styles.passButtonDone]}
            onPress={handlePassVerify}
            disabled={phoneVerified}
            activeOpacity={0.8}
          >
            <Text style={[styles.passButtonText, phoneVerified && { color: C.success }]}>
              {phoneVerified ? '✓ 본인인증 완료' : '본인인증 (PASS)'}
            </Text>
          </TouchableOpacity>
          {__DEV__ && !phoneVerified && (
            <TouchableOpacity style={styles.devBypassBtn} onPress={handleDevBypassVerify} activeOpacity={0.7}>
              <Text style={styles.devBypassText}>(개발용) 테스트 인증 통과</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, !phoneVerified && { opacity: 0.5 }]}
          onPress={handleNext}
          disabled={!phoneVerified}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>
            {phoneVerified ? '다음' : '본인인증 후 진행 가능'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>← 로그인으로</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <NiceAuthModal
        visible={niceModalVisible}
        onSuccess={handleNiceSuccess}
        onCancel={() => setNiceModalVisible(false)}
        onFail={handleNiceFail}
      />
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
  optionalTag: {
    fontSize: 11,
    fontWeight: '400',
    color: C.sub,
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

  termsCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  termsDivider: {
    height: 1,
    backgroundColor: C.cardBorder,
    marginVertical: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  checkRowAll: {
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    backgroundColor: C.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  checkboxError: {
    borderColor: C.error,
  },
  checkmark: {
    color: C.white,
    fontSize: 13,
    fontWeight: '700',
  },
  checkLabel: {
    fontSize: 14,
    color: C.text,
  },
  checkLabelAll: {
    fontWeight: '700',
    fontSize: 15,
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

  linkButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    color: C.sub,
    fontSize: 14,
  },

  passCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 20,
    marginBottom: 16,
  },
  passButton: {
    backgroundColor: C.inputBg,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.inputBorder,
  },
  passButtonDone: {
    backgroundColor: '#E8F5E9',
    borderColor: C.success,
  },
  passButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  devBypassBtn: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  devBypassText: {
    fontSize: 12,
    color: C.sub,
    textDecorationLine: 'underline',
  },
});
