import { createClient } from '@/lib/supabase/server'
import { EXCEPTIONS_CONFIG } from '@/lib/constants'

export type ExceptionType =
  | 'failed_requirement'
  | 'below_class_avg'
  | 'below_dept_avg'
  | 'missing_practice'
  | 'no_recent_data'

export type ExceptionSeverity = 'high' | 'medium' | 'low'

export interface Exception {
  type: ExceptionType
  severity: ExceptionSeverity
  details: string
  trainingTypeName: string
  trainingTypeId: string
}

export interface SoldierException {
  soldierId: string
  soldierName: string
  className: string
  classId: string
  departmentName: string
  departmentId: string
  exceptions: Exception[]
  highestSeverity: ExceptionSeverity
}

/**
 * Compute all exceptions for soldiers in scope
 */
export async function computeExceptions(params: {
  departmentId?: string
  classId?: string
  trainingTypeId?: string
  startDate?: string
  endDate?: string
}): Promise<SoldierException[]> {
  const supabase = await createClient()

  // Calculate cutoff date
  const cutoffDate = params.startDate
    ? new Date(params.startDate)
    : new Date(Date.now() - EXCEPTIONS_CONFIG.rollingDays * 24 * 60 * 60 * 1000)

  // Build soldiers query
  let soldiersQuery = supabase
    .from('soldiers')
    .select(`
      id,
      full_name,
      class_id,
      department_id,
      classes!inner(id, name, department_id, departments!inner(id, name))
    `)
    .eq('status', 'active')

  if (params.classId) {
    soldiersQuery = soldiersQuery.eq('class_id', params.classId)
  } else if (params.departmentId) {
    soldiersQuery = soldiersQuery.eq('department_id', params.departmentId)
  }

  const { data: soldiers, error: soldiersError } = await soldiersQuery

  if (soldiersError || !soldiers) {
    console.error('Error fetching soldiers:', soldiersError)
    return []
  }

  // Get training types
  let trainingTypesQuery = supabase
    .from('training_types')
    .select('id, key, name, unit, requirements(rule_type, threshold_int)')

  if (params.trainingTypeId) {
    trainingTypesQuery = trainingTypesQuery.eq('id', params.trainingTypeId)
  }

  const { data: trainingTypes } = await trainingTypesQuery

  if (!trainingTypes) return []

  const allExceptions: SoldierException[] = []

  for (const soldier of soldiers) {
    const soldierExceptions: Exception[] = []
    const classData = (soldier as any).classes
    const deptData = classData.departments

    for (const trainingType of trainingTypes) {
      const requirement = trainingType.requirements?.[0]
      if (!requirement) continue

      if (trainingType.unit === 'seconds') {
        // Get soldier's best time using SQL function
        const { data: bestData } = await supabase.rpc('get_soldier_best', {
          p_soldier_id: soldier.id,
          p_training_type_id: trainingType.id,
          p_cutoff_date: cutoffDate.toISOString(),
        })

        const best = bestData as number | null

        if (best !== null) {
          // A) Check requirement failure
          if (requirement.rule_type === 'max_seconds' && best > (requirement.threshold_int || 0)) {
            soldierExceptions.push({
              type: 'failed_requirement',
              severity: 'high',
              details: `הטוב ביותר: ${best}s (דרוש: ≤${requirement.threshold_int}s)`,
              trainingTypeName: trainingType.name,
              trainingTypeId: trainingType.id,
            })
          }

          // B) Check below class average
          const { data: classAvgData } = await supabase.rpc('get_class_avg_best', {
            p_class_id: soldier.class_id,
            p_training_type_id: trainingType.id,
            p_cutoff_date: cutoffDate.toISOString(),
          })

          const classAvg = classAvgData as number | null

          if (classAvg !== null && best > classAvg + EXCEPTIONS_CONFIG.deltaSeconds) {
            soldierExceptions.push({
              type: 'below_class_avg',
              severity: 'medium',
              details: `הטוב ביותר: ${best}s | ממוצע הכיתה: ${classAvg.toFixed(1)}s | פער: +${(best - classAvg).toFixed(1)}s`,
              trainingTypeName: trainingType.name,
              trainingTypeId: trainingType.id,
            })
          }

          // C) Check below department average
          const { data: deptAvgData } = await supabase.rpc('get_dept_avg_best', {
            p_dept_id: soldier.department_id,
            p_training_type_id: trainingType.id,
            p_cutoff_date: cutoffDate.toISOString(),
          })

          const deptAvg = deptAvgData as number | null

          if (deptAvg !== null && best > deptAvg + EXCEPTIONS_CONFIG.deltaSeconds) {
            soldierExceptions.push({
              type: 'below_dept_avg',
              severity: 'medium',
              details: `הטוב ביותר: ${best}s | ממוצע המחלקה: ${deptAvg.toFixed(1)}s | פער: +${(best - deptAvg).toFixed(1)}s`,
              trainingTypeName: trainingType.name,
              trainingTypeId: trainingType.id,
            })
          }
        }

        // D) Check missing practice
        const { data: sessionCountData } = await supabase.rpc('get_soldier_session_count', {
          p_soldier_id: soldier.id,
          p_training_type_id: trainingType.id,
          p_cutoff_date: cutoffDate.toISOString(),
        })

        const sessionCount = sessionCountData as number || 0

        if (sessionCount === 0) {
          soldierExceptions.push({
            type: 'no_recent_data',
            severity: 'low',
            details: `לא בוצעו אימונים ב-${EXCEPTIONS_CONFIG.rollingDays} יום האחרונים`,
            trainingTypeName: trainingType.name,
            trainingTypeId: trainingType.id,
          })
        } else {
          // Check against department average
          const { data: deptAvgSessionsData } = await supabase.rpc('get_dept_avg_session_count', {
            p_dept_id: soldier.department_id,
            p_training_type_id: trainingType.id,
            p_cutoff_date: cutoffDate.toISOString(),
          })

          const deptAvgSessions = deptAvgSessionsData as number | null

          if (deptAvgSessions !== null && sessionCount < deptAvgSessions * EXCEPTIONS_CONFIG.missingFactor) {
            soldierExceptions.push({
              type: 'missing_practice',
              severity: 'low',
              details: `הפעלות: ${sessionCount} | ממוצע מחלקה: ${deptAvgSessions.toFixed(1)} | פער: -${(deptAvgSessions - sessionCount).toFixed(1)} (${((1 - sessionCount / deptAvgSessions) * 100).toFixed(0)}%)`,
              trainingTypeName: trainingType.name,
              trainingTypeId: trainingType.id,
            })
          }
        }
      } else if (trainingType.unit === 'boolean') {
        // For boolean trainings, check if last attempt was false
        const { data: lastAttempt } = await supabase
          .from('training_attempts')
          .select('value_bool, training_sessions!inner(session_at, training_type_id)')
          .eq('soldier_id', soldier.id)
          .eq('training_sessions.training_type_id', trainingType.id)
          .gte('training_sessions.session_at', cutoffDate.toISOString())
          .order('training_sessions.session_at', { ascending: false })
          .limit(1)
          .single()

        if (lastAttempt && lastAttempt.value_bool === false) {
          soldierExceptions.push({
            type: 'failed_requirement',
            severity: 'high',
            details: 'לא עבר את האימון (ערך: לא)',
            trainingTypeName: trainingType.name,
            trainingTypeId: trainingType.id,
          })
        }
      }
    }

    if (soldierExceptions.length > 0) {
      const highestSeverity = soldierExceptions.some((e) => e.severity === 'high')
        ? 'high'
        : soldierExceptions.some((e) => e.severity === 'medium')
        ? 'medium'
        : 'low'

      allExceptions.push({
        soldierId: soldier.id,
        soldierName: soldier.full_name,
        className: classData.name,
        classId: soldier.class_id,
        departmentName: deptData.name,
        departmentId: soldier.department_id,
        exceptions: soldierExceptions,
        highestSeverity,
      })
    }
  }

  return allExceptions
}

