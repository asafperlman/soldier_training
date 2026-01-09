import { createClient } from '@/lib/supabase/server'
import { EXCEPTIONS_CONFIG } from '@/lib/constants'

/**
 * Get summary statistics for dashboard cards
 */
export async function getSummaryStats(scope: {
  role: string
  company_id?: string | null
  department_id?: string | null
  class_id?: string | null
}) {
  const supabase = await createClient()

  // Calculate date range (last 30 days)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - EXCEPTIONS_CONFIG.rollingDays)

  // Build base query based on scope
  let sessionsQuery = supabase
    .from('training_sessions')
    .select('id, training_type_id, class_id')
    .gte('session_at', startDate.toISOString())

  // Apply scope filters
  if (scope.role === 'company' && scope.company_id) {
    sessionsQuery = sessionsQuery.eq('company_id', scope.company_id)
  } else if (scope.role === 'department' && scope.department_id) {
    sessionsQuery = sessionsQuery.eq('department_id', scope.department_id)
  } else if (scope.role === 'class' && scope.class_id) {
    sessionsQuery = sessionsQuery.eq('class_id', scope.class_id)
  }

  const { data: sessions } = await sessionsQuery

  // Count unique soldiers trained
  const uniqueSoldiers = new Set<string>()
  if (sessions) {
    for (const session of sessions) {
      const { data: attempts } = await supabase
        .from('training_attempts')
        .select('soldier_id')
        .eq('session_id', session.id)

      if (attempts) {
        attempts.forEach((a) => uniqueSoldiers.add(a.soldier_id))
      }
    }
  }

  return {
    totalSessions: sessions?.length || 0,
    uniqueSoldiersTrained: uniqueSoldiers.size,
  }
}

/**
 * Calculate average pass rate across all trainings
 */
export async function getAveragePassRate(scope: {
  role: string
  company_id?: string | null
  department_id?: string | null
  class_id?: string | null
}) {
  const supabase = await createClient()

  // Get all training types with requirements
  const { data: trainingTypes } = await supabase
    .from('training_types')
    .select('id, unit, requirements(rule_type, threshold_int)')

  if (!trainingTypes) return 0

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - EXCEPTIONS_CONFIG.rollingDays)

  let totalPass = 0
  let totalAttempts = 0

  for (const trainingType of trainingTypes) {
    const requirement = trainingType.requirements?.[0]
    if (!requirement) continue

    // Get sessions for this training type in scope
    let sessionsQuery = supabase
      .from('training_sessions')
      .select('id')
      .eq('training_type_id', trainingType.id)
      .gte('session_at', startDate.toISOString())

    if (scope.role === 'company' && scope.company_id) {
      sessionsQuery = sessionsQuery.eq('company_id', scope.company_id)
    } else if (scope.role === 'department' && scope.department_id) {
      sessionsQuery = sessionsQuery.eq('department_id', scope.department_id)
    } else if (scope.role === 'class' && scope.class_id) {
      sessionsQuery = sessionsQuery.eq('class_id', scope.class_id)
    }

    const { data: sessions } = await sessionsQuery

    if (sessions) {
      for (const session of sessions) {
        const { data: attempts } = await supabase
          .from('training_attempts')
          .select('soldier_id, value_seconds, value_bool')
          .eq('session_id', session.id)

        if (attempts) {
          // Group attempts by soldier and calculate best
          const soldierBest = new Map<string, number | boolean>()

          attempts.forEach((attempt) => {
            const key = attempt.soldier_id
            const value =
              trainingType.unit === 'seconds'
                ? attempt.value_seconds
                : attempt.value_bool

            if (trainingType.unit === 'seconds' && typeof value === 'number') {
              const current = soldierBest.get(key) as number | undefined
              if (current === undefined || value < current) {
                soldierBest.set(key, value)
              }
            } else if (trainingType.unit === 'boolean') {
              soldierBest.set(key, value as boolean)
            }
          })

          // Check pass/fail for each soldier
          soldierBest.forEach((best) => {
            totalAttempts++
            let passed = false

            if (requirement.rule_type === 'max_seconds' && typeof best === 'number') {
              passed = best <= (requirement.threshold_int || 0)
            } else if (requirement.rule_type === 'must_be_true') {
              passed = best === true
            }

            if (passed) totalPass++
          })
        }
      }
    }
  }

  return totalAttempts > 0 ? Math.round((totalPass / totalAttempts) * 100) : 0
}

/**
 * Get per-training metrics for dashboard table
 */
export async function getTrainingMetrics(scope: {
  role: string
  company_id?: string | null
  department_id?: string | null
  class_id?: string | null
}) {
  const supabase = await createClient()

  const { data: trainingTypes } = await supabase
    .from('training_types')
    .select('id, name, unit, requirements(rule_type, threshold_int)')

  if (!trainingTypes) return []

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - EXCEPTIONS_CONFIG.rollingDays)

  const metrics = []

  for (const trainingType of trainingTypes) {
    const requirement = trainingType.requirements?.[0]

    let sessionsQuery = supabase
      .from('training_sessions')
      .select('id')
      .eq('training_type_id', trainingType.id)
      .gte('session_at', startDate.toISOString())

    if (scope.role === 'company' && scope.company_id) {
      sessionsQuery = sessionsQuery.eq('company_id', scope.company_id)
    } else if (scope.role === 'department' && scope.department_id) {
      sessionsQuery = sessionsQuery.eq('department_id', scope.department_id)
    } else if (scope.role === 'class' && scope.class_id) {
      sessionsQuery = sessionsQuery.eq('class_id', scope.class_id)
    }

    const { data: sessions } = await sessionsQuery

    let totalPass = 0
    let totalFail = 0
    let sumBest = 0
    let countBest = 0

    if (sessions) {
      for (const session of sessions) {
        const { data: attempts } = await supabase
          .from('training_attempts')
          .select('soldier_id, value_seconds, value_bool')
          .eq('session_id', session.id)

        if (attempts) {
          const soldierBest = new Map<string, number | boolean>()

          attempts.forEach((attempt) => {
            const key = attempt.soldier_id
            const value =
              trainingType.unit === 'seconds'
                ? attempt.value_seconds
                : attempt.value_bool

            if (trainingType.unit === 'seconds' && typeof value === 'number') {
              const current = soldierBest.get(key) as number | undefined
              if (current === undefined || value < current) {
                soldierBest.set(key, value)
              }
            } else if (trainingType.unit === 'boolean') {
              soldierBest.set(key, value as boolean)
            }
          })

          soldierBest.forEach((best) => {
            let passed = false

            if (requirement?.rule_type === 'max_seconds' && typeof best === 'number') {
              passed = best <= (requirement.threshold_int || 0)
              sumBest += best
              countBest++
            } else if (requirement?.rule_type === 'must_be_true') {
              passed = best === true
            }

            if (passed) {
              totalPass++
            } else {
              totalFail++
            }
          })
        }
      }
    }

    const total = totalPass + totalFail
    const passRate = total > 0 ? Math.round((totalPass / total) * 100) : 0
    const avgBest =
      trainingType.unit === 'seconds' && countBest > 0
        ? (sumBest / countBest).toFixed(1)
        : null

    metrics.push({
      name: trainingType.name,
      sessions: sessions?.length || 0,
      avgBest,
      passRate,
      failed: totalFail,
    })
  }

  return metrics
}
