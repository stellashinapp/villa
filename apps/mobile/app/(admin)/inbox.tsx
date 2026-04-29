import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { store, subscribe, replyMessage } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { syncAdminFromSupabase } from '@/lib/sync';

const C = {
  bg: '#F5F6FA',
  card: '#FFFFFF',
  border: '#E8EBF0',
  pri: '#3454D1',
  priL: '#E8EEFB',
  text: '#1A1D26',
  sub: '#6B7280',
  muted: '#9CA3AF',
  inputBg: '#F0F2F6',
  inputBorder: '#E5E7EB',
  ok: '#4CAF50',
  warn: '#F39C12',
  err: '#E74C3C',
};

interface FlatMsg {
  id: string;
  villaId: string;
  villaName: string;
  from: string;
  fromName: string;
  text: string;
  date: string;
  read: boolean;
  replies: { text: string; from: string; date: string }[];
}

export default function AdminInboxScreen() {
  const [_, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  useEffect(() => {
    const villaIds = store.villas.map((v) => v.id);
    if (villaIds.length === 0) return;
    const channels = villaIds.map((villaId) =>
      supabase
        .channel(`inbox-${villaId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `villa_id=eq.${villaId}` },
          () => { syncAdminFromSupabase().catch(() => {}); },
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'message_replies' },
          () => { syncAdminFromSupabase().catch(() => {}); },
        )
        .subscribe(),
    );
    return () => { channels.forEach((c) => supabase.removeChannel(c)); };
  }, []);

  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Flatten all messages from all villas
  const allMessages: FlatMsg[] = store.villas
    .flatMap(v =>
      v.messages.map(m => ({
        ...m,
        villaName: v.name,
        villaId: v.id,
      })),
    )
    .sort((a, b) => {
      // unread first, then by date desc
      if (a.read !== b.read) return a.read ? 1 : -1;
      return b.date.localeCompare(a.date);
    });

  const unreadCount = allMessages.filter(m => !m.read).length;

  function handleReply(villaId: string, msgId: string) {
    const text = (replyInputs[msgId] || '').trim();
    if (!text) return;
    replyMessage(villaId, msgId, text);
    setReplyInputs(prev => ({ ...prev, [msgId]: '' }));
  }

  function getStatusBadge(msg: FlatMsg) {
    if (!msg.read && msg.replies.length === 0) {
      return { label: 'NEW', color: C.err, bg: 'rgba(231,76,60,0.08)' };
    }
    if (msg.read && msg.replies.length === 0) {
      return { label: '답변대기', color: C.warn, bg: 'rgba(243,156,18,0.08)' };
    }
    return { label: '답변완료', color: C.ok, bg: 'rgba(76,175,80,0.08)' };
  }

  function toggleExpand(msgId: string) {
    setExpandedId(prev => (prev === msgId ? null : msgId));
    // Mark as read when expanding
    const msg = allMessages.find(m => m.id === msgId);
    if (msg && !msg.read) {
      const villa = store.villas.find(v => v.id === msg.villaId);
      if (villa) {
        const original = villa.messages.find(m => m.id === msgId);
        if (original) {
          original.read = true;
        }
      }
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>ADMIN</Text>
        <Text style={styles.title}>메시지 수신함</Text>
      </View>

      {/* Unread banner */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadBannerText}>
            읽지 않은 메시지 {unreadCount}건
          </Text>
        </View>
      )}

      {allMessages.length === 0 ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>메시지가 없습니다</Text>
        </View>
      ) : (
        allMessages.map(msg => {
          const badge = getStatusBadge(msg);
          const isExpanded = expandedId === msg.id;
          return (
            <TouchableOpacity
              key={`${msg.villaId}-${msg.id}`}
              style={[
                styles.msgCard,
                !msg.read && { borderColor: 'rgba(52,84,209,0.3)' },
              ]}
              activeOpacity={0.8}
              onPress={() => toggleExpand(msg.id)}
            >
              {/* Header row */}
              <View style={styles.msgHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.msgSenderRow}>
                    <Text style={styles.msgHo}>{msg.from}</Text>
                    <Text style={styles.msgName}>{msg.fromName}</Text>
                  </View>
                  <Text style={styles.msgVilla}>{msg.villaName}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                  <Text style={styles.msgDate}>{msg.date}</Text>
                </View>
              </View>

              {/* Message body */}
              <Text style={styles.msgText} numberOfLines={isExpanded ? undefined : 2}>
                {msg.text}
              </Text>

              {/* Expanded: replies + reply input */}
              {isExpanded && (
                <View style={styles.expandedSection}>
                  {msg.replies.length > 0 && (
                    <View style={styles.repliesSection}>
                      {msg.replies.map((r, i) => (
                        <View key={i} style={styles.replyBubble}>
                          <View style={styles.replyHeader}>
                            <Text style={styles.replyFrom}>{r.from}</Text>
                            <Text style={styles.replyDate}>{r.date}</Text>
                          </View>
                          <Text style={styles.replyText}>{r.text}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Reply input */}
                  <View style={styles.replyInputRow}>
                    <TextInput
                      style={styles.replyInput}
                      placeholder="답변을 입력하세요..."
                      placeholderTextColor={C.muted}
                      value={replyInputs[msg.id] || ''}
                      onChangeText={v =>
                        setReplyInputs(prev => ({ ...prev, [msg.id]: v }))
                      }
                    />
                    <TouchableOpacity
                      style={styles.replySendBtn}
                      onPress={() => handleReply(msg.villaId, msg.id)}
                    >
                      <Text style={styles.replySendText}>전송</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  headerLabel: {
    fontSize: 11,
    color: C.pri,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: { fontSize: 22, fontWeight: '900', color: C.text },

  unreadBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(231,76,60,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.15)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  unreadBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E74C3C',
    textAlign: 'center',
  },

  placeholder: { padding: 40, alignItems: 'center' },
  placeholderText: { color: C.sub, fontSize: 14 },

  msgCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  msgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  msgSenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  msgHo: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
  },
  msgName: {
    fontSize: 13,
    fontWeight: '600',
    color: C.sub,
  },
  msgVilla: {
    fontSize: 11,
    color: C.pri,
    fontWeight: '600',
    marginTop: 2,
  },
  msgDate: {
    fontSize: 11,
    color: C.muted,
  },
  msgText: {
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  expandedSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 12,
  },
  repliesSection: {
    gap: 8,
    marginBottom: 12,
  },
  replyBubble: {
    backgroundColor: C.priL,
    borderRadius: 10,
    padding: 12,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  replyFrom: {
    fontSize: 12,
    fontWeight: '700',
    color: C.pri,
  },
  replyDate: {
    fontSize: 11,
    color: C.muted,
  },
  replyText: {
    fontSize: 13,
    color: C.text,
    lineHeight: 18,
  },

  replyInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  replyInput: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: C.text,
  },
  replySendBtn: {
    backgroundColor: C.pri,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  replySendText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
