'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveTrainingAttempt(
  soldierId: string,
  trainingTypeId: string,
  value: number | boolean
) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('לא מאומת')
  }

  // Verify user has access to this soldier's class
  const { data: soldier, error: soldierError } = await supabase
    .from('soldiers')
    .select('class_id, classes(department_id, departments(company_id))')
    .eq('id', soldierId)
    .single()

  if (soldierError || !soldier) {
    throw new Error('חייל לא נמצא')
  }

  const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role, class_id, department_id, company_id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !userProfile) {
    throw new Error('פרופיל משתמש לא נמצא')
  }

  // Check access based on role
  const hasAccess =
    userProfile.role === 'system_admin' ||
    (userProfile.role === 'class' && userProfile.class_id === soldier.class_id) ||
    (userProfile.role === 'department' &&
      userProfile.department_id === (soldier.classes as any)?.department_id) ||
    (userProfile.role === 'company' &&
      userProfile.company_id === (soldier.classes as any)?.departments?.company_id)

  if (!hasAccess) {
    throw new Error('אין הרשאה לערוך חייל זה')
  }

  // Get training type details
  const { data: trainingType, error: typeError } = await supabase
    .from('training_types')
    .select('unit_type')
    .eq('id', trainingTypeId)
    .single()

  if (typeError || !trainingType) {
    throw new Error('סוג אימון לא נמצא')
  }

  // Validate value type matches unit_type
  if (trainingType.unit_type === 'boolean' && typeof value !== 'boolean') {
    throw new Error('ערך חייב להיות בוליאני')
  }

  if ((trainingType.unit_type === 'seconds' || trainingType.unit_type === 'score') && typeof value !== 'number') {
    throw new Error('ערך חייב להיות מספרי')
  }

  // Check if there's an existing session for today
  const today = new Date().toISOString().split('T')[0]

  const { data: existingSession, error: sessionError } = await supabase
    .from('training_sessions')
    .select('id, attempts')
    .eq('training_type_id', trainingTypeId)
    .eq('soldier_id', soldierId)
    .eq('session_date', today)
    .maybeSingle()

  if (sessionError && sessionError.code !== 'PGRST116') {
    throw new Error('שגיאה בשליפת נתוני אימון')
  }

  if (existingSession) {
    // Update existing session - add attempt
    const attempts = existingSession.attempts || []
    const newAttempts = [...attempts, value]

    // Recalculate best and avgAfterBest
    const { best, avgAfterBest, pass } = calculateSessionMetrics(
      newAttempts,
      trainingType.unit_type as 'seconds' | 'boolean' | 'score'
    )

    const { error: updateError } = await supabase
      .from('training_sessions')
      .update({
        attempts: newAttempts,
        best,
        avg_after_best: avgAfterBest,
        pass,
      })
      .eq('id', existingSession.id)

    if (updateError) {
      throw new Error('שגיאה בעדכון אימון')
    }
  } else {
    // Create new session
    const attempts = [value]
    const { best, avgAfterBest, pass } = calculateSessionMetrics(
      attempts,
      trainingType.unit_type as 'seconds' | 'boolean' | 'score'
    )

    const { error: insertError } = await supabase.from('training_sessions').insert({
      training_type_id: trainingTypeId,
      soldier_id: soldierId,
      session_date: today,
      attempts,
      best,
      avg_after_best: avgAfterBest,
      pass,
      created_by: user.id,
    })

    if (insertError) {
      throw new Error('שגיאה ביצירת אימון')
    }
  }

  revalidatePath('/data-entry')
  return { success: true }
}

function calculateSessionMetrics(
  attempts: (number | boolean)[],
  unitType: 'seconds' | 'boolean' | 'score'
): {
  best: number | boolean | null
  avgAfterBest: number | null
  pass: boolean
} {
  if (attempts.length === 0) {
    return { best: null, avgAfterBest: null, pass: false }
  }

  if (unitType === 'boolean') {
    // For boolean, best is if any attempt is true
    const best = attempts.some((a) => a === true)
    return { best, avgAfterBest: null, pass: best }
  }

  // For numeric types (seconds, score)
  const numericAttempts = attempts.filter((a) => typeof a === 'number') as number[]

  if (numericAttempts.length === 0) {
    return { best: null, avgAfterBest: null, pass: false }
  }

  // Best is minimum (for seconds where lower is better)
  // Note: This assumes is_lower_better = true for seconds
  // For more complex logic, fetch training_type.is_lower_better
  const best = Math.min(...numericAttempts)

  // Calculate avgAfterBest (average after removing one instance of best)
  let avgAfterBest: number | null = null
  if (numericAttempts.length > 1) {
    const firstBestIndex = numericAttempts.indexOf(best)
    const attemptsWithoutOneBest = [
      ...numericAttempts.slice(0, firstBestIndex),
      ...numericAttempts.slice(firstBestIndex + 1),
    ]

    if (attemptsWithoutOneBest.length > 0) {
      const sum = attemptsWithoutOneBest.reduce((acc, val) => acc + val, 0)
      avgAfterBest = Math.round((sum / attemptsWithoutOneBest.length) * 10) / 10
    }
  }

  // For now, assume pass = true if there's a best value
  // In production, compare against threshold from training_thresholds table
  const pass = best !== null

  return { best, avgAfterBest, pass }
}
