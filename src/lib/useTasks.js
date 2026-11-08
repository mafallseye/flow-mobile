import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';

export const MAX_TITLE = 200;
const COLUMNS = 'id, title, is_done, priority, due_date, created_at';

/** Valide et normalise les champs modifiables d'une tâche. Lève une erreur lisible. */
function sanitize(fields) {
  const out = {};
  if ('title' in fields) {
    const t = String(fields.title ?? '').trim();
    if (!t) throw new Error('Le titre ne peut pas être vide.');
    if (t.length > MAX_TITLE) throw new Error(`Le titre dépasse ${MAX_TITLE} caractères.`);
    out.title = t;
  }
  if ('priority' in fields) {
    const p = Number(fields.priority);
    if (![1, 2, 3].includes(p)) throw new Error('Priorité invalide.');
    out.priority = p;
  }
  if ('due_date' in fields) {
    const d = fields.due_date || null;
    if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new Error('Date invalide.');
    out.due_date = d;
  }
  if ('is_done' in fields) out.is_done = Boolean(fields.is_done);
  return out;
}

/**
 * Accès aux tâches de l'utilisateur : chargement, temps réel,
 * et mutations optimistes avec rollback en cas d'erreur.
 * `onError(message)` est appelé pour toute erreur à afficher.
 */
export function useTasks(userId, onError) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const upsertLocal = useCallback((row) => {
    setTasks((prev) =>
      prev.some((t) => t.id === row.id)
        ? prev.map((t) => (t.id === row.id ? { ...t, ...row } : t))
        : [row, ...prev]
    );
  }, []);

  useEffect(() => {
    let active = true;
    supabase
      .from('tasks')
      .select(COLUMNS)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) onError?.(error.message);
        else setTasks(data);
        setLoading(false);
      });

    const channel = supabase
      .channel(`tasks-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        ({ eventType, new: row, old }) => {
          if (eventType === 'DELETE') setTasks((prev) => prev.filter((t) => t.id !== old.id));
          else upsertLocal(row);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId, onError, upsertLocal]);

  const addTask = useCallback(
    async (fields) => {
      try {
        const payload = sanitize({ priority: 2, due_date: null, ...fields });
        const { data, error } = await supabase.from('tasks').insert(payload).select(COLUMNS).single();
        if (error) throw error;
        upsertLocal(data);
        return true;
      } catch (err) {
        onError?.(err.message);
        return false;
      }
    },
    [onError, upsertLocal]
  );

  const updateTask = useCallback(
    async (id, fields) => {
      const before = tasksRef.current.find((t) => t.id === id);
      if (!before) return false;
      let patch;
      try {
        patch = sanitize(fields);
      } catch (err) {
        onError?.(err.message);
        return false;
      }
      upsertLocal({ ...before, ...patch });
      const { error } = await supabase.from('tasks').update(patch).eq('id', id);
      if (error) {
        upsertLocal(before);
        onError?.(error.message);
        return false;
      }
      return true;
    },
    [onError, upsertLocal]
  );

  const deleteTask = useCallback(
    async (id) => {
      const before = tasksRef.current.find((t) => t.id === id);
      if (!before) return null;
      setTasks((prev) => prev.filter((t) => t.id !== id));
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) {
        upsertLocal(before);
        onError?.(error.message);
        return null;
      }
      return before;
    },
    [onError, upsertLocal]
  );

  /** Recrée une tâche supprimée (action « Annuler »). */
  const restoreTask = useCallback(
    (task) =>
      addTask({ title: task.title, priority: task.priority, due_date: task.due_date, is_done: task.is_done }),
    [addTask]
  );

  return { tasks, loading, addTask, updateTask, deleteTask, restoreTask };
}
