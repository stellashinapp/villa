import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';

const C = {
  bg: '#FFFFFF', inputBg: '#F0F2F6', inputBorder: '#E5E7EB',
  pri: '#4A6CF7', text: '#1A1D26', sub: '#6B7280', muted: '#9CA3AF',
};

export default function FindAccountScreen() {
  const [tab, setTab] = useState<'id' | 'pw'>('id');

  // 아이디 찾기
  const [findName, setFindName] = useState('');
  const [findPhone, setFindPhone] = useState('');

  // 비밀번호 찾기
  const [findId, setFindId] = useState('');
  const [findEmail, setFindEmail] = useState('');

  const [result, setResult] = useState('');

  function handleFindId() {
    if (!findName.trim() || !findPhone.trim()) {
      Alert.alert('알림', '이름과 전화번호를 입력하세요');
      return;
    }
    // TODO: Supabase에서 조회
    setResult('가입된 아이디: admin@villatolk.app');
  }

  function handleFindPw() {
    if (!findId.trim() || !findEmail.trim()) {
      Alert.alert('알림', '아이디와 이메일을 입력하세요');
      return;
    }
    // TODO: Supabase Auth 비밀번호 재설정 이메일 발송
    setResult('비밀번호 재설정 링크가 이메일로 발송되었습니다');
  }

  return (
    <View style={s.container}>
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <Text style={s.backText}>← 돌아가기</Text>
      </TouchableOpacity>

      <Text style={s.title}>계정 찾기</Text>
      <Text style={s.subtitle}>아이디 또는 비밀번호를 찾으세요</Text>

      {/* 탭 */}
      <View style={s.tabRow}>
        <TouchableOpacity
          style={[s.tab, tab === 'id' && s.tabActive]}
          onPress={() => { setTab('id'); setResult(''); }}
        >
          <Text style={[s.tabText, tab === 'id' && s.tabTextActive]}>아이디 찾기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'pw' && s.tabActive]}
          onPress={() => { setTab('pw'); setResult(''); }}
        >
          <Text style={[s.tabText, tab === 'pw' && s.tabTextActive]}>비밀번호 찾기</Text>
        </TouchableOpacity>
      </View>

      {/* 아이디 찾기 */}
      {tab === 'id' && (
        <View style={s.form}>
          <Text style={s.label}>이름</Text>
          <TextInput style={s.input} placeholder="가입 시 입력한 이름" placeholderTextColor={C.muted} value={findName} onChangeText={setFindName} />

          <Text style={s.label}>전화번호</Text>
          <TextInput style={s.input} placeholder="가입 시 입력한 전화번호" placeholderTextColor={C.muted} value={findPhone} onChangeText={setFindPhone} keyboardType="phone-pad" />

          <TouchableOpacity style={s.submitBtn} onPress={handleFindId}>
            <Text style={s.submitBtnText}>아이디 찾기</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 비밀번호 찾기 */}
      {tab === 'pw' && (
        <View style={s.form}>
          <Text style={s.label}>아이디 (이메일)</Text>
          <TextInput style={s.input} placeholder="가입한 이메일 주소" placeholderTextColor={C.muted} value={findId} onChangeText={setFindId} autoCapitalize="none" keyboardType="email-address" />

          <Text style={s.label}>이메일</Text>
          <TextInput style={s.input} placeholder="비밀번호 재설정 링크를 받을 이메일" placeholderTextColor={C.muted} value={findEmail} onChangeText={setFindEmail} autoCapitalize="none" keyboardType="email-address" />

          <TouchableOpacity style={s.submitBtn} onPress={handleFindPw}>
            <Text style={s.submitBtnText}>비밀번호 재설정 메일 발송</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 결과 */}
      {result !== '' && (
        <View style={s.resultCard}>
          <Text style={s.resultText}>{result}</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={s.resultLink}>로그인으로 이동 →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24 },
  backBtn: { paddingTop: 56, paddingBottom: 8 },
  backText: { fontSize: 14, color: C.sub, fontWeight: '500' },
  title: { fontSize: 22, fontWeight: '900', color: C.text, marginTop: 12 },
  subtitle: { fontSize: 14, color: C.sub, marginTop: 4, marginBottom: 24 },

  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  tab: {
    flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
    backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder,
  },
  tabActive: { backgroundColor: C.pri, borderColor: C.pri },
  tabText: { fontSize: 14, fontWeight: '700', color: C.sub },
  tabTextActive: { color: '#FFFFFF' },

  form: { gap: 4 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder,
    borderRadius: 12, padding: 14, fontSize: 15, color: C.text,
  },
  submitBtn: { backgroundColor: C.pri, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  resultCard: {
    marginTop: 20, padding: 20, backgroundColor: '#E8EEFB',
    borderRadius: 14, alignItems: 'center',
  },
  resultText: { fontSize: 14, fontWeight: '600', color: C.text, textAlign: 'center', lineHeight: 22 },
  resultLink: { fontSize: 14, fontWeight: '700', color: C.pri, marginTop: 12 },
});
