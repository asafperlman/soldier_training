'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/Common/Button'
import { Select } from '@/components/Common/Select'
import { Input } from '@/components/Common/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Common/Card'
import { SoldierCard } from '@/components/Forms/SoldierCard'
import { validateSessionData } from '@/lib/data-entry'
import { Soldier, TrainingType, Requirement, Class } from '@/lib/supabase/types'
import { useRouter } from 'next/navigation'

interface DataEntryFormProps {
  trainingTypes: (TrainingType & { requirements: Requirement[] })[]
  classes: Class[]
  defaultClassId?: string
}

export function DataEntryForm({
  trainingTypes,
  classes,
  defaultClassId,
}: DataEntryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)

  // Form state
  const [trainingTypeId, setTrainingTypeId] = useState('')
  const [classId, setClassId] = useState(defaultClassId || '')
  const [sessionAt, setSessionAt] = useState(
    new Date().toISOString().slice(0, 16) // Format for datetime-local
  )
  const [notes, setNotes] = useState('')
  const [soldiers, setSoldiers] = useState<Soldier[]>([])
  const [soldierData, setSoldierData] = useState<Map<string, (number | boolean)[]>>(new Map())

  // Selected training type details
  const selectedTraining = trainingTypes.find((t) => t.id === trainingTypeId)
  const requirement = selectedTraining?.requirements?.[0]

  // Load soldiers when class changes
  const handleClassChange = async (newClassId: string) => {
    setClassId(newClassId)
    setSoldiers([])
    setSoldierData(new Map())

    if (!newClassId) return

    try {
      const response = await fetch(`/api/soldiers?classId=${newClassId}`)
      const data = await response.json()
      setSoldiers(data.soldiers || [])
    } catch (err) {
      setError('שגיאה בטעינת חיילים')
    }
  }

  // Handle soldier data changes
  const handleSoldierDataChange = useCallback(
    (soldierId: string, attempts: (number | boolean)[]) => {
      setSoldierData((prev) => {
        const newMap = new Map(prev)
        newMap.set(soldierId, attempts)
        return newMap
      })
    },
    []
  )

  // Bulk actions for boolean trainings
  const markAllYes = () => {
    if (selectedTraining?.unit !== 'boolean') return
    const newMap = new Map(soldierData)
    soldiers.forEach((s) => newMap.set(s.id, [true]))
    setSoldierData(newMap)
  }

  const markAllNo = () => {
    if (selectedTraining?.unit !== 'boolean') return
    const newMap = new Map(soldierData)
    soldiers.forEach((s) => newMap.set(s.id, [false]))
    setSoldierData(newMap)
  }

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Build results array
    const results = soldiers
      .filter((s) => soldierData.has(s.id) && soldierData.get(s.id)!.length > 0)
      .map((s) => ({
        soldierId: s.id,
        attempts: soldierData.get(s.id)!,
      }))

    // Validate
    const validation = validateSessionData({
      trainingTypeId,
      classId,
      sessionAt,
      results,
    })

    if (!validation.valid) {
      setError(validation.errors.join(', '))
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/training-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingTypeId,
          classId,
          sessionAt,
          notes,
          results,
        }),
      })

      if (!response.ok) {
        throw new Error('שגיאה בשמירת ההפעלה')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (err) {
      setError('שגיאה בשמירת ההפעלה. נסה שוב.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-success mb-2">ההפעלה נשמרה בהצלחה!</h2>
          <p className="text-gray-600">מעביר לדשבורד...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Session Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>פרטי הפעלה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-error rounded-lg text-error text-sm">
              {error}
            </div>
          )}

          <Select
            label="סוג אימון"
            required
            fullWidth
            value={trainingTypeId}
            onChange={(e) => setTrainingTypeId(e.target.value)}
            options={trainingTypes.map((t) => ({
              value: t.id,
              label: t.name,
            }))}
            placeholder="בחר סוג אימון"
          />

          <Select
            label="כיתה"
            required
            fullWidth
            value={classId}
            onChange={(e) => handleClassChange(e.target.value)}
            options={classes.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            placeholder="בחר כיתה"
          />

          <Input
            type="datetime-local"
            label="תאריך ושעה"
            required
            fullWidth
            value={sessionAt}
            onChange={(e) => setSessionAt(e.target.value)}
          />

          <div>
            <label className="block mb-1.5 text-sm font-medium text-foreground">
              הערות (אופציונלי)
            </label>
            <textarea
              className="touch-target block w-full px-3 py-2.5 text-base border border-input-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הערות על ההפעלה..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Soldier Results */}
      {soldiers.length > 0 && selectedTraining && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">תוצאות חיילים</h2>
            {selectedTraining.unit === 'boolean' && (
              <div className="flex gap-2">
                <Button type="button" variant="success" size="sm" onClick={markAllYes}>
                  סמן כולם כן
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={markAllNo}>
                  סמן כולם לא
                </Button>
              </div>
            )}
          </div>

          <div>
            {soldiers.map((soldier, index) => (
              <SoldierCard
                key={soldier.id}
                soldier={soldier}
                unit={selectedTraining.unit}
                ruleType={requirement?.rule_type || 'max_seconds'}
                threshold={requirement?.threshold_int}
                onDataChange={handleSoldierDataChange}
                autoFocus={index === 0}
              />
            ))}
          </div>
        </>
      )}

      {/* Submit Button */}
      {soldiers.length > 0 && (
        <div className="sticky bottom-0 bg-background border-t border-border pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={loading || soldiers.length === 0}
          >
            {loading ? 'שומר...' : 'שמור הפעלה'}
          </Button>
        </div>
      )}
    </form>
  )
}
