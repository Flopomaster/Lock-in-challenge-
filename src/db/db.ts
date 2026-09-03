import Dexie, { type EntityTable } from 'dexie'
import type { BodyMetric, Goal, Habit, HabitLog, Meal, WorkoutSession } from './types'

class LockInDatabase extends Dexie {
  workouts!: EntityTable<WorkoutSession, 'id'>
  meals!: EntityTable<Meal, 'id'>
  goals!: EntityTable<Goal, 'id'>
  habits!: EntityTable<Habit, 'id'>
  habitLogs!: EntityTable<HabitLog, 'id'>
  bodyMetrics!: EntityTable<BodyMetric, 'id'>

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
  }
}

export const db = new LockInDatabase()
