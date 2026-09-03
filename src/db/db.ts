import Dexie, { type EntityTable } from 'dexie'
import type { AppSetting, BodyMetric, Goal, GoalEntry, Meal, WorkoutSession } from './types'

class LockInDatabase extends Dexie {
  workouts!: EntityTable<WorkoutSession, 'id'>
  meals!: EntityTable<Meal, 'id'>
  goals!: EntityTable<Goal, 'id'>
  goalEntries!: EntityTable<GoalEntry, 'id'>
  bodyMetrics!: EntityTable<BodyMetric, 'id'>
  settings!: EntityTable<AppSetting, 'key'>

  constructor() {
    super('lock-in-challenge')
    this.version(1).stores({
      workouts: '++id, date, createdAt',
      meals: '++id, date, createdAt',
      goals: '++id, category, createdAt, completedAt',
      habits: '++id, createdAt, archivedAt',
      habitLogs: '++id, habitId, date, [habitId+date]',
      bodyMetrics: '++id, date, createdAt',
    })
    this.version(2).stores({
      goalEntries: '++id, goalId, date, [goalId+date]',
      settings: '&key',
    })
    // Habits were folded into daily recurring goals; drop their stores.
    this.version(3).stores({
      habits: null,
      habitLogs: null,
    })
  }
}

export const db = new LockInDatabase()
