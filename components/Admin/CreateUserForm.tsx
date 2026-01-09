'use client'

import { useState } from 'react'
import { Button, Input, Select } from '@/components/Common'
import { createUser } from '@/app/admin/users/actions'

interface CreateUserFormProps {
  companies: any[]
  departments: any[]
}

export function CreateUserForm({ companies, departments }: CreateUserFormProps) {
  const [role, setRole] = useState<'company' | 'department'>('company')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createUser(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('המשתמש נוצר בהצלחה!')
      e.currentTarget.reset()
      setTimeout(() => setSuccess(''), 3000)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-error rounded text-error text-sm">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-success rounded text-success text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          name="email"
          type="email"
          label="דוא״ל"
          placeholder="user@example.com"
          required
          disabled={loading}
        />

        <Input
          name="password"
          type="password"
          label="סיסמה"
          placeholder="לפחות 6 תווים"
          required
          disabled={loading}
          helperText="המשתמש יכול לשנות את הסיסמה בהתחברות הראשונה"
        />
      </div>

      <Select
        name="role"
        label="תפקיד"
        required
        value={role}
        onChange={(e) => setRole(e.target.value as 'company' | 'department')}
        options={[
          { value: 'company', label: 'מ״פ / חופ״ל (Company Commander)' },
          { value: 'department', label: 'מ״מ (Department Commander)' },
        ]}
        disabled={loading}
      />

      {role === 'company' && (
        <Select
          name="companyId"
          label="פלוגה"
          required
          options={companies.map((c) => ({
            value: c.id,
            label: `${c.name} (מגמה: ${c.magamas?.name || 'לא ידוע'})`,
          }))}
          placeholder="בחר פלוגה"
          disabled={loading}
        />
      )}

      {role === 'department' && (
        <Select
          name="departmentId"
          label="מחלקה"
          required
          options={departments.map((d) => ({
            value: d.id,
            label: `${d.name} (פלוגה: ${d.companies?.name || 'לא ידוע'})`,
          }))}
          placeholder="בחר מחלקה"
          disabled={loading}
        />
      )}

      <Button type="submit" variant="primary" fullWidth disabled={loading}>
        {loading ? 'יוצר משתמש...' : 'צור משתמש'}
      </Button>
    </form>
  )
}
