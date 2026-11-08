import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { LogOut, Moon, Plus, Sun } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useTasks } from '../lib/useTasks';
import { VIEWS, countByView, sortTasks } from '../lib/views';
import { addDaysISO, formatLongToday, greeting, todayISO } from '../lib/dates';
import { useTheme } from '../theme';
import { useToast } from './Toast';
import TaskItem from './TaskItem';
import ComposerSheet from './ComposerSheet';
import ProgressRing from './ProgressRing';

const DEFAULT_DUE = { today: () => todayISO(), upcoming: () => addDaysISO(1) };
const TAB_H = 64;

export default function HomeScreen({ user }) {
  const { colors, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const onError = useCallback((m) => toast.error(m), [toast]);
  const { tasks, loading, addTask, updateTask, deleteTask, restoreTask } = useTasks(user.id, onError);

  const [viewId, setViewId] = useState('today');
  const [sheet, setSheet] = useState(false);

  const view = VIEWS.find((v) => v.id === viewId);
  const counts = useMemo(() => countByView(tasks), [tasks]);
  const visible = useMemo(() => {
    const today = todayISO();
    return tasks.filter((t) => view.filter(t, today)).sort(sortTasks);
  }, [tasks, view]);
  const defaultDue = useMemo(() => DEFAULT_DUE[viewId]?.() ?? null, [viewId]);
  const name = user.email.split('@')[0];

  const handleToggle = useCallback(
    async (task) => {
      const ok = await updateTask(task.id, { is_done: !task.is_done });
      if (ok && !task.is_done) toast.success('Tâche terminée 🎉');
    },
    [updateTask, toast]
  );

  const handleDelete = useCallback(
    async (task) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const removed = await deleteTask(task.id);
      if (removed) toast.success('Tâche supprimée', { label: 'Annuler', onPress: () => restoreTask(removed) });
    },
    [deleteTask, restoreTask, toast]
  );

  function confirmSignOut() {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) toast.error(error.message);
        },
      },
    ]);
  }

  const Header = (
    <View style={{ gap: 18, marginBottom: 14 }}>
      <View style={styles.topbar}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: colors.text3 }]}>{formatLongToday().toUpperCase()}</Text>
          <Text style={[styles.hello, { color: colors.text }]} numberOfLines={1}>
            {greeting()}, <Text style={{ color: colors.primary }}>{name}</Text>
          </Text>
        </View>
        <Pressable onPress={toggle} style={styles.iconBtn} hitSlop={6} accessibilityLabel="Changer de thème">
          {colors.mode === 'dark' ? <Sun size={21} color={colors.text2} /> : <Moon size={21} color={colors.text2} />}
        </Pressable>
        <Pressable onPress={confirmSignOut} style={styles.iconBtn} hitSlop={6} accessibilityLabel="Se déconnecter">
          <LogOut size={20} color={colors.text2} />
        </Pressable>
      </View>

      <View style={[styles.stats, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ProgressRing value={counts.done} total={tasks.length} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>
            {tasks.length === 0 ? 'Commencez votre liste' : `${counts.done} sur ${tasks.length} terminée${counts.done > 1 ? 's' : ''}`}
          </Text>
          <Text style={{ color: colors.text2, fontSize: 14 }}>
            {counts.today > 0 ? `${counts.today} tâche${counts.today > 1 ? 's' : ''} pour aujourd'hui` : "Rien d'urgent aujourd'hui"}
          </Text>
        </View>
      </View>

      <View style={styles.sectionHead}>
        <view.icon size={20} color={colors.text} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{view.label}</Text>
        <View style={[styles.pill, { backgroundColor: colors.primarySoft }]}>
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>{visible.length}</Text>
        </View>
      </View>
    </View>
  );

  const Empty = loading ? (
    <View style={{ gap: 8 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.skeleton, { backgroundColor: colors.surface, borderColor: colors.border }]} />
      ))}
    </View>
  ) : (
    <View style={styles.empty}>
      <View style={[styles.emptyArt, { backgroundColor: colors.primarySoft }]}>
        <view.icon size={34} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{view.empty.title}</Text>
      <Text style={{ color: colors.text2, textAlign: 'center' }}>{view.empty.text}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={loading ? [] : visible}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <TaskItem task={item} onToggle={handleToggle} onUpdate={updateTask} onDelete={handleDelete} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListHeaderComponent={Header}
        ListEmptyComponent={Empty}
        contentContainerStyle={{
          paddingTop: insets.top + 12, paddingHorizontal: 18, paddingBottom: TAB_H + insets.bottom + 110,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      {/* Bouton flottant */}
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); setSheet(true); }}
        accessibilityRole="button" accessibilityLabel="Nouvelle tâche"
        style={({ pressed }) => [styles.fab, { bottom: TAB_H + insets.bottom + 18, transform: [{ scale: pressed ? 0.92 : 1 }] }]}
      >
        <LinearGradient colors={colors.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabInner}>
          <Plus size={28} color="#fff" />
        </LinearGradient>
      </Pressable>

      {/* Barre d'onglets */}
      <View style={[styles.tabbar, { height: TAB_H + insets.bottom, paddingBottom: insets.bottom, backgroundColor: colors.surface, borderColor: colors.border }]}
        accessibilityRole="tablist">
        {VIEWS.map((v) => {
          const active = v.id === viewId;
          const badge = v.id !== 'done' ? counts[v.id] : 0;
          return (
            <Pressable key={v.id} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: active }}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); setViewId(v.id); }}>
              <View style={[styles.tabIcon, active && { backgroundColor: colors.primarySoft }]}>
                <v.icon size={22} color={active ? colors.primary : colors.text3} />
                {badge > 0 && (
                  <View style={[styles.dot, { backgroundColor: colors.danger, borderColor: colors.surface }]}>
                    <Text style={styles.dotText}>{badge > 99 ? '99+' : badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, { color: active ? colors.primary : colors.text3 }]}>{v.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ComposerSheet visible={sheet} onClose={() => setSheet(false)} onSubmit={addTask} defaultDue={defaultDue} />
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  hello: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginTop: 4 },
  iconBtn: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stats: {
    flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 18, borderWidth: 1,
    shadowColor: '#171a2b', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  statsTitle: { fontSize: 17, fontWeight: '700' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  sectionTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  pill: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 99 },
  skeleton: { height: 64, borderRadius: 16, borderWidth: 1, opacity: 0.6 },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 20, gap: 8 },
  emptyArt: { width: 78, height: 78, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  fab: {
    position: 'absolute', right: 20, borderRadius: 20,
    shadowColor: '#6a5cff', shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  fabInner: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tabbar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabIcon: { width: 56, height: 32, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 11, fontWeight: '600' },
  dot: {
    position: 'absolute', top: -3, right: 6, minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  dotText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
