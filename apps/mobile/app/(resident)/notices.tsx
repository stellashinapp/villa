import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { store, subscribe } from '@/lib/store';

export default function NoticesScreen() {
  const [_, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  const insets = useSafeAreaInsets();

  const villa = store.villas.find(v => v.id === store.loggedVillaId);
  const resident = store.loggedResident;

  const [query, setQuery] = useState('');

  if (!villa || !resident) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>빌라 정보를 불러올 수 없습니다</Text>
        </View>
      </View>
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? villa.notices.filter(n =>
        n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q),
      )
    : villa.notices;

  // 고정 공지가 위에 오도록 정렬 (sync.ts에서 이미 정렬되지만 안전망)
  const notices = [...filtered].sort((a, b) => {
    if (!!b.isPinned !== !!a.isPinned) return Number(!!b.isPinned) - Number(!!a.isPinned);
    return 0;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>공지</Text>
        <Text style={styles.headerSub}>{villa.name}</Text>
      </View>

      {villa.notices.length > 0 && (
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="공지 제목/내용 검색"
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
          />
        </View>
      )}

      {villa.notices.length === 0 ? (
        <View style={styles.emptyNotice}>
          <Text style={styles.emptyNoticeTitle}>공지사항이 없습니다</Text>
          <Text style={styles.emptyNoticeSub}>새로운 공지가 등록되면 여기에 표시됩니다</Text>
        </View>
      ) : notices.length === 0 ? (
        <View style={styles.emptyNotice}>
          <Text style={styles.emptyNoticeTitle}>검색 결과가 없습니다</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {notices.map(notice => (
            <View key={notice.id} style={[styles.card, notice.isPinned && styles.pinnedCard]}>
              <View style={styles.cardHeader}>
                {notice.isPinned && (
                  <View style={styles.pinnedBadge}>
                    <Text style={styles.pinnedBadgeText}>📌 고정</Text>
                  </View>
                )}
                {notice.isNew && !notice.isPinned && (
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
  header: { paddingHorizontal: 20, paddingBottom: 12 },
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

  searchWrap: { paddingHorizontal: 16, marginBottom: 12 },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EBF0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1D26',
  },
  pinnedCard: { borderColor: '#FF6B35', borderWidth: 1.5 },
  pinnedBadge: {
    backgroundColor: 'rgba(255,107,53,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pinnedBadgeText: { color: '#FF6B35', fontSize: 10, fontWeight: '800' },
});
