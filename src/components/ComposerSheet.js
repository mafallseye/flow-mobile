import { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarPlus, Flag, Plus, X } from 'lucide-react-native';
import { MAX_TITLE } from '../lib/useTasks';
import { addDaysISO, describeDue, toISODate, todayISO } from '../lib/dates';
import { PRIORITIES } from '../lib/views';
import { useTheme } from '../theme';
import { Chip, GradientButton } from './ui';

/** Panneau bas « Nouvelle tâche » : titre, priorité, échéance. */
export default function ComposerSheet({ visible, onClose, onSubmit, defaultDue }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(2);
  const [due, setDue] = useState(defaultDue);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);

  // Réinitialise à chaque ouverture
  useEffect(() => {
    if (visible) {
      setTitle('');
      setPriority(2);
      setDue(defaultDue);
      setPicker(false);
    }
  }, [visible, defaultDue]);

  async function submit() {
    if (!title.trim() || busy) return;
    setBusy(true);
    const ok = await onSubmit({ title, priority, due_date: due });
    setBusy(false);
    if (ok) onClose();
  }

  const quick = [
    { label: "Aujourd'hui", value: todayISO() },
    { label: 'Demain', value: addDaysISO(1) },
    { label: 'Dans 1 sem.', value: addDaysISO(7) },
  ];
  const custom = due && !quick.some((q) => q.value === due);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.backdrop }]} onPress={onClose} accessibilityLabel="Fermer" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav} pointerEvents="box-none">
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 18 }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.header}>
            <Text style={[styles.h, { color: colors.text }]}>Nouvelle tâche</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Fermer"><X size={22} color={colors.text3} /></Pressable>
          </View>

          <TextInput
            value={title} onChangeText={setTitle} placeholder="Que devez-vous faire ?" placeholderTextColor={colors.text3}
            autoFocus maxLength={MAX_TITLE} returnKeyType="done" onSubmitEditing={submit}
            style={[styles.input, { color: colors.text, backgroundColor: colors.surface2, borderColor: colors.border }]}
          />

          <View style={styles.row}>
            <Flag size={16} color={colors.text3} />
            {PRIORITIES.map((p) => (
              <Chip key={p.value} label={p.label} tone={p.tone} selected={priority === p.value} onPress={() => setPriority(p.value)} />
            ))}
          </View>

          <View style={styles.row}>
            <CalendarPlus size={16} color={colors.text3} />
            {quick.map((q) => (
              <Chip key={q.label} label={q.label} selected={due === q.value} onPress={() => setDue(due === q.value ? null : q.value)} />
            ))}
            <Chip label={custom ? describeDue(due).label : 'Date…'} selected={custom} onPress={() => setPicker(true)} />
            {due && (
              <Pressable onPress={() => setDue(null)} hitSlop={8} accessibilityLabel="Retirer l'échéance">
                <X size={16} color={colors.text3} />
              </Pressable>
            )}
          </View>

          {picker && (
            <DateTimePicker
              value={due ? new Date(`${due}T12:00:00`) : new Date()}
              mode="date"
              minimumDate={new Date()}
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              accentColor={colors.primary}
              themeVariant={colors.mode}
              onChange={(event, date) => {
                if (Platform.OS !== 'ios') setPicker(false);
                if (event.type === 'set' && date) setDue(toISODate(date));
                if (event.type === 'dismissed') setPicker(false);
              }}
            />
          )}

          <GradientButton
            style={{ marginTop: 6 }} onPress={submit} disabled={!title.trim() || busy}
            title={busy ? null : 'Ajouter la tâche'}
            icon={busy ? <ActivityIndicator color="#fff" /> : <Plus size={20} color="#fff" />}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10, gap: 14 },
  handle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  input: { height: 54, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, fontSize: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
});
