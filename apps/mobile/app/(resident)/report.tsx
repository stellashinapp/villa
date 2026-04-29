import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { store, subscribe, sendMessage, addResidentReply } from '@/lib/store';

export default function ReportScreen() {
  const [_, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const villa = store.villas.find(v => v.id === store.loggedVillaId);
  const resident = store.loggedResident;

  const [message, setMessage] = useState('');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  if (!villa || !resident) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>빌라 정보를 불러올 수 없습니다</Text>
        </View>
      </View>
    );
  }

  const myMessages = villa.messages.filter(m => m.from === resident.ho);

  function handleSend() {
    if (!message.trim()) {
      Alert.alert('알림', '메시지를 입력하세요');
      return;
    }
    sendMessage(villa!.id, resident!.ho, resident!.name, message.trim());
    setMessage('');
    Alert.alert('전송 완료', '관리자에게 메시지가 전달되었습니다.');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>신고/건의</Text>
        <Text style={styles.headerSub}>{villa.name} {resident.ho}</Text>
      </View>

      {/* Report Card */}
      <View style={styles.reportCard}>
        <Text style={styles.reportLabel}>관리자에게 신고/건의</Text>
        <TextInput
          style={styles.textArea}
          placeholder="신고 또는 건의 내용을 입력하세요"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          value={message}
          onChangeText={setMessage}
        />
        <View style={styles.reportActions}>
          <View />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} activeOpacity={0.8}>
            <Text style={styles.sendButtonText}>보내기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Message History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>대화 내역</Text>
        {myMessages.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardTitle}>보낸 메시지가 없습니다</Text>
            <Text style={styles.emptyCardSub}>관리자에게 건의사항을 보내보세요</Text>
          </View>
        ) : (
          myMessages.map(msg => {
            const myName = resident!.name;
            const replyText = replyTexts[msg.id] ?? '';
            return (
              <View key={msg.id} style={styles.threadCard}>
                {/* My original message */}
                <View style={[styles.messageBubble, styles.residentBubble]}>
                  <View style={styles.messageHeader}>
                    <Text style={[styles.messageFrom, styles.residentFrom]}>나</Text>
                    <Text style={styles.messageDate}>{msg.date}</Text>
                  </View>
                  <Text style={styles.messageBody}>{msg.text}</Text>
                </View>

                {/* Replies (admin/resident mixed) */}
                {msg.replies.map((reply, idx) => {
                  const isMine = reply.from === myName;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.messageBubble,
                        isMine ? styles.residentBubble : styles.adminBubble,
                        { marginTop: 8 },
                      ]}
                    >
                      <View style={styles.messageHeader}>
                        <Text style={[styles.messageFrom, isMine ? styles.residentFrom : styles.adminFrom]}>
                          {isMine ? '나' : reply.from}
                        </Text>
                        <Text style={styles.messageDate}>{reply.date}</Text>
                      </View>
                      <Text style={styles.messageBody}>{reply.text}</Text>
                    </View>
                  );
                })}

                {msg.replies.length === 0 && (
                  <View style={styles.pendingRow}>
                    <Text style={styles.pendingText}>답변 대기 중</Text>
                  </View>
                )}

                {/* 추가 답글 입력 (관리자가 한 번이라도 답하면 활성화) */}
                {msg.replies.length > 0 && (
                  <View style={styles.replyInputRow}>
                    <TextInput
                      style={styles.replyInput}
                      placeholder="추가 답글 입력..."
                      placeholderTextColor="#9CA3AF"
                      value={replyText}
                      onChangeText={(t) => setReplyTexts(prev => ({ ...prev, [msg.id]: t }))}
                    />
                    <TouchableOpacity
                      style={styles.replySendBtn}
                      onPress={() => {
                        const t = replyText.trim();
                        if (!t) { Alert.alert('알림', '답글 내용을 입력하세요'); return; }
                        addResidentReply(villa!.id, msg.id, t, myName);
                        setReplyTexts(prev => ({ ...prev, [msg.id]: '' }));
                      }}
                    >
                      <Text style={styles.replySendText}>전송</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '900', color: '#1A1D26' },
  headerSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#6B7280', fontWeight: '600' },

  reportCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  reportLabel: { fontSize: 15, fontWeight: '800', color: '#1A1D26', marginBottom: 12 },
  textArea: {
    backgroundColor: '#F5F6FA',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1A1D26',
    minHeight: 100,
    marginBottom: 12,
  },
  reportActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sendButton: {
    backgroundColor: '#3454D1',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sendButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  section: { marginHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1D26', marginBottom: 12 },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EBF0',
  },
  emptyCardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1D26', marginBottom: 4 },
  emptyCardSub: { fontSize: 13, color: '#9CA3AF' },

  threadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  messageBubble: {
    borderRadius: 10,
    padding: 12,
  },
  residentBubble: { backgroundColor: '#E8EEFB' },
  adminBubble: { backgroundColor: '#F5F6FA' },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageFrom: { fontSize: 12, fontWeight: '700' },
  residentFrom: { color: '#3454D1' },
  adminFrom: { color: '#2ECC71' },
  messageDate: { fontSize: 11, color: '#9CA3AF' },
  messageBody: { fontSize: 13, color: '#1A1D26', lineHeight: 19 },

  pendingRow: {
    marginTop: 8,
    alignItems: 'center',
  },
  pendingText: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },

  replyInputRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8EBF0',
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1A1D26',
  },
  replySendBtn: {
    backgroundColor: '#3454D1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replySendText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