/**
 * Get recent training history for a soldier
 */
export async function getSoldierHistory(soldierId: string, limit = 10) {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('training_sessions')
    .select(`
      id,
      session_at,
      training_types(id, name, unit),
      requirements(rule_type, threshold_int)
    `)
    .eq('training_attempts.soldier_id', soldierId)
    .order('session_at', { ascending: false })
    .limit(limit)

  if (!sessions) return []

  const history = []

  for (const session of sessions) {
    const { data: attempts } = await supabase
      .from('training_attempts')
      .select('attempt_no, value_seconds, value_bool')
      .eq('session_id', session.id)
      .eq('soldier_id', soldierId)
      .order('attempt_no')

    if (!attempts || attempts.length === 0) continue

    const trainingType = (session as any).training_types
    const requirement = (session as any).requirements

    let best: number | boolean | null = null
    let avgAfterBest: number | null = null
    let passed = false

    if (trainingType.unit === 'seconds') {
      const values = attempts.map((a) => a.value_seconds!).filter((v) => v !== null)
      if (values.length > 0) {
        best = Math.min(...values)
        if (values.length > 1) {
          const firstBestIndex = values.indexOf(best)
          const withoutOne = [...values.slice(0, firstBestIndex), ...values.slice(firstBestIndex + 1)]
          if (withoutOne.length > 0) {
            avgAfterBest = withoutOne.reduce((sum, v) => sum + v, 0) / withoutOne.length
          }
        }
        passed = requirement && best <= (requirement.threshold_int || 0)
      }
    } else {
      best = attempts[0].value_bool!
      passed = best === true
    }

    history.push({
      sessionId: session.id,
      sessionAt: session.session_at,
      trainingName: trainingType.name,
      best,
      avgAfterBest,
      passed,
      attemptCount: attempts.length,
    })
  }

  return history
}
