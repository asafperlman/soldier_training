'use client'

import { useState, useTransition } from 'react'
import { createClassLeader, deleteClassLeader } from '@/app/admin/class-leaders/actions'
import { Button, Input } from '@/components/Common'

interface ClassLeadersManagementProps {
  classes: Array<{ id: string; name: string }>
  classLeaders: Array<{
    user_id: string
    class_id: string
    classes: { name: string } | null
    email: string
    created_at: string
  }>
}

export function ClassLeadersManagement({ classes, classLeaders }: ClassLeadersManagementProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [selectedClassId, setSelectedClassId] = useState('')

  const handleCreate = async (formData: FormData) => {
    setMessage(null)
    startTransition(async () => {
      const result = await createClassLeader(formData)
      if (result?.error) {
        setMessage({ type: 'error', text: result.error })
      } else if (result?.success) {
        setMessage({ type: 'success', text: 'מכ״י נוצר בהצלחה' })
        setSelectedClassId('')
        // Reset form
        const form = document.getElementById('create-leader-form') as HTMLFormElement
        form?.reset()
      }
    })
  }

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`האם למחוק את המכ״י ${email}?`)) return

    setMessage(null)
    startTransition(async () => {
      const result = await deleteClassLeader(userId)
      if (result?.error) {
        setMessage({ type: 'error', text: result.error })
      } else if (result?.success) {
        setMessage({ type: 'success', text: 'מכ״י נמחק בהצלחה' })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Create Form */}
      <div className="border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">הוסף מכ״י חדש</h3>
        <form
          id="create-leader-form"
          action={handleCreate}
          className="space-y-4"
        >
          <Input
            name="email"
            type="email"
            label="אימייל"
            placeholder="leader@example.com"
            required
            disabled={isPending}
            fullWidth
          />

          <Input
            name="password"
            type="password"
            label="סיסמה"
            placeholder="לפחות 6 תווים"
            required
            disabled={isPending}
            fullWidth
            helperText="סיסמה חזקה בת לפחות 6 תווים"
          />

          <div>
            <label htmlFor="class_id" className="block mb-1.5 text-sm font-medium text-foreground">
              כיתה <span className="text-error me-1">*</span>
            </label>
            <select
              id="class_id"
              name="class_id"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              required
              disabled={isPending}
              className="touch-target block w-full px-3 py-2.5 text-base border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed border-input-border focus:border-primary"
            >
              <option value="">בחר כיתה</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isPending}
            fullWidth
          >
            {isPending ? 'יוצר...' : 'צור מכ״י'}
          </Button>
        </form>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'error'
              ? 'bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-400'
              : 'bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Existing Leaders List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">מכ״יים קיימים</h3>
        {classLeaders.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
            אין מכ״יים במחלקה זו
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-start py-3 px-4 font-medium">אימייל</th>
                  <th className="text-start py-3 px-4 font-medium">כיתה</th>
                  <th className="text-start py-3 px-4 font-medium">תאריך יצירה</th>
                  <th className="text-center py-3 px-4 font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {classLeaders.map((leader) => (
                  <tr key={leader.user_id} className="border-b border-border hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4">{leader.email}</td>
                    <td className="py-3 px-4">{leader.classes?.name || '-'}</td>
                    <td className="py-3 px-4">
                      {new Date(leader.created_at).toLocaleDateString('he-IL')}
                    </td>
                    <td className="text-center py-3 px-4">
                      <Button
                        onClick={() => handleDelete(leader.user_id, leader.email)}
                        variant="error"
                        size="sm"
                        disabled={isPending}
                      >
                        מחק
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
