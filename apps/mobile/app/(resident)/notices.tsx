import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { store, subscribe } from '@/lib/store';

export default function NoticesScreen() {
  const [_, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const villa = store.villas.find(v => v.id === store.loggedVillaId);
  const resident = store.loggedResident;

  if (!villa || !resident) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>빌라 정보를 불러올 수 없습니다</Text>
        </View>
      </View>
    );
  }

  const notices = villa.notices;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>공지</Text>
        <Text style={styles.headerSub}>{villa.name}</Text>
      </View>

      {notices.length === 0 ? (
        <View style={styles.emptyNotice}>
          <Text style={styles.emptyNoticeTitle}>공지사항이 없습니다</Text>
          <Text style={styles.emptyNoticeSub}>새로운 공지가 등록되면 여기에 표시됩니다</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {notices.map(notice => (
            <View key={notice.id} style={styles.card}>
              <View style={styles.cardHeader}>
                {notice.isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
                <Text style={styles.cardDate}>{notice.date}</Text>
              </View>
              <Text style={styles.cardTitle}>{notice.title}</Text>
              <Text style={styles.cardBody}>{notice.body}</Text>
            </View>
          ))}
        </View>
      )}
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

  emptyNotice: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyNoticeTitle: { fontSize: 15, fontWeight: '700', color: '#1A1D26', marginBottom: 4 },
  emptyNoticeSub: { fontSize: 13, color: '#9CA3AF' },

  list: { paddingHorizontal: 16 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  newBadge: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  cardDate: { fontSize: 12, color: '#9CA3AF' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1A1D26', marginBottom: 8 },
  cardBody: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
});
