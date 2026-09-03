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

export interface Meal {
  id?: number
  date: string // YYYY-MM-DD
  time?: string
  name: string
  calories: number
  protein?: number
  carbs?: number
  fat?: number
  createdAt: number
}

export type GoalCategory = 'workout' | 'nutrition' | 'weight' | 'custom'

export interface Goal {
  id?: number
  title: string
  category: GoalCategory
  targetValue: number
  currentValue: number
  unit: string
  deadline?: string // YYYY-MM-DD
  createdAt: number
  completedAt?: number
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
