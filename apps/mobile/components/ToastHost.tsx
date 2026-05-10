import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subscribeToasts, dismissToast, type Toast, type ToastKind } from '@/lib/toast';

const KIND_STYLE: Record<ToastKind, { bg: string; border: string; fg: string; icon: string }> = {
  success: { bg: '#ECFDF5', border: '#A7F3D0', fg: '#065F46', icon: '✓' },
  error: { bg: '#FEF2F2', border: '#FECACA', fg: '#991B1B', icon: '⚠' },
  warn: { bg: '#FFFBEB', border: '#FDE68A', fg: '#92400E', icon: '!' },
  info: { bg: '#EFF6FF', border: '#BFDBFE', fg: '#1E3A8A', icon: 'ℹ' },
};

export default function ToastHost() {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <View
      style={[s.host, { top: insets.top + 8 }]}
      pointerEvents="box-none"
    >
      {toasts.map((t) => {
        const style = KIND_STYLE[t.kind];
        return (
          <TouchableOpacity
            key={t.id}
            activeOpacity={0.85}
            onPress={() => dismissToast(t.id)}
            style={[
              s.toast,
              { backgroundColor: style.bg, borderColor: style.border },
            ]}
          >
            <Text style={[s.icon, { color: style.fg }]}>{style.icon}</Text>
            <Text style={[s.text, { color: style.fg }]} numberOfLines={3}>
              {t.message}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 12,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  icon: {
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
});
