import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';

const MOCK_NOTICES = [
  { id: 1, title: '3월 관리비 정산 안내', body: '3월 관리비가 정산되었습니다. 세대별 109,625원이며, 25일까지 납부 부탁드립니다.\n\n납부계좌: 국민 123-456-789012\n※ 미납 시 연체료가 부과될 수 있습니다.', date: '2026.03.08', isNew: true },
  { id: 2, title: '외벽 도색 공사 안내', body: '3/15~3/20 외벽 도색 공사가 진행됩니다.\n\n- 공사 시간: 오전 9시 ~ 오후 6시\n- 창문 개방 자제\n- 양해 부탁드립니다', date: '2026.03.05', isNew: false },
  { id: 3, title: '분리수거 요일 변경', body: '3월부터 분리수거일이 월·수·금요일로 변경됩니다.', date: '2026.03.01', isNew: false },
];

export default function VillaNoticesScreen() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 새 공지 작성 */}
      <View style={[s.card, { borderWidth: 2, borderStyle: 'dashed' }]}>
        <Text style={s.formTitle}>✏️ 새 공지 작성</Text>
        <TextInput style={s.input} placeholder="공지 제목" placeholderTextColor="#5A6A82" value={title} onChangeText={setTitle} />
        <TextInput style={[s.input, { height: 100, textAlignVertical: 'top', marginTop: 8 }]} placeholder="공지 내용을 입력하세요" placeholderTextColor="#5A6A82" multiline value={body} onChangeText={setBody} />
        <TouchableOpacity style={s.submitBtn}>
          <Text style={s.submitBtnText}>공지 등록</Text>
        </TouchableOpacity>
      </View>

      {/* 공지 목록 */}
      <View style={{ marginTop: 16 }}>
        {MOCK_NOTICES.map(n => (
          <View key={n.id} style={s.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              {n.isNew && <View style={s.newBadge}><Text style={s.newBadgeText}>NEW</Text></View>}
              <Text style={s.noticeDate}>{n.date}</Text>
            </View>
            <Text style={s.noticeTitle}>{n.title}</Text>
            <Text style={s.noticeBody}>{n.body}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1B33', padding: 20, paddingTop: 10 },
  card: { backgroundColor: '#182744', borderWidth: 1, borderColor: '#243555', borderRadius: 14, padding: 16, marginBottom: 8 },
  formTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 10 },
  input: { backgroundColor: '#1A2D4D', borderWidth: 1, borderColor: '#243555', borderRadius: 12, padding: 13, fontSize: 14, color: '#E0E4EA' },
  submitBtn: { backgroundColor: '#3B5BDB', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  newBadge: { backgroundColor: 'rgba(255,100,52,0.15)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  newBadgeText: { color: '#FF6434', fontSize: 11, fontWeight: '700' },
  noticeDate: { fontSize: 11, color: '#5A6A82' },
  noticeTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 10 },
  noticeBody: { fontSize: 13, color: '#8893A7', lineHeight: 20 },
});
