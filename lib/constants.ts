// Application constants

export const ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  COMPANY: 'company',
  DEPARTMENT: 'department',
  CLASS: 'class',
} as const

export const ROLE_LABELS: Record<string, string> = {
  system_admin: 'מנהל מערכת',
  company: 'מ״פ / חופ״ל',
  department: 'מ״מ',
  class: 'מכ״י',
}

export const SOLDIER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  TRANSFERRED: 'transferred',
} as const

export const SOLDIER_STATUS_LABELS: Record<string, string> = {
  active: 'פעיל',
  inactive: 'לא פעיל',
  transferred: 'הועבר',
}

// Fixed training types (seeded in database)
export const TRAINING_TYPES = {
  PLACING_CE_PARTNER: 'placing_ce_partner',
  PLACING_CE_SELF_STANDING: 'placing_ce_self_standing',
  PLACING_TA: 'placing_ta',
  ARAN_PARTICIPATION: 'aran_participation',
} as const

export const TRAINING_TYPE_LABELS: Record<string, string> = {
  placing_ce_partner: 'הנחת ח.ע על חבר',
  placing_ce_self_standing: 'הנחת ח.ע עצמי ברגל',
  placing_ta: 'הנחת ת״א',
  aran_participation: 'תרגול אר״ן - השתתפות',
}

// Exceptions configuration
export const EXCEPTIONS_CONFIG = {
  rollingDays: 30,          // Time window for exception computation
  deltaSeconds: 5,          // For "below average" detection
  missingFactor: 0.5,       // For "missing practice" threshold (50% of dept average)
} as const

export const EXCEPTION_TYPES = {
  FAILED_REQUIREMENT: 'failed_requirement',
  BELOW_CLASS_AVG: 'below_class_avg',
  BELOW_DEPT_AVG: 'below_dept_avg',
  MISSING_PRACTICE: 'missing_practice',
  NO_RECENT_DATA: 'no_recent_data',
} as const

export const EXCEPTION_LABELS: Record<string, string> = {
  failed_requirement: 'כשלון בדרישת סף',
  below_class_avg: 'מתחת לממוצע הכיתה',
  below_dept_avg: 'מתחת לממוצע המחלקה',
  missing_practice: 'חסר תרגול',
  no_recent_data: 'אין נתונים אחרונים',
}

export const EXCEPTION_SEVERITY: Record<string, 'high' | 'medium' | 'low'> = {
  failed_requirement: 'high',
  below_class_avg: 'medium',
  below_dept_avg: 'medium',
  missing_practice: 'low',
  no_recent_data: 'low',
}

// Pagination
export const ITEMS_PER_PAGE = 50

// Performance
export const ANALYTICS_CACHE_MINUTES = 5
