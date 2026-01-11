'use client'

import { EmptyState } from '@/components/Common/EmptyState'

interface Activity {
  id: string
  name_he: string
  icon: string | null
  required_time_seconds: number
}

interface TrainingTypeGridProps {
  activities: Activity[]
  onSelect: (activity: Activity) => void
}

export function TrainingTypeGrid({ activities, onSelect }: TrainingTypeGridProps) {
  if (activities.length === 0) {
    return <EmptyState message="אין פעילויות זמינות" />
  }

  const getIcon = (icon: string | null) => {
    return icon || '🎯' // Default icon if none specified
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">בחר פעילות</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {activities.map((activity) => (
          <button
            key={activity.id}
            onClick={() => onSelect(activity)}
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
              {getIcon(activity.icon)}
            </span>
            <span className="text-base font-semibold text-center mb-1 line-clamp-2">
              {activity.name_he}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
              {activity.required_time_seconds} שניות
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
