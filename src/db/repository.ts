// Data-access layer. Pages talk to this module only, never to `db` directly,
// so the storage backend (currently IndexedDB via Dexie) can be swapped for
// a cloud API later without touching page code.
import { db } from './db'
import type { BodyMetric, Goal, Habit, Meal, WorkoutSession } from './types'

// --- Workouts ---
export const workoutsRepo = {
  add: (w: Omit<WorkoutSession, 'id' | 'createdAt'>) =>
    db.workouts.add({ ...w, createdAt: Date.now() }),
  update: (id: number, changes: Partial<WorkoutSession>) => db.workouts.update(id, changes),
  remove: (id: number) => db.workouts.delete(id),
  all: () => db.workouts.orderBy('date').reverse().toArray(),
  recent: (limit: number) => db.workouts.orderBy('date').reverse().limit(limit).toArray(),
  byDateRange: (from: string, to: string) =>
    db.workouts.where('date').between(from, to, true, true).toArray(),
}

// --- Nutrition ---
export const mealsRepo = {
  add: (m: Omit<Meal, 'id' | 'createdAt'>) => db.meals.add({ ...m, createdAt: Date.now() }),
  update: (id: number, changes: Partial<Meal>) => db.meals.update(id, changes),
  remove: (id: number) => db.meals.delete(id),
  byDate: (date: string) => db.meals.where('date').equals(date).toArray(),
  byDateRange: (from: string, to: string) =>
    db.meals.where('date').between(from, to, true, true).toArray(),
}

// --- Goals ---
export const goalsRepo = {
  add: (g: Omit<Goal, 'id' | 'createdAt'>) => db.goals.add({ ...g, createdAt: Date.now() }),
  update: (id: number, changes: Partial<Goal>) => db.goals.update(id, changes),
  remove: (id: number) => db.goals.delete(id),
  all: () => db.goals.orderBy('createdAt').reverse().toArray(),
  active: () => db.goals.filter((g) => !g.completedAt).toArray(),
}

// --- Habits ---
export const habitsRepo = {
  add: (h: Omit<Habit, 'id' | 'createdAt'>) => db.habits.add({ ...h, createdAt: Date.now() }),
  archive: (id: number) => db.habits.update(id, { archivedAt: Date.now() }),
  remove: async (id: number) => {
    await db.habitLogs.where('habitId').equals(id).delete()
    await db.habits.delete(id)
  },
  active: () => db.habits.filter((h) => !h.archivedAt).toArray(),
}

export const habitLogsRepo = {
  toggle: async (habitId: number, date: string) => {
    const existing = await db.habitLogs.where('[habitId+date]').equals([habitId, date]).first()
    if (existing) {
      await db.habitLogs.update(existing.id!, { completed: !existing.completed })
    } else {
      await db.habitLogs.add({ habitId, date, completed: true })
    }
  },
  byDate: (date: string) => db.habitLogs.where('date').equals(date).toArray(),
  byHabit: (habitId: number) => db.habitLogs.where('habitId').equals(habitId).toArray(),
}

// --- Body metrics ---
export const bodyMetricsRepo = {
  add: (b: Omit<BodyMetric, 'id' | 'createdAt'>) =>
    db.bodyMetrics.add({ ...b, createdAt: Date.now() }),
  remove: (id: number) => db.bodyMetrics.delete(id),
  all: () => db.bodyMetrics.orderBy('date').toArray(),
}
