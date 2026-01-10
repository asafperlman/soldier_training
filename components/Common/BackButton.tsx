'use client'

import { useRouter } from 'next/navigation'

interface BackButtonProps {
  onClick?: () => void
  fallbackUrl?: string
  label?: string
  className?: string
}

export function BackButton({ onClick, fallbackUrl = '/', label = 'חזרה', className = '' }: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onClick) {
      onClick()
    } else if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackUrl)
    }
  }

  return (
    <button
      onClick={handleBack}
      className={`flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors ${className}`}
      aria-label={label}
    >
      {/* Rotated arrow for RTL */}
      <svg
        className="w-5 h-5 rotate-180"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
      <span>{label}</span>
    </button>
  )
}
