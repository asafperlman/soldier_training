'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TrainingTypeGrid } from '@/components/DataEntry/TrainingTypeGrid'
import { ClassSelector } from '@/components/DataEntry/ClassSelector'
import { SoldierEntryList } from '@/components/DataEntry/SoldierEntryList'
import { saveTrainingAttempt } from './actions'

type Step = 'training-type' | 'class-selection' | 'soldier-entry'

interface Activity {
  id: string
  name_he: string
  icon: string | null
  required_time_seconds: number
}

interface Class {
  id: string
  name: string
}

interface Soldier {
  id: string
  name: string
}

interface UserProfile {
  role: string
  class_id: string | null
  department_id: string | null
  company_id: string | null
}

export default function DataEntryPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('training-type')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // User data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // Step 1 data
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)

  // Step 2 data
  const [availableClasses, setAvailableClasses] = useState<Class[]>([])
  const [lockedClass, setLockedClass] = useState<{ id: string; name: string } | null>(null)
  const [selectedClass, setSelectedClass] = useState<{ id: string; name: string } | null>(null)

  // Step 3 data
  const [soldiers, setSoldiers] = useState<Soldier[]>([])

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        // Get current user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          router.push('/login')
          return
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role, class_id, department_id, company_id, classes(name)')
          .eq('user_id', user.id)
          .single()

        if (profileError || !profile) {
          setError('פרופיל משתמש לא נמצא')
          return
        }

        setUserProfile(profile)

        // Get active company activities (scoped to user's company)
        if (!profile.company_id && profile.role !== 'system_admin') {
          setError('לא נמצא מזהה פלוגה')
          return
        }

        let activitiesQuery = supabase
          .from('company_activities')
          .select('id, name_he, icon, required_time_seconds')
          .eq('is_active', true)
          .order('name_he')

        // Scope to company (except system_admin who sees all)
        if (profile.role !== 'system_admin' && profile.company_id) {
          activitiesQuery = activitiesQuery.eq('company_id', profile.company_id)
        }

        const { data: activitiesData, error: activitiesError } = await activitiesQuery

        if (activitiesError) {
          setError('שגיאה בטעינת פעילויות')
          return
        }

        setActivities(activitiesData || [])

        // If user is מכ״י (class leader), lock to their class
        if (profile.role === 'class' && profile.class_id) {
          const classesData = profile.classes as any
          setLockedClass({
            id: profile.class_id,
            name: Array.isArray(classesData) ? classesData[0]?.name : classesData?.name || '',
          })
        } else {
          // Load classes based on role scope
          await loadAvailableClasses(profile)
        }

        setIsLoading(false)
      } catch (err: any) {
        setError(err.message || 'שגיאה בטעינת נתונים')
        setIsLoading(false)
      }
    }

    loadData()
  }, [router, supabase])

  async function loadAvailableClasses(profile: UserProfile) {
    let query = supabase.from('classes').select('id, name').order('name')

    if (profile.role === 'department' && profile.department_id) {
      query = query.eq('department_id', profile.department_id)
    } else if (profile.role === 'company' && profile.company_id) {
      // Get all classes in departments that belong to this company
      const { data: departments } = await supabase
        .from('departments')
        .select('id')
        .eq('company_id', profile.company_id)

      if (departments) {
        const deptIds = departments.map((d) => d.id)
        query = query.in('department_id', deptIds)
      }
    }
    // system_admin sees all classes (no filter)

    const { data: classes, error } = await query

    if (error) {
      console.error('Error loading classes:', error)
      return
    }

    setAvailableClasses(classes || [])
  }

  async function loadSoldiers(classId: string) {
    const { data, error } = await supabase
      .from('soldiers')
      .select('id, name')
      .eq('class_id', classId)
      .order('name')

    if (error) {
      setError('שגיאה בטעינת חיילים')
      return
    }

    setSoldiers(data || [])
  }

  // Step 1: Select activity
  function handleActivitySelect(activity: Activity) {
    setSelectedActivity(activity)
    setStep('class-selection')
  }

  // Step 2: Select class
  async function handleClassSelect(classId: string, className: string) {
    setSelectedClass({ id: classId, name: className })
    await loadSoldiers(classId)
    setStep('soldier-entry')
  }

  // Step 3: Save soldier attempt
  async function handleSaveSoldierAttempt(soldierId: string, value: number | boolean) {
    if (!selectedActivity) return

    await saveTrainingAttempt(soldierId, selectedActivity.id, value)
  }

  // Navigation
  function handleBackToActivities() {
    setStep('training-type')
    setSelectedActivity(null)
    setSelectedClass(null)
    setSoldiers([])
  }

  function handleBackToClassSelection() {
    setStep('class-selection')
    setSelectedClass(null)
    setSoldiers([])
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-error text-lg mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            חזרה לדף הבית
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {step === 'training-type' && (
        <TrainingTypeGrid activities={activities} onSelect={handleActivitySelect} />
      )}

      {step === 'class-selection' && selectedActivity && (
        <ClassSelector
          classes={availableClasses}
          lockedClassId={lockedClass?.id}
          lockedClassName={lockedClass?.name}
          trainingTypeName={selectedActivity.name_he}
          onBack={handleBackToActivities}
          onNext={handleClassSelect}
        />
      )}

      {step === 'soldier-entry' && selectedActivity && selectedClass && (
        <SoldierEntryList
          soldiers={soldiers}
          className={selectedClass.name}
          trainingTypeName={selectedActivity.name_he}
          trainingTypeId={selectedActivity.id}
          unitType="seconds"
          onBack={handleBackToClassSelection}
          onSave={handleSaveSoldierAttempt}
        />
      )}
    </div>
  )
}
