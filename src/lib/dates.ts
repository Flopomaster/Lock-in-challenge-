export function todayStr(): string {
  return toDateStr(new Date())
}

export function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toDateStr(d)
}

export function daysAgoRange(days: number): { from: string; to: string } {
  return { from: addDays(todayStr(), -(days - 1)), to: todayStr() }
}

export function formatHebrewDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
}

/** Start date (YYYY-MM-DD) of the current daily/weekly/monthly window, weeks starting Sunday. */
export function periodStart(period: 'daily' | 'weekly' | 'monthly'): string {
  const now = new Date()
  if (period === 'daily') return todayStr()
  if (period === 'weekly') {
    const d = new Date(now)
    d.setDate(d.getDate() - d.getDay())
    return toDateStr(d)
  }
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

/** Approximate day-count of each period, used to rescale a goal's target across periods. */
export const PERIOD_DAYS: Record<'daily' | 'weekly' | 'monthly', number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
}

/** Converts a target set for `fromPeriod` into the equivalent target for `toPeriod` (e.g. 4L/day -> 28L/week). */
export function scaleTarget(
  target: number,
  fromPeriod: 'daily' | 'weekly' | 'monthly',
  toPeriod: 'daily' | 'weekly' | 'monthly',
): number {
  const scaled = target * (PERIOD_DAYS[toPeriod] / PERIOD_DAYS[fromPeriod])
  return Math.round(scaled * 100) / 100
}

/** Longest current streak of consecutive days (ending today or yesterday) with a truthy entry in `doneDates`. */
export function computeStreak(doneDates: Set<string>): number {
  let streak = 0
  let cursor = todayStr()
  // Allow the streak to still count if today isn't logged yet but yesterday was.
  if (!doneDates.has(cursor)) {
    cursor = addDays(cursor, -1)
  }
  while (doneDates.has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}
