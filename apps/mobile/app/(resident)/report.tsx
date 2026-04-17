import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';

type Message = {
  id: string;
  from: 'resident' | 'admin';
  body: string;
  date: string;
};

type Thread = {
  id: string;
  messages: Message[];
};

const MOCK_THREADS: Thread[] = [
  {
    id: '1',
    messages: [
      {
        id: 'm1',
        from: 'resident',
        body: '3층 복도 전등이 깜빡거리고 있습니다. 확인 부탁드립니다.',
        date: '2026.04.15 14:30',
      },
      {
        id: 'm2',
        from: 'admin',
        body: '안녕하세요, 확인했습니다. 내일 오전 중 전기 기사님이 방문하여 교체 예정입니다. 감사합니다.',
        date: '2026.04.15 16:45',
      },
      {
        id: 'm3',
        from: 'resident',
        body: '감사합니다. 빠른 처리 감사드려요!',
        date: '2026.04.16 09:10',
      },
    ],
  },
  {
    id: '2',
    messages: [
      {
        id: 'm4',
        from: 'resident',
        body: '1층 현관 도어락이 가끔 인식이 안됩니다. 배터리 문제인 것 같은데 교체 가능할까요?',
        date: '2026.04.10 11:20',
      },
      {
        id: 'm5',
        from: 'admin',
        body: '배터리 교체 완료했습니다. 이상 있으시면 다시 연락 주세요.',
        date: '2026.04.11 10:00',
      },
    ],
  },
  {
    id: '3',
    messages: [
      {
        id: 'm6',
        from: 'resident',
        body: '주차장에 외부 차량이 무단주차를 자주 합니다. 단속 가능한지 문의드립니다.',
        date: '2026.04.05 18:00',
      },
    ],
  },
];

export default function ReportScreen() {
  const [message, setMessage] = useState('');

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>신고</Text>
      </View>

      {/* Report Card */}
      <View style={styles.reportCard}>
        <Text style={styles.reportLabel}>✉️ 관리자에게 신고/건의</Text>
        <TextInput
          style={styles.textArea}
          placeholder="신고 또는 건의 내용을 입력하세요"
          placeholderTextColor="#B8BBC2"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          value={message}
          onChangeText={setMessage}
        />
        <View style={styles.reportActions}>
          <TouchableOpacity style={styles.photoButton} activeOpacity={0.7}>
            <Text style={styles.photoButtonText}>📷 사진 첨부</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendButton} activeOpacity={0.8}>
            <Text style={styles.sendButtonText}>보내기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>대화 내역</Text>
        {MOCK_THREADS.map((thread) => (
          <View key={thread.id} style={styles.threadCard}>
            {thread.messages.map((msg, idx) => {
              const isAdmin = msg.from === 'admin';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    isAdmin ? styles.adminBubble : styles.residentBubble,
                    idx < thread.messages.length - 1 && { marginBottom: 8 },
                  ]}
                >
                  <View style={styles.messageHeader}>
                    <Text style={[styles.messageFrom, isAdmin ? styles.adminFrom : styles.residentFrom]}>
                      {isAdmin ? '관리자' : '나'}
                    </Text>
                    <Text style={styles.messageDate}>{msg.date}</Text>
                  </View>
                  <Text style={styles.messageBody}>{msg.body}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F8' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '900', color: '#181A20' },

  reportCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EAEBEF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  reportLabel: { fontSize: 15, fontWeight: '800', color: '#181A20', marginBottom: 12 },
  textArea: {
    backgroundColor: '#F3F4F8',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#181A20',
    minHeight: 100,
    marginBottom: 12,
  },
  reportActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  photoButton: {
    backgroundColor: '#F3F4F8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  photoButtonText: { fontSize: 13, fontWeight: '600', color: '#7C7F87' },
  sendButton: {
    backgroundColor: '#3B5BDB',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sendButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  section: { marginHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#181A20', marginBottom: 12 },

  threadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAEBEF',
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
  adminBubble: { backgroundColor: '#F3F4F8' },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageFrom: { fontSize: 12, fontWeight: '700' },
  residentFrom: { color: '#3B5BDB' },
  adminFrom: { color: '#1EB06A' },
  messageDate: { fontSize: 11, color: '#B8BBC2' },
  messageBody: { fontSize: 13, color: '#181A20', lineHeight: 19 },
});
