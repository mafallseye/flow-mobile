import { Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Share2, X } from 'lucide-react-native';
import { useTheme } from '../theme';
import { GradientButton } from './ui';

/** URL publique de Flow (surchargeable via EXPO_PUBLIC_WEB_URL). */
export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://task-app-nine-omega.vercel.app';

/** Modal « Partager Flow » : QR code à faire scanner + partage natif du lien. */
export default function ShareQRModal({ visible, onClose }) {
  const { colors } = useTheme();

  async function share() {
    try {
      await Share.share({ message: `Organise tes tâches avec Flow ✨ ${WEB_URL}`, url: WEB_URL });
    } catch {
      /* partage annulé ou indisponible : rien à faire */
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.backdrop }]} onPress={onClose}>
        <Pressable style={[styles.card, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.close} accessibilityLabel="Fermer">
            <X size={22} color={colors.text3} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Partager Flow</Text>
          <Text style={[styles.sub, { color: colors.text2 }]}>
            Faites scanner ce code avec l’appareil photo pour ouvrir Flow.
          </Text>
          <View style={styles.qrBox} accessibilityLabel={`QR code vers ${WEB_URL}`}>
            <QRCode value={WEB_URL} size={200} color="#171a2b" backgroundColor="#ffffff" ecl="M" />
          </View>
          <Text style={[styles.url, { color: colors.text3 }]} selectable>{WEB_URL.replace('https://', '')}</Text>
          <GradientButton style={{ alignSelf: 'stretch' }} title="Partager le lien" onPress={share}
            icon={<Share2 size={18} color="#fff" />} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 360, borderRadius: 26, padding: 24, alignItems: 'center', gap: 12 },
  close: { position: 'absolute', top: 16, right: 16 },
  title: { fontSize: 21, fontWeight: '800', letterSpacing: -0.3 },
  sub: { fontSize: 14, textAlign: 'center' },
  qrBox: {
    padding: 16, backgroundColor: '#fff', borderRadius: 20, marginVertical: 6,
    shadowColor: '#6a5cff', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  url: { fontSize: 12, marginBottom: 6 },
});
