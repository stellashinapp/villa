import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PRIVACY_POLICY, PRIVACY_VERSION } from '@villatolk/shared';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={s.title}>개인정보처리방침</Text>
        <Text style={s.ver}>v{PRIVACY_VERSION}</Text>
      </View>
      <ScrollView style={s.body} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={s.text}>{PRIVACY_POLICY}</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EBF0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  back: { paddingVertical: 4 },
  backText: { fontSize: 15, color: '#4263E8', fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '800', color: '#1A1D26' },
  ver: { fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' },
  body: { flex: 1 },
  text: { fontSize: 13, color: '#1A1D26', lineHeight: 22 },
});
