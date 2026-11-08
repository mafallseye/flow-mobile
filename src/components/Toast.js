import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../theme';

const ToastContext = createContext(null);

/** Toast unique animé, avec action optionnelle (ex. « Annuler »). */
export function ToastProvider({ children }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  const hide = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setToast(null));
  }, [anim]);

  const show = useCallback(
    (next) => {
      clearTimeout(timer.current);
      setToast(next);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
      timer.current = setTimeout(hide, next.tone === 'error' ? 5000 : 3500);
    },
    [anim, hide]
  );

  const api = useMemo(
    () => ({
      error: (message) => show({ message, tone: 'error' }),
      success: (message, action) => show({ message, tone: 'success', action }),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.wrap,
            { top: insets.top + 8, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
          ]}
        >
          <View style={[styles.toast, { backgroundColor: colors.text }]} accessibilityLiveRegion="polite">
            {toast.tone === 'error' ? <AlertCircle size={18} color={colors.danger} /> : <CheckCircle2 size={18} color={colors.ok} />}
            <Text style={[styles.msg, { color: colors.bg }]}>{toast.message}</Text>
            {toast.action && (
              <Pressable
                hitSlop={8}
                onPress={() => {
                  toast.action.onPress();
                  hide();
                }}
              >
                <Text style={styles.action}>{toast.action.label}</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans <ToastProvider>.');
  return ctx;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 100 },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 14, maxWidth: 440, width: '100%',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8,
  },
  msg: { flex: 1, fontSize: 14, fontWeight: '500' },
  action: { color: '#9d90ff', fontWeight: '700', fontSize: 14 },
});
