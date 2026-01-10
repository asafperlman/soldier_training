interface EmptyStateProps {
  message: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ message, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <p className="text-gray-600 dark:text-gray-400 text-base mb-4">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
