'use client'

import { useState, useActionState } from 'react'
import { Button } from '@/components/Common/Button'
import { Input } from '@/components/Common/Input'
import { signIn } from '@/app/login/actions'

export function LoginForm() {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await signIn(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-error rounded-lg text-error text-sm">
          {error}
        </div>
      )}

      <Input
        name="email"
        type="email"
        label="דוא״ל"
        placeholder="user@example.com"
        required
        autoComplete="email"
        fullWidth
        disabled={loading}
      />

      <Input
        name="password"
        type="password"
        label="סיסמה"
        placeholder="••••••••"
        required
        autoComplete="current-password"
        fullWidth
        disabled={loading}
      />

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={loading}
      >
        {loading ? 'מתחבר...' : 'התחבר'}
      </Button>
    </form>
  )
}
