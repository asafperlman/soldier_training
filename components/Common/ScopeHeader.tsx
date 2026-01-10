interface ScopeHeaderProps {
  scope: string
  className?: string
}

export function ScopeHeader({ scope, className = '' }: ScopeHeaderProps) {
  return (
    <div
      className={`sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-border px-4 py-2 ${className}`}
    >
      <p className="text-sm text-gray-600 dark:text-gray-400 text-end">
        <span className="font-medium">חתך:</span> {scope}
      </p>
    </div>
  )
}
