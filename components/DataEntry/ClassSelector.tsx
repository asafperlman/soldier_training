'use client'

import { useState } from 'react'
import { Button } from '@/components/Common'
import { EMPTY_STATES, VALIDATION_MESSAGES } from '@/lib/constants'
import { EmptyState } from '@/components/Common/EmptyState'

interface Class {
  id: string
  name: string
}

interface ClassSelectorProps {
  classes: Class[]
  lockedClassId?: string | null  // For מכ״י role - locked to their class
  lockedClassName?: string | null
  trainingTypeName: string
  onBack: () => void
  onNext: (classId: string, className: string) => void
}

export function ClassSelector({
  classes,
  lockedClassId,
  lockedClassName,
  trainingTypeName,
  onBack,
  onNext,
}: ClassSelectorProps) {
  const [selectedClassId, setSelectedClassId] = useState(lockedClassId || '')
  const [error, setError] = useState('')

  const isLocked = !!lockedClassId

  const handleNext = () => {
    if (!selectedClassId) {
      setError(VALIDATION_MESSAGES.SELECT_CLASS)
      return
    }

    const className = isLocked
      ? lockedClassName!
      : classes.find((c) => c.id === selectedClassId)?.name || ''

    onNext(selectedClassId, className)
  }

  // Auto-proceed for locked class (מכ״י)
  if (isLocked && lockedClassId && lockedClassName) {
    // Auto-proceed after a brief moment to show the selection
    setTimeout(() => {
      onNext(lockedClassId, lockedClassName)
    }, 300)

    return (
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold text-center">בחר כיתה</h1>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">כיתה שלך:</p>
          <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{lockedClassName}</p>
        </div>

        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (classes.length === 0) {
    return (
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold text-center">בחר כיתה</h1>
        <EmptyState message={EMPTY_STATES.NO_CLASSES} />
        <div className="flex justify-center">
          <Button onClick={onBack} variant="secondary">
            חזרה
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">בחר כיתה</h1>

      <div className="bg-gray-50 dark:bg-gray-800 border border-border rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">סוג אימון:</p>
        <p className="text-lg font-semibold">{trainingTypeName}</p>
      </div>

      <div>
        <label htmlFor="class-select" className="block mb-2 text-sm font-medium">
          בחר כיתה <span className="text-error">*</span>
        </label>
        <select
          id="class-select"
          value={selectedClassId}
          onChange={(e) => {
            setSelectedClassId(e.target.value)
            setError('')
          }}
          className="
            touch-target block w-full
            px-3 py-3 text-base
            border rounded-lg
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            border-input-border focus:border-primary
            bg-background
          "
        >
          <option value="">-- בחר כיתה --</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
        {error && <p className="mt-2 text-sm text-error">{error}</p>}
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="secondary" fullWidth>
          חזרה
        </Button>
        <Button onClick={handleNext} variant="primary" fullWidth disabled={!selectedClassId}>
          המשך
        </Button>
      </div>
    </div>
  )
}
