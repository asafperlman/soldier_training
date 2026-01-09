import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    // Get authenticated user
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { trainingTypeId, classId, sessionAt, notes, results } = body

    // Validate input
    if (!trainingTypeId || !classId || !sessionAt || !results || results.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get class details to extract hierarchy IDs
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(
        `
        id,
        department_id,
        departments!inner (
          id,
          company_id,
          companies!inner (
            id,
            magama_id
          )
        )
      `
      )
      .eq('id', classId)
      .single()

    if (classError || !classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    const departmentId = classData.department_id
    const companyId = (classData.departments as any).company_id
    const magamaId = (classData.departments as any).companies.magama_id

    // Create training session
    const { data: session, error: sessionError } = await supabase
      .from('training_sessions')
      .insert({
        training_type_id: trainingTypeId,
        class_id: classId,
        department_id: departmentId,
        company_id: companyId,
        magama_id: magamaId,
        session_at: sessionAt,
        created_by: user.id,
        notes: notes || null,
      })
      .select()
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Failed to create session: ' + sessionError?.message },
        { status: 500 }
      )
    }

    // Create training attempts for each soldier
    const attempts = []
    for (const result of results) {
      const { soldierId, attempts: soldierAttempts } = result

      for (let i = 0; i < soldierAttempts.length; i++) {
        const value = soldierAttempts[i]
        attempts.push({
          session_id: session.id,
          soldier_id: soldierId,
          attempt_no: i + 1,
          value_seconds: typeof value === 'number' ? value : null,
          value_bool: typeof value === 'boolean' ? value : null,
        })
      }
    }

    const { error: attemptsError } = await supabase
      .from('training_attempts')
      .insert(attempts)

    if (attemptsError) {
      // Rollback: delete the session
      await supabase.from('training_sessions').delete().eq('id', session.id)

      return NextResponse.json(
        { error: 'Failed to create attempts: ' + attemptsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, sessionId: session.id })
  } catch (err) {
    console.error('Error creating training session:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
