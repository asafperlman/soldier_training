'use client'

import { useState, useTransition } from 'react'
import { Button, Input } from '@/components/Common'
import { EmptyState } from '@/components/Common/EmptyState'
import {
  createActivity,
  updateActivity,
  toggleActivityStatus,
  deleteActivity,
} from '@/app/admin/activities/actions'
import { VALIDATION_MESSAGES, TRAINING_CONSTRAINTS } from '@/lib/constants'

interface Activity {
  id: string
  company_id: string
  name_he: string
  icon: string | null
  required_time_seconds: number
  is_active: boolean
  created_at: string
}

interface ActivitiesManagementProps {
  activities: Activity[]
  userRole: string
  companyId: string | null
}

export function ActivitiesManagement({ activities, userRole, companyId }: ActivitiesManagementProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const canManage = userRole === 'company' || userRole === 'system_admin'

  // Create activity
  const handleCreate = async (formData: FormData) => {
    setMessage(null)
    startTransition(async () => {
      // Add company_id to formData if user is company commander
      if (userRole === 'company' && companyId) {
        formData.set('company_id', companyId)
      }

      const result = await createActivity(formData)

      if (result?.error) {
        setMessage({ type: 'error', text: result.error })
      } else if (result?.success) {
        setMessage({ type: 'success', text: 'פעילות נוצרה בהצלחה' })
        setShowCreateForm(false)
        // Reset form
        const form = document.getElementById('create-activity-form') as HTMLFormElement
        form?.reset()
      }
    })
  }

  // Update activity
  const handleUpdate = async (id: string, formData: FormData) => {
    setMessage(null)
    startTransition(async () => {
      const result = await updateActivity(id, formData)

      if (result?.error) {
        setMessage({ type: 'error', text: result.error })
      } else if (result?.success) {
        setMessage({ type: 'success', text: 'פעילות עודכנה בהצלחה' })
        setEditingId(null)
      }
    })
  }

  // Toggle active status
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    const confirmMessage = newStatus
      ? 'האם להפעיל את הפעילות?'
      : 'האם להשבית את הפעילות? היא לא תהיה זמינה לבחירה.'

    if (!confirm(confirmMessage)) return

    setMessage(null)
    startTransition(async () => {
      const result = await toggleActivityStatus(id, newStatus)

      if (result?.error) {
        setMessage({ type: 'error', text: result.error })
      } else if (result?.success) {
        setMessage({
          type: 'success',
          text: newStatus ? 'פעילות הופעלה' : 'פעילות הושבתה',
        })
      }
    })
  }

  // Delete activity (hard delete - admin only)
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`האם למחוק לצמיתות את הפעילות "${name}"?`)) return

    setMessage(null)
    startTransition(async () => {
      const result = await deleteActivity(id)

      if (result?.error) {
        setMessage({ type: 'error', text: result.error })
      } else if (result?.success) {
        setMessage({ type: 'success', text: 'פעילות נמחקה' })
      }
    })
  }

  const activeActivities = activities.filter((a) => a.is_active)
  const inactiveActivities = activities.filter((a) => !a.is_active)

  return (
    <div className="space-y-6">
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

      {/* Create Button */}
      {canManage && !showCreateForm && (
        <div className="flex justify-end">
          <Button onClick={() => setShowCreateForm(true)} variant="primary">
            + הוסף פעילות חדשה
          </Button>
        </div>
      )}

      {/* Create Form */}
      {canManage && showCreateForm && (
        <div className="border border-border rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
          <h3 className="text-lg font-semibold mb-4">פעילות חדשה</h3>
          <form
            id="create-activity-form"
            onSubmit={(e) => {
              e.preventDefault()
              handleCreate(new FormData(e.currentTarget))
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="name_he"
                label="שם הפעילות"
                placeholder="לדוגמה: החייאה - CPR"
                required
                disabled={isPending}
                fullWidth
              />

              <Input
                name="icon"
                label="אייקון (אופציונלי)"
                placeholder="heart-pulse"
                disabled={isPending}
                fullWidth
                helperText="שם אייקון מהספרייה"
              />
            </div>

            <Input
              name="required_time_seconds"
              type="number"
              inputMode="numeric"
              label="זמן נדרש (שניות)"
              placeholder="120"
              required
              disabled={isPending}
              fullWidth
              min={1}
              max={300}
              helperText="זמן ביצוע נדרש: 1-300 שניות"
            />

            <div className="flex gap-3">
              <Button type="submit" variant="primary" disabled={isPending} fullWidth>
                {isPending ? 'יוצר...' : 'צור פעילות'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCreateForm(false)
                  setMessage(null)
                }}
                disabled={isPending}
                fullWidth
              >
                ביטול
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Active Activities Table */}
      {activeActivities.length === 0 && !showCreateForm ? (
        <EmptyState
          message="אין פעילויות פעילות"
          action={
            canManage
              ? {
                  label: 'הוסף פעילות ראשונה',
                  onClick: () => setShowCreateForm(true),
                }
              : undefined
          }
        />
      ) : (
        activeActivities.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">פעילויות פעילות</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" dir="rtl">
                <thead>
                  <tr className="border-b border-border bg-gray-50 dark:bg-gray-800">
                    <th className="text-start py-3 px-4 font-medium">שם הפעילות</th>
                    <th className="text-start py-3 px-4 font-medium">אייקון</th>
                    <th className="text-start py-3 px-4 font-medium">זמן נדרש</th>
                    <th className="text-start py-3 px-4 font-medium">תאריך יצירה</th>
                    {canManage && <th className="text-center py-3 px-4 font-medium">פעולות</th>}
                  </tr>
                </thead>
                <tbody>
                  {activeActivities.map((activity) => (
                    <tr
                      key={activity.id}
                      className="border-b border-border hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      {editingId === activity.id && canManage ? (
                        // Edit mode
                        <>
                          <td colSpan={canManage ? 5 : 4} className="p-4">
                            <form
                              onSubmit={(e) => {
                                e.preventDefault()
                                handleUpdate(activity.id, new FormData(e.currentTarget))
                              }}
                              className="space-y-3"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <Input
                                  name="name_he"
                                  defaultValue={activity.name_he}
                                  placeholder="שם הפעילות"
                                  required
                                  disabled={isPending}
                                  fullWidth
                                />
                                <Input
                                  name="icon"
                                  defaultValue={activity.icon || ''}
                                  placeholder="אייקון"
                                  disabled={isPending}
                                  fullWidth
                                />
                                <Input
                                  name="required_time_seconds"
                                  type="number"
                                  inputMode="numeric"
                                  defaultValue={activity.required_time_seconds}
                                  required
                                  disabled={isPending}
                                  min={1}
                                  max={300}
                                  fullWidth
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button type="submit" variant="success" size="sm" disabled={isPending}>
                                  שמור
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setEditingId(null)}
                                  disabled={isPending}
                                >
                                  ביטול
                                </Button>
                              </div>
                            </form>
                          </td>
                        </>
                      ) : (
                        // View mode
                        <>
                          <td className="py-3 px-4 font-medium">{activity.name_he}</td>
                          <td className="py-3 px-4">
                            {activity.icon ? (
                              <span className="text-xl">{activity.icon}</span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono">
                              {activity.required_time_seconds} שניות
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            {new Date(activity.created_at).toLocaleDateString('he-IL')}
                          </td>
                          {canManage && (
                            <td className="text-center py-3 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  onClick={() => setEditingId(activity.id)}
                                  variant="secondary"
                                  size="sm"
                                  disabled={isPending}
                                >
                                  ערוך
                                </Button>
                                <Button
                                  onClick={() => handleToggleStatus(activity.id, activity.is_active)}
                                  variant="warning"
                                  size="sm"
                                  disabled={isPending}
                                >
                                  השבת
                                </Button>
                                {userRole === 'system_admin' && (
                                  <Button
                                    onClick={() => handleDelete(activity.id, activity.name_he)}
                                    variant="error"
                                    size="sm"
                                    disabled={isPending}
                                  >
                                    מחק
                                  </Button>
                                )}
                              </div>
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Inactive Activities */}
      {inactiveActivities.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3 text-gray-600 dark:text-gray-400">
            פעילויות מושבתות ({inactiveActivities.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm opacity-60" dir="rtl">
              <thead>
                <tr className="border-b border-border bg-gray-50 dark:bg-gray-800">
                  <th className="text-start py-3 px-4 font-medium">שם הפעילות</th>
                  <th className="text-start py-3 px-4 font-medium">זמן נדרש</th>
                  {canManage && <th className="text-center py-3 px-4 font-medium">פעולות</th>}
                </tr>
              </thead>
              <tbody>
                {inactiveActivities.map((activity) => (
                  <tr
                    key={activity.id}
                    className="border-b border-border hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-3 px-4 line-through">{activity.name_he}</td>
                    <td className="py-3 px-4">{activity.required_time_seconds} שניות</td>
                    {canManage && (
                      <td className="text-center py-3 px-4">
                        <Button
                          onClick={() => handleToggleStatus(activity.id, activity.is_active)}
                          variant="success"
                          size="sm"
                          disabled={isPending}
                        >
                          הפעל
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
