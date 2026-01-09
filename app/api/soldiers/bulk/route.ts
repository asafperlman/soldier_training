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
    const { departmentId, classId, names } = body

    // Validate input
    if (!departmentId || !classId || !names || !Array.isArray(names) || names.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get class and department details to extract company_id
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(
        `
        id,
        department_id,
        departments!inner (
          id,
          company_id
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

    const companyId = (classData.departments as any).company_id

    // Create soldiers
    const soldiers = names.map((name: string) => ({
      full_name: name.trim(),
      company_id: companyId,
      department_id: departmentId,
      class_id: classId,
      status: 'active',
    }))

    const { data, error } = await supabase
      .from('soldiers')
      .insert(soldiers)
      .select()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create soldiers: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: data.length,
      soldiers: data,
    })
  } catch (err) {
    console.error('Error creating soldiers:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
