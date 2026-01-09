'use client'

import { useState } from 'react'
import { Button, Input, Select } from '@/components/Common'
import {
  createMagama,
  updateMagama,
  deleteMagama,
  createCompany,
  updateCompany,
  deleteCompany,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createClass,
  updateClass,
  deleteClass,
} from '@/app/admin/org/actions'

type Tab = 'magamas' | 'companies' | 'departments' | 'classes'

interface Magama {
  id: string
  name: string
}

interface Company {
  id: string
  name: string
  magama_id: string
  magamas?: { name: string }
}

interface Department {
  id: string
  name: string
  company_id: string
  companies?: { name: string }
}

interface Class {
  id: string
  name: string
  department_id: string
  departments?: { name: string }
}

interface Props {
  magamas: Magama[]
  companies: Company[]
  departments: Department[]
  classes: Class[]
}

export function OrgManagementTabs({ magamas, companies, departments, classes }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('magamas')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const tabs = [
    { id: 'magamas' as Tab, label: 'מגמות', count: magamas.length },
    { id: 'companies' as Tab, label: 'פלוגות', count: companies.length },
    { id: 'departments' as Tab, label: 'מחלקות', count: departments.length },
    { id: 'classes' as Tab, label: 'כיתות', count: classes.length },
  ]

  const handleSubmit = async (action: (formData: FormData) => Promise<any>, formData: FormData) => {
    setError('')
    setSuccess('')

    const result = await action(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('הפעולה בוצעה בהצלחה')
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const handleDelete = async (action: (id: string) => Promise<any>, id: string, name: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את "${name}"?`)) {
      return
    }

    setError('')
    setSuccess('')

    const result = await action(id)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('נמחק בהצלחה')
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-error rounded text-error text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mx-4 mt-4 p-3 bg-green-50 border border-success rounded text-success text-sm">
          {success}
        </div>
      )}

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'magamas' && (
          <MagamasTab
            magamas={magamas}
            onSubmit={(formData: FormData) => handleSubmit(createMagama, formData)}
            onUpdate={(id: string, formData: FormData) => handleSubmit((fd) => updateMagama(id, fd), formData)}
            onDelete={(id: string, name: string) => handleDelete(deleteMagama, id, name)}
          />
        )}

        {activeTab === 'companies' && (
          <CompaniesTab
            companies={companies}
            magamas={magamas}
            onSubmit={(formData: FormData) => handleSubmit(createCompany, formData)}
            onUpdate={(id: string, formData: FormData) => handleSubmit((fd) => updateCompany(id, fd), formData)}
            onDelete={(id: string, name: string) => handleDelete(deleteCompany, id, name)}
          />
        )}

        {activeTab === 'departments' && (
          <DepartmentsTab
            departments={departments}
            companies={companies}
            onSubmit={(formData: FormData) => handleSubmit(createDepartment, formData)}
            onUpdate={(id: string, formData: FormData) => handleSubmit((fd) => updateDepartment(id, fd), formData)}
            onDelete={(id: string, name: string) => handleDelete(deleteDepartment, id, name)}
          />
        )}

        {activeTab === 'classes' && (
          <ClassesTab
            classes={classes}
            departments={departments}
            onSubmit={(formData: FormData) => handleSubmit(createClass, formData)}
            onUpdate={(id: string, formData: FormData) => handleSubmit((fd) => updateClass(id, fd), formData)}
            onDelete={(id: string, name: string) => handleDelete(deleteClass, id, name)}
          />
        )}
      </div>
    </div>
  )
}

interface MagamasTabProps {
  magamas: Magama[]
  onSubmit: (formData: FormData) => void
  onUpdate: (id: string, formData: FormData) => void
  onDelete: (id: string, name: string) => void
}

function MagamasTab({ magamas, onSubmit, onUpdate, onDelete }: MagamasTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Create Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(new FormData(e.currentTarget))
          e.currentTarget.reset()
        }}
        className="flex gap-2"
      >
        <Input name="name" placeholder="שם מגמה חדשה" required fullWidth />
        <Button type="submit" variant="primary" className="whitespace-nowrap">
          + הוסף מגמה
        </Button>
      </form>

      {/* List */}
      <div className="space-y-2">
        {magamas.map((magama) => (
          <div key={magama.id} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
            {editingId === magama.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  onUpdate(magama.id, new FormData(e.currentTarget))
                  setEditingId(null)
                }}
                className="flex-1 flex gap-2"
              >
                <Input name="name" defaultValue={magama.name} required fullWidth />
                <Button type="submit" variant="success" size="sm">
                  שמור
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(null)}>
                  ביטול
                </Button>
              </form>
            ) : (
              <>
                <span className="flex-1 font-medium">{magama.name}</span>
                <Button variant="secondary" size="sm" onClick={() => setEditingId(magama.id)}>
                  ערוך
                </Button>
                <Button
                  variant="error"
                  size="sm"
                  onClick={() => onDelete(magama.id, magama.name)}
                >
                  מחק
                </Button>
              </>
            )}
          </div>
        ))}
        {magamas.length === 0 && (
          <p className="text-center text-gray-500 py-8">אין מגמות. הוסף מגמה ראשונה למעלה.</p>
        )}
      </div>
    </div>
  )
}

interface CompaniesTabProps {
  companies: Company[]
  magamas: Magama[]
  onSubmit: (formData: FormData) => void
  onUpdate: (id: string, formData: FormData) => void
  onDelete: (id: string, name: string) => void
}

function CompaniesTab({ companies, magamas, onSubmit, onUpdate, onDelete }: CompaniesTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Create Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(new FormData(e.currentTarget))
          e.currentTarget.reset()
        }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <Select
          name="magamaId"
          label="מגמה"
          required
          options={magamas.map((m) => ({ value: m.id, label: m.name }))}
          placeholder="בחר מגמה"
        />
        <Input name="name" label="שם פלוגה" placeholder="פלוגה א׳" required />
        <div className="sm:col-span-2">
          <Button type="submit" variant="primary" fullWidth>
            + הוסף פלוגה
          </Button>
        </div>
      </form>

      {/* List */}
      <div className="space-y-2">
        {companies.map((company) => (
          <div key={company.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
            {editingId === company.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  onUpdate(company.id, new FormData(e.currentTarget))
                  setEditingId(null)
                }}
                className="flex gap-2"
              >
                <Input name="name" defaultValue={company.name} required fullWidth />
                <Button type="submit" variant="success" size="sm">
                  שמור
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(null)}>
                  ביטול
                </Button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{company.name}</p>
                  <p className="text-sm text-gray-600">מגמה: {company.magamas?.name}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditingId(company.id)}>
                    ערוך
                  </Button>
                  <Button
                    variant="error"
                    size="sm"
                    onClick={() => onDelete(company.id, company.name)}
                  >
                    מחק
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {companies.length === 0 && (
          <p className="text-center text-gray-500 py-8">אין פלוגות. הוסף פלוגה למעלה.</p>
        )}
      </div>
    </div>
  )
}

interface DepartmentsTabProps {
  departments: Department[]
  companies: Company[]
  onSubmit: (formData: FormData) => void
  onUpdate: (id: string, formData: FormData) => void
  onDelete: (id: string, name: string) => void
}

function DepartmentsTab({ departments, companies, onSubmit, onUpdate, onDelete }: DepartmentsTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Create Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(new FormData(e.currentTarget))
          e.currentTarget.reset()
        }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <Select
          name="companyId"
          label="פלוגה"
          required
          options={companies.map((c: any) => ({ value: c.id, label: c.name }))}
          placeholder="בחר פלוגה"
        />
        <Input name="name" label="שם מחלקה" placeholder="מחלקה 1" required />
        <div className="sm:col-span-2">
          <Button type="submit" variant="primary" fullWidth>
            + הוסף מחלקה
          </Button>
        </div>
      </form>

      {/* List */}
      <div className="space-y-2">
        {departments.map((dept: any) => (
          <div key={dept.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
            {editingId === dept.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  onUpdate(dept.id, new FormData(e.currentTarget))
                  setEditingId(null)
                }}
                className="flex gap-2"
              >
                <Input name="name" defaultValue={dept.name} required fullWidth />
                <Button type="submit" variant="success" size="sm">
                  שמור
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(null)}>
                  ביטול
                </Button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{dept.name}</p>
                  <p className="text-sm text-gray-600">פלוגה: {dept.companies?.name}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditingId(dept.id)}>
                    ערוך
                  </Button>
                  <Button variant="error" size="sm" onClick={() => onDelete(dept.id, dept.name)}>
                    מחק
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {departments.length === 0 && (
          <p className="text-center text-gray-500 py-8">אין מחלקות. הוסף מחלקה למעלה.</p>
        )}
      </div>
    </div>
  )
}

interface ClassesTabProps {
  classes: Class[]
  departments: Department[]
  onSubmit: (formData: FormData) => void
  onUpdate: (id: string, formData: FormData) => void
  onDelete: (id: string, name: string) => void
}

function ClassesTab({ classes, departments, onSubmit, onUpdate, onDelete }: ClassesTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Create Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(new FormData(e.currentTarget))
          e.currentTarget.reset()
        }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <Select
          name="departmentId"
          label="מחלקה"
          required
          options={departments.map((d: any) => ({ value: d.id, label: d.name }))}
          placeholder="בחר מחלקה"
        />
        <Input name="name" label="שם כיתה" placeholder="כיתה א׳" required />
        <div className="sm:col-span-2">
          <Button type="submit" variant="primary" fullWidth>
            + הוסף כיתה
          </Button>
        </div>
      </form>

      {/* List */}
      <div className="space-y-2">
        {classes.map((cls: any) => (
          <div key={cls.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
            {editingId === cls.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  onUpdate(cls.id, new FormData(e.currentTarget))
                  setEditingId(null)
                }}
                className="flex gap-2"
              >
                <Input name="name" defaultValue={cls.name} required fullWidth />
                <Button type="submit" variant="success" size="sm">
                  שמור
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(null)}>
                  ביטול
                </Button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{cls.name}</p>
                  <p className="text-sm text-gray-600">מחלקה: {cls.departments?.name}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditingId(cls.id)}>
                    ערוך
                  </Button>
                  <Button variant="error" size="sm" onClick={() => onDelete(cls.id, cls.name)}>
                    מחק
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {classes.length === 0 && (
          <p className="text-center text-gray-500 py-8">אין כיתות. הוסף כיתה למעלה.</p>
        )}
      </div>
    </div>
  )
}
