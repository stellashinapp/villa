import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import { store, subscribe, addNotice, updateNotice, removeNotice, togglePinNotice } from '@/lib/store';

const C = {
  bg: '#F5F6FA',
  card: '#FFFFFF',
  border: '#E8EBF0',
  inputBg: '#F0F2F6',
  inputBorder: '#E5E7EB',
  pri: '#4263E8',
  text: '#1A1D26',
  sub: '#6B7280',
  muted: '#9CA3AF',
  accent: '#FF6B35',
};

export default function VillaNoticesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [_, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  const insets = useSafeAreaInsets();

  const villa = store.villas.find(v => v.id === id);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  if (!villa) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: C.sub, fontSize: 16 }}>빌라를 찾을 수 없습니다</Text>
      </View>
    );
  }

  const handleSubmit = () => {
    const trimTitle = title.trim();
    const trimBody = body.trim();
    if (!trimTitle) { Alert.alert('오류', '공지 제목을 입력하세요'); return; }
    if (!trimBody) { Alert.alert('오류', '공지 내용을 입력하세요'); return; }
    Alert.alert('공지 등록', `"${trimTitle}" 공지를 등록하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '등록',
        onPress: () => {
          addNotice(id!, trimTitle, trimBody);
          setTitle('');
          setBody('');
          const unitCount = villa!.units.filter(u => u.name).length;
          Alert.alert('공지 등록 완료', `"${trimTitle}" 공지가 전체 입주민(${unitCount}세대)에게 발송되었습니다`);
        },
      },
    ]);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 40 }}>
      {/* 새 공지 작성 */}
      <View style={[s.card, { borderWidth: 2, borderStyle: 'dashed' }]}>
        <Text style={s.formTitle}>새 공지 작성</Text>
        <TextInput
          style={s.input}
          placeholder="공지 제목"
          placeholderTextColor={C.muted}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[s.input, { height: 100, textAlignVertical: 'top', marginTop: 8 }]}
          placeholder="공지 내용을 입력하세요"
          placeholderTextColor={C.muted}
          multiline
          value={body}
          onChangeText={setBody}
        />
        <TouchableOpacity style={s.submitBtn} onPress={handleSubmit}>
          <Text style={s.submitBtnText}>공지 등록</Text>
        </TouchableOpacity>
      </View>

      {/* 공지 목록 */}
      <View style={{ marginTop: 16 }}>
        {villa.notices.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyText}>등록된 공지가 없습니다</Text>
          </View>
        )}
        {villa.notices.map(n => {
          const isEditing = editingId === n.id;
          return (
            <View key={n.id} style={[s.card, n.isPinned && { borderColor: C.accent, borderWidth: 1.5 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                {n.isPinned && (
                  <View style={[s.newBadge, { backgroundColor: 'rgba(255,107,53,0.12)' }]}>
                    <Text style={s.newBadgeText}>📌 고정</Text>
                  </View>
                )}
                {n.isNew && !n.isPinned && <View style={s.newBadge}><Text style={s.newBadgeText}>NEW</Text></View>}
                <Text style={s.noticeDate}>{n.date}</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => togglePinNotice(id!, n.id)}>
                  <Text style={s.actionText}>{n.isPinned ? '고정해제' : '고정'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  if (isEditing) {
                    setEditingId(null);
                  } else {
                    setEditingId(n.id);
                    setEditTitle(n.title);
                    setEditBody(n.body);
                  }
                }}>
                  <Text style={s.actionText}>{isEditing ? '취소' : '수정'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  Alert.alert('공지 삭제', `"${n.title}" 공지를 삭제하시겠습니까?`, [
                    { text: '취소', style: 'cancel' },
                    { text: '삭제', style: 'destructive', onPress: () => removeNotice(id!, n.id) },
                  ]);
                }}>
                  <Text style={[s.actionText, { color: '#E74C3C' }]}>삭제</Text>
                </TouchableOpacity>
              </View>

              {isEditing ? (
                <>
                  <TextInput style={s.input} value={editTitle} onChangeText={setEditTitle} placeholder="제목" placeholderTextColor={C.muted} />
                  <TextInput
                    style={[s.input, { height: 100, textAlignVertical: 'top', marginTop: 8 }]}
                    multiline value={editBody} onChangeText={setEditBody}
                    placeholder="내용" placeholderTextColor={C.muted}
                  />
                  <TouchableOpacity
                    style={s.submitBtn}
                    onPress={() => {
                      const t = editTitle.trim();
                      const b = editBody.trim();
                      if (!t || !b) { Alert.alert('오류', '제목과 내용을 입력하세요'); return; }
                      updateNotice(id!, n.id, t, b);
                      setEditingId(null);
                      Alert.alert('수정 완료', '공지가 수정되었습니다');
                    }}
                  >
                    <Text style={s.submitBtnText}>저장</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={s.noticeTitle}>{n.title}</Text>
                  <Text style={s.noticeBody}>{n.body}</Text>
                </>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 20 },
  card: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  formTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 10 },
  input: { backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 12, padding: 13, fontSize: 14, color: C.text },
  submitBtn: { backgroundColor: C.pri, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  newBadge: { backgroundColor: 'rgba(255,107,53,0.08)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  newBadgeText: { color: C.accent, fontSize: 11, fontWeight: '700' },
  noticeDate: { fontSize: 11, color: C.muted },
  noticeTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 10 },
  noticeBody: { fontSize: 13, color: C.sub, lineHeight: 20 },
  empty: { alignItems: 'center', padding: 30 },
  emptyText: { color: C.muted, fontSize: 14 },
  actionText: { fontSize: 12, color: C.pri, fontWeight: '600' },
});
