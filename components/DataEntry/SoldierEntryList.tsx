'use client'

import { useState, useCallback, useEffect } from 'react'
import { BackButton } from '@/components/Common/BackButton'
import { ScopeHeader } from '@/components/Common/ScopeHeader'
import { EmptyState } from '@/components/Common/EmptyState'
import {
  EMPTY_STATES,
  VALIDATION_MESSAGES,
  TRAINING_CONSTRAINTS,
  AUTO_SAVE_DEBOUNCE_MS,
  SUCCESS_INDICATOR_DURATION_MS,
} from '@/lib/constants'

interface Soldier {
  id: string
  name: string
}

interface SoldierEntryData {
  soldierId: string
  value: number | boolean | null
  isSaving: boolean
  showSuccess: boolean
  error: string | null
}

interface SoldierEntryListProps {
  soldiers: Soldier[]
  className: string
  trainingTypeName: string
  trainingTypeId: string
  unitType: 'seconds' | 'boolean' | 'score'
  onBack: () => void
  onSave: (soldierId: string, value: number | boolean) => Promise<void>
}

export function SoldierEntryList({
  soldiers,
  className,
  trainingTypeName,
  trainingTypeId,
  unitType,
  onBack,
  onSave,
}: SoldierEntryListProps) {
  const [entries, setEntries] = useState<Record<string, SoldierEntryData>>(() => {
    const initial: Record<string, SoldierEntryData> = {}
    soldiers.forEach((soldier) => {
      initial[soldier.id] = {
        soldierId: soldier.id,
        value: null,
        isSaving: false,
        showSuccess: false,
        error: null,
      }
    })
    return initial
  })

  const [saveTimeouts, setSaveTimeouts] = useState<Record<string, NodeJS.Timeout>>({})

  const validateValue = useCallback(
    (value: number | boolean | null): string | null => {
      if (value === null) return null

      if (unitType === 'boolean') return null

      const numValue = Number(value)
      if (isNaN(numValue)) {
        return VALIDATION_MESSAGES.INVALID_NUMBER
      }

      if (unitType === 'seconds') {
        if (numValue < TRAINING_CONSTRAINTS.SECONDS_MIN || numValue > TRAINING_CONSTRAINTS.SECONDS_MAX) {
          return VALIDATION_MESSAGES.VALUE_OUT_OF_RANGE(
            TRAINING_CONSTRAINTS.SECONDS_MIN,
            TRAINING_CONSTRAINTS.SECONDS_MAX
          )
        }
      } else if (unitType === 'score') {
        if (numValue < TRAINING_CONSTRAINTS.SCORE_MIN || numValue > TRAINING_CONSTRAINTS.SCORE_MAX) {
          return VALIDATION_MESSAGES.VALUE_OUT_OF_RANGE(
            TRAINING_CONSTRAINTS.SCORE_MIN,
            TRAINING_CONSTRAINTS.SCORE_MAX
          )
        }
      }

      return null
    },
    [unitType]
  )

  const handleSave = useCallback(
    async (soldierId: string, value: number | boolean) => {
      // Clear error
      setEntries((prev) => ({
        ...prev,
        [soldierId]: {
          ...prev[soldierId],
          error: null,
          isSaving: true,
        },
      }))

      try {
        await onSave(soldierId, value)

        // Show success indicator
        setEntries((prev) => ({
          ...prev,
          [soldierId]: {
            ...prev[soldierId],
            isSaving: false,
            showSuccess: true,
          },
        }))

        // Hide success indicator after delay
        setTimeout(() => {
          setEntries((prev) => ({
            ...prev,
            [soldierId]: {
              ...prev[soldierId],
              showSuccess: false,
            },
          }))
        }, SUCCESS_INDICATOR_DURATION_MS)
      } catch (error: any) {
        setEntries((prev) => ({
          ...prev,
          [soldierId]: {
            ...prev[soldierId],
            isSaving: false,
            error: error.message || VALIDATION_MESSAGES.SAVE_ERROR,
          },
        }))
      }
    },
    [onSave]
  )

  const handleValueChange = useCallback(
    (soldierId: string, value: number | boolean) => {
      // Validate
      const error = validateValue(value)

      setEntries((prev) => ({
        ...prev,
        [soldierId]: {
          ...prev[soldierId],
          value,
          error,
        },
      }))

      if (error) return

      // For boolean, save immediately
      if (unitType === 'boolean') {
        handleSave(soldierId, value)
        return
      }

      // For numbers, debounce save
      // Clear existing timeout
      if (saveTimeouts[soldierId]) {
        clearTimeout(saveTimeouts[soldierId])
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        handleSave(soldierId, value)
      }, AUTO_SAVE_DEBOUNCE_MS)

      setSaveTimeouts((prev) => ({
        ...prev,
        [soldierId]: timeout,
      }))
    },
    [unitType, validateValue, handleSave, saveTimeouts]
  )

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimeouts).forEach((timeout) => clearTimeout(timeout))
    }
  }, [saveTimeouts])

  if (soldiers.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="p-4 border-b border-border">
          <BackButton onClick={onBack} />
        </div>
        <ScopeHeader scope={className} />
        <EmptyState message={EMPTY_STATES.NO_SOLDIERS} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-border p-4 space-y-3">
        <BackButton onClick={onBack} />
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">חתך: {className}</p>
          <h1 className="text-xl font-bold">{trainingTypeName}</h1>
        </div>
      </div>

      {/* Soldier List */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-border">
          {soldiers.map((soldier) => {
            const entry = entries[soldier.id]
            const hasValue = entry.value !== null
            const isValid = !entry.error && hasValue

            return (
              <div
                key={soldier.id}
                className="bg-white dark:bg-gray-800 p-4 flex items-center gap-4"
              >
                {/* Soldier Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base truncate">{soldier.name}</p>
                </div>

                {/* Input */}
                <div className="flex items-center gap-2">
                  {unitType === 'boolean' ? (
                    <button
                      onClick={() => {
                        const newValue = entry.value === true ? false : true
                        handleValueChange(soldier.id, newValue)
                      }}
                      className={`
                        touch-target
                        w-20 h-12
                        rounded-lg
                        font-medium text-sm
                        transition-all
                        active:scale-95
                        ${
                          entry.value === true
                            ? 'bg-success text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }
                        ${entry.isSaving ? 'opacity-50' : ''}
                      `}
                      disabled={entry.isSaving}
                    >
                      {entry.value === true ? '✓ בוצע' : '✗ לא'}
                    </button>
                  ) : (
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="decimal"
                        min={
                          unitType === 'seconds'
                            ? TRAINING_CONSTRAINTS.SECONDS_MIN
                            : TRAINING_CONSTRAINTS.SCORE_MIN
                        }
                        max={
                          unitType === 'seconds'
                            ? TRAINING_CONSTRAINTS.SECONDS_MAX
                            : TRAINING_CONSTRAINTS.SCORE_MAX
                        }
                        value={entry.value === null ? '' : String(entry.value)}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : parseFloat(e.target.value)
                          if (val !== null) {
                            handleValueChange(soldier.id, val)
                          } else {
                            setEntries((prev) => ({
                              ...prev,
                              [soldier.id]: {
                                ...prev[soldier.id],
                                value: null,
                                error: null,
                              },
                            }))
                          }
                        }}
                        className={`
                          touch-target
                          w-24 h-12
                          px-3 py-2
                          text-base text-center
                          border-2 rounded-lg
                          transition-colors
                          focus:outline-none focus:ring-2 focus:ring-primary
                          ${entry.error ? 'border-error' : 'border-input-border focus:border-primary'}
                          ${isValid ? 'border-success bg-green-50 dark:bg-green-900/20' : ''}
                        `}
                        placeholder="0"
                        disabled={entry.isSaving}
                      />
                      <span className="absolute start-full ms-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {unitType === 'seconds' ? 'שניות' : 'נק׳'}
                      </span>
                    </div>
                  )}

                  {/* Status Indicator */}
                  <div className="w-6 h-6 flex items-center justify-center">
                    {entry.isSaving && (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {entry.showSuccess && !entry.isSaving && (
                      <svg className="w-6 h-6 text-success" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-white dark:bg-gray-800 border-t border-border p-4">
        <button
          onClick={onBack}
          className="w-full py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
        >
          חזרה
        </button>
      </div>
    </div>
  )
}
