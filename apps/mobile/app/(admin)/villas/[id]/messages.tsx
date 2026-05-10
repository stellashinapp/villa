import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import { store, subscribe, replyMessage } from '@/lib/store';
import VillaSectionHeader from '@/components/VillaSectionHeader';

const C = {
  bg: '#F5F6FA',
  card: '#FFFFFF',
  border: '#E8EBF0',
  inputBg: '#F0F2F6',
  inputBorder: '#E5E7EB',
  pri: '#4263E8',
  priL: '#E8EEFB',
  text: '#1A1D26',
  sub: '#6B7280',
  muted: '#9CA3AF',
  accent: '#FF6B35',
};

export default function VillaMessagesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [_, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const villa = store.villas.find(v => v.id === id);

  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  if (!villa) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: C.sub, fontSize: 16 }}>빌라를 찾을 수 없습니다</Text>
      </View>
    );
  }

  const unreadCount = villa.messages.filter(m => !m.read).length;

  // Mark messages as read when viewing
  useEffect(() => {
    villa.messages.forEach(m => {
      if (!m.read) {
        m.read = true;
      }
    });
  }, [villa.messages.length]);

  const handleReply = (msgId: string) => {
    const text = (replyTexts[msgId] || '').trim();
    if (!text) {
      Alert.alert('오류', '답글 내용을 입력하세요');
      return;
    }
    const msg = villa!.messages.find(m => m.id === msgId);
    replyMessage(id!, msgId, text);
    setReplyTexts(prev => ({ ...prev, [msgId]: '' }));
    Alert.alert('답글 전송', `${msg?.from || ''} ${msg?.fromName || ''}님에게 답글이 전송되었습니다`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <VillaSectionHeader villaName={villa.name} section="메시지" />
      <ScrollView style={s.container} contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}>
      {unreadCount > 0 && (
        <View style={s.unreadBanner}>
          <Text style={s.unreadText}>읽지 않은 메시지 {unreadCount}건</Text>
        </View>
      )}

      {villa.messages.map(m => (
        <View key={m.id} style={[s.card, !m.read && { borderLeftWidth: 3, borderLeftColor: C.accent }]}>
          {/* 헤더 */}
          <View style={s.msgHeader}>
            <View style={s.msgHeaderLeft}>
              <View style={[s.avatar, { backgroundColor: !m.read ? 'rgba(255,107,53,0.08)' : '#F0F2F6' }]}>
                <Text style={[s.avatarText, { color: !m.read ? C.accent : C.muted }]}>{m.from.replace('호', '')}</Text>
              </View>
              <View>
                <Text style={[s.msgFrom, { color: m.read ? C.sub : C.text }]}>{m.from} {m.fromName}</Text>
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
              <Text style={s.replyMeta}>{r.from} · {r.date}</Text>
              <Text style={s.replyText}>{r.text}</Text>
            </View>
          ))}

          {/* 답글 입력 */}
          <View style={s.replyInputRow}>
            <TextInput
              style={s.replyInput}
              placeholder="답글 입력"
              placeholderTextColor={C.muted}
              value={replyTexts[m.id] || ''}
              onChangeText={t => setReplyTexts(prev => ({ ...prev, [m.id]: t }))}
            />
            <TouchableOpacity style={s.replyBtn} onPress={() => handleReply(m.id)}>
              <Text style={s.replyBtnText}>답글</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {villa.messages.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyText}>받은 메시지가 없습니다</Text>
        </View>
      )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 20 },
  unreadBanner: { backgroundColor: 'rgba(255,107,53,0.08)', borderRadius: 12, padding: 12, marginBottom: 14 },
  unreadText: { fontSize: 13, color: C.accent, fontWeight: '700' },
  card: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  msgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  msgHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: '800' },
  msgFrom: { fontSize: 14, fontWeight: '700' },
  msgDate: { fontSize: 11, color: C.muted, marginTop: 1 },
  newBadge: { backgroundColor: 'rgba(255,107,53,0.08)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  newBadgeText: { color: C.accent, fontSize: 11, fontWeight: '700' },
  msgBody: { backgroundColor: '#F8F9FC', borderRadius: 10, padding: 12, marginBottom: 8 },
  msgText: { fontSize: 14, color: C.text, lineHeight: 22 },
  replyBubble: { backgroundColor: C.priL, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: C.pri, padding: 10, marginBottom: 8 },
  replyMeta: { fontSize: 11, color: C.pri, fontWeight: '700', marginBottom: 3 },
  replyText: { fontSize: 13, color: C.text, lineHeight: 20 },
  replyInputRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  replyInput: { flex: 1, backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10, padding: 10, fontSize: 13, color: C.text },
  replyBtn: { backgroundColor: C.pri, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  replyBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { color: C.sub, fontSize: 14 },
});
