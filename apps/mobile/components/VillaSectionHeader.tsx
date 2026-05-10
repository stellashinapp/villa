// 빌라 상세 서브페이지(관리비/입주민/주차/공지/메시지) 공통 헤더.
// 뒤로가기 + 빌라명 + 섹션 라벨 + safe area top padding.

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

interface Props {
  villaName: string;
  section: string; // '입주민' / '관리비' / '주차' / '공지' / '메시지'
}

export default function VillaSectionHeader({ villaName, section }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backRow} activeOpacity={0.6}>
        <Text style={styles.backLink}>← 빌라</Text>
      </TouchableOpacity>
      <Text style={styles.title}>
        <Text style={styles.villa}>{villaName}</Text>
        <Text style={styles.sep}>  ·  </Text>
        <Text style={styles.section}>{section}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EBF0',
  },
  backRow: {
    paddingVertical: 4,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  backLink: {
    fontSize: 13,
    color: '#4263E8',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  villa: { color: '#1A1D26' },
  sep: { color: '#9CA3AF', fontWeight: '600' },
  section: { color: '#4263E8' },
});
