/**
 * Data entry computation helpers
 * These functions run on the client for live updates
 */

export interface AttemptData {
  attemptNo: number
  value: number | boolean
}

export interface SoldierResult {
  soldierId: string
  attempts: AttemptData[]
  best?: number | boolean
  avgAfterBest?: number | null
  passed?: boolean
}

/**
 * Calculate best time (minimum) from attempts
 */
export function calculateBest(attempts: number[]): number | null {
  if (attempts.length === 0) return null
  return Math.min(...attempts)
}

/**
 * Calculate average after removing best (minimum)
 * Returns null if only 1 attempt
 */
export function calculateAvgAfterBest(attempts: number[]): number | null {
  if (attempts.length <= 1) return null

  const best = Math.min(...attempts)
  const remaining = attempts.filter((a) => a !== best || attempts.filter((x) => x === best).length > 1)

  // Remove only one instance of the best
  const firstBestIndex = attempts.indexOf(best)
  const attemptsWithoutOneBest = [
    ...attempts.slice(0, firstBestIndex),
    ...attempts.slice(firstBestIndex + 1)
  ]

  if (attemptsWithoutOneBest.length === 0) return null

  const sum = attemptsWithoutOneBest.reduce((acc, val) => acc + val, 0)
  return Math.round((sum / attemptsWithoutOneBest.length) * 10) / 10
}

/**
 * Check if soldier passed based on requirement
 */
export function checkPassed(
  best: number | boolean | null,
  ruleType: 'max_seconds' | 'must_be_true',
  threshold?: number | null
): boolean {
  if (best === null || best === undefined) return false

  if (ruleType === 'max_seconds' && typeof best === 'number') {
    return best <= (threshold || 0)
  }

  if (ruleType === 'must_be_true') {
    return best === true
  }

  return false
}

/**
 * Validate training session data before submission
 */
export function validateSessionData(data: {
  trainingTypeId: string
  classId: string
  sessionAt: string
  results: Array<{ soldierId: string; attempts: (number | boolean)[] }>
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.trainingTypeId) {
    errors.push('נא לבחור סוג אימון')
  }

  if (!data.classId) {
    errors.push('נא לבחור כיתה')
  }

  if (!data.sessionAt) {
    errors.push('נא להזין תאריך ושעה')
  }

  if (data.results.length === 0) {
    errors.push('נא להזין תוצאות לפחות לחייל אחד')
  }

  // Check that all soldiers have at least one attempt
  const missingData = data.results.filter((r) => r.attempts.length === 0)
  if (missingData.length > 0) {
    errors.push(`חסרים נתונים עבור ${missingData.length} חיילים`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Format time in seconds to MM:SS display
 */
export function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
