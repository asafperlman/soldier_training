'use client'

import { EMPTY_STATES } from '@/lib/constants'
import { EmptyState } from '@/components/Common/EmptyState'

interface TrainingType {
  id: string
  name: string
  category: string | null
  unit_type: 'seconds' | 'boolean' | 'score'
}

interface TrainingTypeGridProps {
  trainingTypes: TrainingType[]
  onSelect: (trainingType: TrainingType) => void
}

export function TrainingTypeGrid({ trainingTypes, onSelect }: TrainingTypeGridProps) {
  if (trainingTypes.length === 0) {
    return <EmptyState message={EMPTY_STATES.NO_TRAINING_TYPES} />
  }

  const getUnitLabel = (unitType: string) => {
    switch (unitType) {
      case 'seconds':
        return 'שניות'
      case 'boolean':
        return 'ביצוע'
      case 'score':
        return 'ציון'
      default:
        return ''
    }
  }

  const getIcon = (category: string | null) => {
    // Map categories to icons
    switch (category) {
      case 'resuscitation':
        return '💓'
      case 'trauma':
        return '🩹'
      case 'evacuation':
        return '🚑'
      case 'assessment':
        return '📋'
      default:
        return '🎯'
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">בחר סוג אימון</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {trainingTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelect(type)}
            className="
              flex flex-col items-center justify-center
              p-4 min-h-[120px]
              bg-white dark:bg-gray-800
              border-2 border-gray-200 dark:border-gray-700
              rounded-lg
              hover:border-primary hover:bg-primary/5
              active:scale-95
              transition-all
              touch-target
            "
            style={{ minHeight: '44px' }} // Ensure touch target
          >
            <span className="text-3xl mb-2" role="img" aria-label="icon">
              {getIcon(type.category)}
            </span>
            <span className="text-base font-semibold text-center mb-1 line-clamp-2">
              {type.name}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
              {getUnitLabel(type.unit_type)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
