import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme';

/** Anneau de progression (dégradé Flow). */
export default function ProgressRing({ value, total, size = 64 }) {
  const { colors } = useTheme();
  const pct = total ? Math.round((value / total) * 100) : 0;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size }} accessibilityRole="progressbar"
      accessibilityLabel={`${pct} % des tâches terminées`}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.grad[0]} />
            <Stop offset="1" stopColor={colors.grad[1]} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surface2} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="url(#g)" strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <Text style={[styles.label, { color: colors.text, lineHeight: size }]}>{pct}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { flex: 1, textAlign: 'center', textAlignVertical: 'center', fontWeight: '800', fontSize: 14 },
});
