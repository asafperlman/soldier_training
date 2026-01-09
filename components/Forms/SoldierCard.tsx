'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/Common/Card'
import { Button } from '@/components/Common/Button'
import { NumericInput } from '@/components/Common/Input'
import { calculateBest, calculateAvgAfterBest, checkPassed } from '@/lib/data-entry'
import { Soldier } from '@/lib/supabase/types'

interface SoldierCardProps {
  soldier: Soldier
  unit: 'seconds' | 'boolean'
  ruleType: 'max_seconds' | 'must_be_true'
  threshold?: number | null
  onDataChange: (soldierId: string, attempts: (number | boolean)[]) => void
  autoFocus?: boolean
}

export function SoldierCard({
  soldier,
  unit,
  ruleType,
  threshold,
  onDataChange,
  autoFocus = false,
}: SoldierCardProps) {
  const [attempts, setAttempts] = useState<number[]>(unit === 'seconds' ? [0] : [])
  const [boolValue, setBoolValue] = useState<boolean | null>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && firstInputRef.current) {
      firstInputRef.current.focus()
    }
  }, [autoFocus])

  useEffect(() => {
    if (unit === 'seconds') {
      onDataChange(
        soldier.id,
        attempts.filter((a) => a > 0)
      )
    } else {
      onDataChange(soldier.id, boolValue !== null ? [boolValue] : [])
    }
  }, [attempts, boolValue, soldier.id, unit, onDataChange])

  const handleAttemptChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 0
    const newAttempts = [...attempts]
    newAttempts[index] = numValue
    setAttempts(newAttempts)
  }

  const addAttempt = () => {
    setAttempts([...attempts, 0])
  }

  const copyLastAttempt = () => {
    if (attempts.length > 0) {
      const last = attempts[attempts.length - 1]
      setAttempts([...attempts, last])
    }
  }

  const removeAttempt = (index: number) => {
    if (attempts.length > 1) {
      setAttempts(attempts.filter((_, i) => i !== index))
    }
  }

  // Calculate metrics for seconds trainings
  const validAttempts = attempts.filter((a) => a > 0)
  const best = validAttempts.length > 0 ? calculateBest(validAttempts) : null
  const avgAfterBest =
    validAttempts.length > 1 ? calculateAvgAfterBest(validAttempts) : null
  const passed = checkPassed(best, ruleType, threshold)

  if (unit === 'boolean') {
    return (
      <Card className="mb-4">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{soldier.full_name}</h3>
            </div>
            <div className="flex gap-2">
              <Button
                variant={boolValue === true ? 'success' : 'secondary'}
                size="lg"
                onClick={() => setBoolValue(true)}
                className="min-w-[80px]"
              >
                כן ✓
              </Button>
              <Button
                variant={boolValue === false ? 'error' : 'secondary'}
                size="lg"
                onClick={() => setBoolValue(false)}
                className="min-w-[80px]"
              >
                לא ✗
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-4">
      <CardContent className="py-4">
        <div className="space-y-3">
          {/* Soldier Name */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{soldier.full_name}</h3>
            {best !== null && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  passed
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {passed ? '✓ עבר' : '✗ נכשל'}
              </span>
            )}
          </div>

          {/* Attempts */}
          <div className="space-y-2">
            {attempts.map((attempt, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-16">ניסיון {index + 1}:</span>
                <NumericInput
                  ref={index === 0 && autoFocus ? firstInputRef : undefined}
                  value={attempt || ''}
                  onChange={(e) => handleAttemptChange(index, e.target.value)}
                  placeholder="0"
                  className="flex-1"
                  min={0}
                />
                <span className="text-sm text-gray-600 w-8">שניות</span>
                {attempts.length > 1 && (
                  <Button
                    variant="error"
                    size="sm"
                    onClick={() => removeAttempt(index)}
                    className="min-w-[60px]"
                  >
                    מחק
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={addAttempt} fullWidth>
              + ניסיון
            </Button>
            {attempts.length > 0 && attempts[attempts.length - 1] > 0 && (
              <Button variant="secondary" size="sm" onClick={copyLastAttempt} fullWidth>
                העתק ניסיון
              </Button>
            )}
          </div>

          {/* Computed Metrics */}
          {best !== null && (
            <div className="pt-3 border-t border-border">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">זמן מינימלי:</span>
                  <span className="font-semibold text-primary ms-2">{best}s</span>
                </div>
                {avgAfterBest !== null && (
                  <div>
                    <span className="text-gray-600">ממוצע אחרי מינימלי:</span>
                    <span className="font-semibold ms-2">{avgAfterBest}s</span>
                  </div>
                )}
                {threshold && (
                  <div>
                    <span className="text-gray-600">דרישה:</span>
                    <span className="font-semibold ms-2">≤ {threshold}s</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
