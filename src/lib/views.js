import { CalendarDays, CalendarClock, Inbox, CheckCheck } from 'lucide-react-native';
import { todayISO } from './dates';

/** Vues de l'app (identiques à la version web). */
export const VIEWS = [
  {
    id: 'today',
    label: "Aujourd'hui",
    icon: CalendarDays,
    filter: (t, today) => !t.is_done && t.due_date && t.due_date <= today,
    empty: { title: 'Journée dégagée ✨', text: "Rien de prévu pour aujourd'hui. Profitez-en !" },
  },
  {
    id: 'upcoming',
    label: 'À venir',
    icon: CalendarClock,
    filter: (t, today) => !t.is_done && t.due_date && t.due_date > today,
    empty: { title: 'Rien à l’horizon', text: 'Ajoutez une échéance à une tâche pour la retrouver ici.' },
  },
  {
    id: 'all',
    label: 'Toutes',
    icon: Inbox,
    filter: (t) => !t.is_done,
    empty: { title: 'Tout est fait 🎉', text: 'Ajoutez une nouvelle tâche pour commencer.' },
  },
  {
    id: 'done',
    label: 'Terminées',
    icon: CheckCheck,
    filter: (t) => t.is_done,
    empty: { title: 'Aucune tâche terminée', text: 'Cochez une tâche pour la voir apparaître ici.' },
  },
];

export const PRIORITIES = [
  { value: 3, label: 'Haute', tone: 'danger' },
  { value: 2, label: 'Normale', tone: 'primary' },
  { value: 1, label: 'Basse', tone: 'muted' },
];

/** Priorité haute d'abord, puis échéance la plus proche, puis plus récente. */
export function sortTasks(a, b) {
  if (a.priority !== b.priority) return b.priority - a.priority;
  if (a.due_date !== b.due_date) {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date < b.due_date ? -1 : 1;
  }
  return a.created_at < b.created_at ? 1 : -1;
}

export function countByView(tasks) {
  const today = todayISO();
  return Object.fromEntries(VIEWS.map((v) => [v.id, tasks.filter((t) => v.filter(t, today)).length]));
}
