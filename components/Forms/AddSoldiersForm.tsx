'use client'

import { useState } from 'react'
import { Button } from '@/components/Common/Button'
import { Select } from '@/components/Common/Select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Common/Card'
import { Department, Class } from '@/lib/supabase/types'
import { useRouter } from 'next/navigation'

interface AddSoldiersFormProps {
  departments: Department[]
  classes: Class[]
  defaultDepartmentId?: string
  defaultClassId?: string
}

export function AddSoldiersForm({
  departments,
  classes,
  defaultDepartmentId,
  defaultClassId,
}: AddSoldiersFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [departmentId, setDepartmentId] = useState(defaultDepartmentId || '')
  const [classId, setClassId] = useState(defaultClassId || '')
  const [namesText, setNamesText] = useState('')

  // Parse names from textarea
  const parseNames = (): string[] => {
    return namesText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  }

  const parsedNames = parseNames()

  // Filter classes by selected department
  const filteredClasses = departmentId
    ? classes.filter((c) => c.department_id === departmentId)
    : classes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!departmentId || !classId) {
      setError('נא לבחור מחלקה וכיתה')
      return
    }

    if (parsedNames.length === 0) {
      setError('נא להזין לפחות שם אחד')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/soldiers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId,
          classId,
          names: parsedNames,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'שגיאה ביצירת חיילים')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/soldiers/list')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'שגיאה ביצירת חיילים')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-success mb-2">
            {parsedNames.length} חיילים נוספו בהצלחה!
          </h2>
          <p className="text-gray-600">מעביר לרשימת חיילים...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>בחירת מחלקה וכיתה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-error rounded-lg text-error text-sm">
              {error}
            </div>
          )}

          <Select
            label="מחלקה"
            required
            fullWidth
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value)
              setClassId('') // Reset class when department changes
            }}
            options={departments.map((d) => ({
              value: d.id,
              label: d.name,
            }))}
            placeholder="בחר מחלקה"
            disabled={!!defaultDepartmentId}
          />

          <Select
            label="כיתה"
            required
            fullWidth
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            options={filteredClasses.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            placeholder={departmentId ? 'בחר כיתה' : 'בחר מחלקה קודם'}
            disabled={!departmentId || !!defaultClassId}
          />
        </CardContent>
      </Card>

      {/* Names Input */}
      <Card>
        <CardHeader>
          <CardTitle>הדבקת שמות חיילים</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            הזן שם אחד בכל שורה. לדוגמה: ״ישראל כהן״
          </p>
        </CardHeader>
        <CardContent>
          <textarea
            className="touch-target block w-full px-3 py-2.5 text-base border border-input-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            rows={10}
            value={namesText}
            onChange={(e) => setNamesText(e.target.value)}
            placeholder="ישראל כהן&#10;דוד לוי&#10;משה אברהם"
            required
          />
          {parsedNames.length > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              {parsedNames.length} שמות זוהו
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {parsedNames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>תצוגה מקדימה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-start py-2 px-3">#</th>
                    <th className="text-start py-2 px-3">שם מלא</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedNames.map((name, idx) => (
                    <tr key={idx} className="border-b border-border">
                      <td className="py-2 px-3">{idx + 1}</td>
                      <td className="py-2 px-3">{name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={loading || parsedNames.length === 0}
      >
        {loading ? 'שומר...' : `שמור ${parsedNames.length} חיילים`}
      </Button>
    </form>
  )
}
