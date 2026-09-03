// Data-access layer. Pages talk to this module only, never to `db` directly,
// so the storage backend (currently IndexedDB via Dexie) can be swapped for
// a cloud API later without touching page code.
import { db } from './db'
import type { BodyMetric, Goal, GoalPeriod, Meal, WorkoutSession } from './types'
import { periodStart, todayStr } from '../lib/dates'
import { hashPassword, verifyPassword } from '../lib/password'

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
  remove: async (id: number) => {
    await db.goalEntries.where('goalId').equals(id).delete()
    await db.goals.delete(id)
  },
  all: () => db.goals.orderBy('createdAt').reverse().toArray(),
  active: () => db.goals.filter((g) => !g.completedAt).toArray(),
}

export const goalEntriesRepo = {
  add: (goalId: number, amount: number, date: string = todayStr()) =>
    db.goalEntries.add({ goalId, amount, date, createdAt: Date.now() }),
  removeLast: async (goalId: number) => {
    const last = await db.goalEntries.where('goalId').equals(goalId).last()
    if (last?.id) await db.goalEntries.delete(last.id)
  },
  byGoal: (goalId: number) => db.goalEntries.where('goalId').equals(goalId).toArray(),
  /** Sum of entries within the goal's active window: current day/week/month for recurring goals, all-time for one-off goals. */
  progressFor: async (goal: Goal): Promise<number> => {
    const entries = await db.goalEntries.where('goalId').equals(goal.id!).toArray()
    if (goal.kind === 'once') {
      return entries.reduce((sum, e) => sum + e.amount, 0)
    }
    const from = periodStart(goal.period!)
    return entries.filter((e) => e.date >= from).reduce((sum, e) => sum + e.amount, 0)
  },
  /** Sum of entries within an explicit period window, ignoring the goal's own native period — used to browse a goal at a different granularity (e.g. a daily goal's weekly total). */
  progressForWindow: async (goal: Goal, windowPeriod: GoalPeriod): Promise<number> => {
    const entries = await db.goalEntries.where('goalId').equals(goal.id!).toArray()
    const from = periodStart(windowPeriod)
    return entries.filter((e) => e.date >= from).reduce((sum, e) => sum + e.amount, 0)
  },
}

// --- Body metrics ---
export const bodyMetricsRepo = {
  add: (b: Omit<BodyMetric, 'id' | 'createdAt'>) =>
    db.bodyMetrics.add({ ...b, createdAt: Date.now() }),
  remove: (id: number) => db.bodyMetrics.delete(id),
  all: () => db.bodyMetrics.orderBy('date').toArray(),
  latest: async () => (await db.bodyMetrics.orderBy('date').last()) ?? null,
}

// --- App settings (simple key/value, e.g. target weight) ---
export const settingsRepo = {
  get: async (key: string) => (await db.settings.get(key))?.value,
  set: (key: string, value: number) => db.settings.put({ key, value }),
}

// --- Local device lock (not a real account system, see lib/password.ts) ---
export const authRepo = {
  exists: async () => (await db.auth.get('local')) !== undefined,
  getUsername: async () => (await db.auth.get('local'))?.username,
  setCredentials: async (username: string, password: string) => {
    const { hash, salt } = await hashPassword(password)
    await db.auth.put({ id: 'local', username, passwordHash: hash, salt, createdAt: Date.now() })
  },
  verify: async (username: string, password: string): Promise<boolean> => {
    const record = await db.auth.get('local')
    if (!record || record.username !== username) return false
    return verifyPassword(password, record.salt, record.passwordHash)
  },
  /** Clears only the lock credentials — never touches app data (workouts, meals, goals, ...). */
  clear: () => db.auth.delete('local'),
}
