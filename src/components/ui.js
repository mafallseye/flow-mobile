import { Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { useTheme } from '../theme';

/** Bouton principal en dégradé (avec retour haptique). */
export function GradientButton({ title, onPress, disabled, icon, style }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [styles.shadow, { opacity: disabled ? 0.55 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}
    >
      <LinearGradient colors={colors.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
        {title ? <Text style={styles.btnText}>{title}</Text> : null}
        {icon}
      </LinearGradient>
    </Pressable>
  );
}

/** Logo Flow (carré dégradé + coche). */
export function Logo({ size = 48 }) {
  const { colors } = useTheme();
  return (
    <LinearGradient colors={colors.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[styles.logo, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <Check size={size * 0.55} color="#fff" strokeWidth={3.2} />
    </LinearGradient>
  );
}

/** Puce sélectionnable (priorité, date rapide). */
export function Chip({ label, selected, onPress, tone = 'primary' }) {
  const { colors } = useTheme();
  const accent = tone === 'danger' ? colors.danger : tone === 'muted' ? colors.text2 : colors.primary;
  const soft = tone === 'danger' ? colors.dangerSoft : tone === 'muted' ? colors.surface2 : colors.primarySoft;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, { backgroundColor: selected ? soft : colors.surface2, borderColor: selected ? accent : 'transparent' }]}
    >
      <Text style={[styles.chipText, { color: selected ? accent : colors.text2 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 14,
    shadowColor: '#6a5cff', shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  btn: { height: 54, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  logo: { alignItems: 'center', justifyContent: 'center' },
  chip: { height: 34, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1.5, justifyContent: 'center' },
  chipText: { fontSize: 13, fontWeight: '600' },
});
