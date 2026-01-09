import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  id,
  required,
  ...props
}, ref) => {
  const rid = React.useId()
  const inputId = id ?? `input-${rid}`

  const baseStyles = 'touch-target block w-full px-3 py-2.5 text-base border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed'

  const stateStyles = error
    ? 'border-error focus:border-error focus:ring-error'
    : 'border-input-border focus:border-primary'

  const widthStyle = fullWidth ? 'w-full' : ''

  return (
    <div className={widthStyle}>
      {label && (
        <label
          htmlFor={inputId}
          className="block mb-1.5 text-sm font-medium text-foreground"
        >
          {label}
          {required && <span className="text-error me-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`${baseStyles} ${stateStyles} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

interface NumericInputProps extends Omit<InputProps, 'type'> {
  min?: number
  max?: number
}

/**
 * Specialized numeric input optimized for mobile
 * Uses inputmode="numeric" to show numeric keyboard without zoom
 */
export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(({
  min,
  max,
  pattern = '[0-9]*',
  ...props
}, ref) => {
  return (
    <Input
      ref={ref}
      type="text"
      inputMode="numeric"
      pattern={pattern}
      min={min}
      max={max}
      {...props}
    />
  )
})

NumericInput.displayName = 'NumericInput'
