import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Calendar, Check, Flag, Trash2 } from 'lucide-react-native';
import { describeDue } from '../lib/dates';
import { PRIORITIES } from '../lib/views';
import { useTheme } from '../theme';

/** Carte de tâche : cocher, éditer (appui), priorité (cycle), supprimer. */
function TaskItem({ task, onToggle, onUpdate, onDelete }) {
  const { colors } = useTheme();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const due = describeDue(task.due_date);
  const prio = PRIORITIES.find((p) => p.value === task.priority) ?? PRIORITIES[1];
  const high = task.priority === 3;

  const dueStyle = {
    overdue: [colors.dangerSoft, colors.danger],
    today: [colors.okSoft, colors.ok],
    soon: [colors.warnSoft, colors.warn],
    later: [colors.surface2, colors.text2],
  }[task.is_done ? 'later' : due?.tone ?? 'later'];

  async function commit() {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== task.title) {
      const ok = await onUpdate(task.id, { title: next });
      if (!ok) setDraft(task.title);
    } else setDraft(task.title);
  }

  function toggle() {
    Haptics.notificationAsync(
      task.is_done ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
    ).catch(() => {});
    onToggle(task);
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: task.is_done ? 0.7 : 1 }]}>
      {high && !task.is_done && <View style={[styles.stripe, { backgroundColor: colors.danger }]} />}

      <Pressable onPress={toggle} hitSlop={10} accessibilityRole="checkbox" accessibilityState={{ checked: task.is_done }}
        accessibilityLabel={task.is_done ? 'Marquer comme à faire' : 'Marquer comme terminée'}
        style={[styles.check, task.is_done
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { borderColor: high ? colors.danger : colors.text3 }]}>
        {task.is_done && <Check size={15} color="#fff" strokeWidth={3.2} />}
      </Pressable>

      <View style={styles.body}>
        {editing ? (
          <TextInput value={draft} onChangeText={setDraft} onBlur={commit} onSubmitEditing={commit} autoFocus
            maxLength={200} returnKeyType="done" selectTextOnFocus
            style={[styles.edit, { color: colors.text, borderColor: colors.primary, backgroundColor: colors.surface2 }]} />
        ) : (
          <Pressable onPress={() => !task.is_done && setEditing(true)} accessibilityHint="Appuyer pour modifier">
            <Text style={[styles.title, { color: task.is_done ? colors.text3 : colors.text },
              task.is_done && styles.strike]}>{task.title}</Text>
          </Pressable>
        )}

        {(due || task.priority !== 2) && (
          <View style={styles.meta}>
            {due && (
              <View style={[styles.badge, { backgroundColor: dueStyle[0] }]}>
                <Calendar size={12} color={dueStyle[1]} />
                <Text style={[styles.badgeText, { color: dueStyle[1] }]}>{due.label}</Text>
              </View>
            )}
            {task.priority !== 2 && (
              <View style={[styles.badge, { backgroundColor: high ? colors.dangerSoft : colors.surface2 }]}>
                <Flag size={12} color={high ? colors.danger : colors.text3} />
                <Text style={[styles.badgeText, { color: high ? colors.danger : colors.text3 }]}>{prio.label}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {!task.is_done && (
        <Pressable hitSlop={6} style={styles.iconBtn} accessibilityLabel={`Priorité ${prio.label}, changer`}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onUpdate(task.id, { priority: task.priority === 3 ? 1 : task.priority + 1 });
          }}>
          <Flag size={18} color={high ? colors.danger : colors.text3} />
        </Pressable>
      )}
      <Pressable hitSlop={6} style={styles.iconBtn} onPress={() => onDelete(task)} accessibilityLabel="Supprimer la tâche">
        <Trash2 size={18} color={colors.text3} />
      </Pressable>
    </View>
  );
}

export default memo(TaskItem);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 14, paddingLeft: 16, paddingRight: 6,
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#171a2b', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  stripe: { position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 6 },
  title: { fontSize: 16, fontWeight: '500', lineHeight: 21 },
  strike: { textDecorationLine: 'line-through' },
  edit: { fontSize: 16, fontWeight: '500', borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
});
