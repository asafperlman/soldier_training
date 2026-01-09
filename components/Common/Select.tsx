import React from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  options: SelectOption[]
  placeholder?: string
}

export function Select({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  id,
  required,
  options,
  placeholder,
  ...props
}: SelectProps) {
  const rid = React.useId()
  const selectId = id ?? `select-${rid}`

  const baseStyles = 'touch-target block w-full px-3 py-2.5 text-base border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed bg-background'

  const stateStyles = error
    ? 'border-error focus:border-error focus:ring-error'
    : 'border-input-border focus:border-primary'

  const widthStyle = fullWidth ? 'w-full' : ''

  return (
    <div className={widthStyle}>
      {label && (
        <label
          htmlFor={selectId}
          className="block mb-1.5 text-sm font-medium text-foreground"
        >
          {label}
          {required && <span className="text-error me-1">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`${baseStyles} ${stateStyles} ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  )
}
