// Database types for Supabase

export type Role = 'system_admin' | 'company' | 'department' | 'class'

export interface UserProfile {
  user_id: string
  role: Role
  magama_id?: string | null
  company_id?: string | null
  department_id?: string | null
  class_id?: string | null
  created_at?: string
  updated_at?: string
}

export interface Magama {
  id: string
  name: string
  created_at?: string
}

export interface Company {
  id: string
  magama_id: string
  name: string
  created_at?: string
}

export interface Department {
  id: string
  company_id: string
  name: string
  created_at?: string
}

export interface Class {
  id: string
  department_id: string
  name: string
  created_at?: string
}

export interface Soldier {
  id: string
  full_name: string
  company_id: string
  department_id: string
  class_id: string
  status: 'active' | 'inactive' | 'transferred'
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export type TrainingUnit = 'seconds' | 'boolean'

export interface TrainingType {
  id: string
  key: string
  name: string
  unit: TrainingUnit
  created_at?: string
}

export type RuleType = 'max_seconds' | 'must_be_true'

export interface Requirement {
  id: string
  training_type_id: string
  rule_type: RuleType
  threshold_int?: number | null
  created_at?: string
}

export interface TrainingSession {
  id: string
  training_type_id: string
  class_id: string
  department_id: string
  company_id: string
  magama_id: string
  session_at: string
  created_by: string
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface TrainingAttempt {
  id: string
  session_id: string
  soldier_id: string
  attempt_no: number
  value_seconds?: number | null
  value_bool?: boolean | null
  created_at?: string
}

// Helper types for UI
export interface SoldierWithClass extends Soldier {
  class_name?: string
  department_name?: string
  company_name?: string
}

export interface TrainingSessionWithDetails extends TrainingSession {
  training_type?: TrainingType
  class?: Class
  department?: Department
  company?: Company
}

export interface TrainingAttemptWithSoldier extends TrainingAttempt {
  soldier?: Soldier
}
