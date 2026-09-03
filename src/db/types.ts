export interface WorkoutSet {
  reps: number
  weight: number
}

export interface WorkoutExercise {
  name: string
  sets: WorkoutSet[]
}

export interface WorkoutSession {
  id?: number
  date: string // YYYY-MM-DD
  name: string
  durationMin?: number
  notes?: string
  exercises: WorkoutExercise[]
  createdAt: number
}

export interface MealItem {
  name: string
  calories: number
  protein?: number
  carbs?: number
  fat?: number
}

export interface Meal {
  id?: number
  date: string // YYYY-MM-DD
  time?: string
  name: string
  /** Sum of all items' calories (or the single value, for a simple meal with no items breakdown). */
  calories: number
  protein?: number
  carbs?: number
  fat?: number
  /** Individual foods that make up this meal, when logged via the multi-item flow. */
  items?: MealItem[]
  createdAt: number
}

export type GoalCategory = 'workout' | 'nutrition' | 'weight' | 'custom'
export type GoalKind = 'recurring' | 'once'
export type GoalPeriod = 'daily' | 'weekly' | 'monthly'

export interface Goal {
  id?: number
  title: string
  category: GoalCategory
  kind: GoalKind
  /** Required when kind === 'recurring'; the window progress resets on. */
  period?: GoalPeriod
  targetValue: number
  unit: string
  deadline?: string // YYYY-MM-DD, only meaningful for kind === 'once'
  createdAt: number
  completedAt?: number
}

/** A logged contribution toward a goal (e.g. "+0.5L water"). Progress is the sum of entries in the active window. */
export interface GoalEntry {
  id?: number
  goalId: number
  amount: number
  date: string // YYYY-MM-DD
  createdAt: number
}

export interface Habit {
  id?: number
  title: string
  icon?: string
  createdAt: number
  archivedAt?: number
}

export interface HabitLog {
  id?: number
  habitId: number
  date: string // YYYY-MM-DD
  completed: boolean
}

export interface BodyMetric {
  id?: number
  date: string // YYYY-MM-DD
  weightKg: number
  createdAt: number
}

export interface AppSetting {
  key: string
  value: number
}
