import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';

const MOCK_MESSAGES = [
  { id: 1, from: '301호', fromName: '정다은', text: '3층 복도 전등이 깜빡여요. 수리 부탁드립니다.', date: '03.09', read: false, replies: [] },
  { id: 2, from: '102호', fromName: '이서희', text: '관리비 계좌 확인 부탁드립니다.', date: '03.07', read: true, replies: [{ text: '국민 123-456-789012 입니다.', date: '03.07', from: '관리자' }] },
];

export default function VillaMessagesScreen() {
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const unreadCount = MOCK_MESSAGES.filter(m => !m.read).length;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {unreadCount > 0 && (
        <View style={s.unreadBanner}>
          <Text style={s.unreadText}>💬 읽지 않은 메시지 {unreadCount}건</Text>
        </View>
      )}

      {MOCK_MESSAGES.map(m => (
        <View key={m.id} style={[s.card, !m.read && { borderLeftWidth: 3, borderLeftColor: '#FF6434' }]}>
          {/* 헤더 */}
          <View style={s.msgHeader}>
            <View style={s.msgHeaderLeft}>
              <View style={[s.avatar, { backgroundColor: !m.read ? 'rgba(255,100,52,0.15)' : 'rgba(255,255,255,0.06)' }]}>
                <Text style={[s.avatarText, { color: !m.read ? '#FF6434' : '#8893A7' }]}>{m.from.replace('호', '')}</Text>
              </View>
              <View>
                <Text style={[s.msgFrom, { color: m.read ? '#8893A7' : '#fff' }]}>{m.from} {m.fromName}</Text>
                <Text style={s.msgDate}>{m.date}</Text>
              </View>
            </View>
            {!m.read && <View style={s.newBadge}><Text style={s.newBadgeText}>NEW</Text></View>}
          </View>

          {/* 본문 */}
          <View style={s.msgBody}>
            <Text style={s.msgText}>{m.text}</Text>
          </View>

          {/* 답글 */}
          {m.replies.map((r, i) => (
            <View key={i} style={s.replyBubble}>
              <Text style={s.replyMeta}>↩ {r.from} · {r.date}</Text>
              <Text style={s.replyText}>{r.text}</Text>
            </View>
          ))}

          {/* 답글 입력 */}
          <View style={s.replyInputRow}>
            <TextInput
              style={s.replyInput}
              placeholder="답글 입력"
              placeholderTextColor="#5A6A82"
              value={replyTexts[m.id] || ''}
              onChangeText={t => setReplyTexts(prev => ({ ...prev, [m.id]: t }))}
            />
            <TouchableOpacity style={s.replyBtn}>
              <Text style={s.replyBtnText}>답글</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {MOCK_MESSAGES.length === 0 && (
        <View style={s.empty}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>✉️</Text>
          <Text style={s.emptyText}>받은 메시지가 없습니다</Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1B33', padding: 20, paddingTop: 10 },
  unreadBanner: { backgroundColor: 'rgba(255,100,52,0.12)', borderRadius: 12, padding: 12, marginBottom: 14 },
  unreadText: { fontSize: 13, color: '#FF6434', fontWeight: '700' },
  card: { backgroundColor: '#182744', borderWidth: 1, borderColor: '#243555', borderRadius: 14, padding: 16, marginBottom: 10 },
  msgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  msgHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: '800' },
  msgFrom: { fontSize: 14, fontWeight: '700' },
  msgDate: { fontSize: 11, color: '#5A6A82', marginTop: 1 },
  newBadge: { backgroundColor: 'rgba(255,100,52,0.15)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  newBadgeText: { color: '#FF6434', fontSize: 11, fontWeight: '700' },
  msgBody: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, marginBottom: 8 },
  msgText: { fontSize: 14, color: '#E0E4EA', lineHeight: 22 },
  replyBubble: { backgroundColor: 'rgba(59,91,219,0.08)', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#3B5BDB', padding: 10, marginBottom: 8 },
  replyMeta: { fontSize: 11, color: '#3B5BDB', fontWeight: '700', marginBottom: 3 },
  replyText: { fontSize: 13, color: '#E0E4EA', lineHeight: 20 },
  replyInputRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  replyInput: { flex: 1, backgroundColor: '#1A2D4D', borderWidth: 1, borderColor: '#243555', borderRadius: 10, padding: 10, fontSize: 13, color: '#E0E4EA' },
  replyBtn: { backgroundColor: '#3B5BDB', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  replyBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#8893A7', fontSize: 14 },
});
