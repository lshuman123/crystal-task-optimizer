export type Role = 'manager' | 'employee'
export type Specialty = 'payment_poster' | 'ar_specialist' | 'claims_scrubber'
export type TaskType =
  | 'payment_posting'
  | 'claims_scrubbing'
  | 'era_pulling'
  | 'eligibility_verification'
  | 'ar_followup'
  | 'denial_appeal'
export type Priority = 'high' | 'medium' | 'low'
export type TaskStatus = 'pending' | 'in_progress' | 'complete' | 'flagged'

export interface Profile {
  id: string
  name: string
  email: string
  role: Role
  specialty: Specialty | null
  created_at: string
}

export interface Client {
  id: string
  name: string
  payer_mix_medicare: number
  payer_mix_medicaid: number
  payer_mix_commercial: number
  payer_mix_vision: number
  monthly_claim_volume: number
  created_at: string
}

export interface Task {
  id: string
  title: string
  task_type: TaskType
  client_id: string | null
  assigned_to: string | null
  priority: Priority
  status: TaskStatus
  due_date: string | null
  follow_up_date: string | null
  notes: string | null
  created_at: string
  completed_at: string | null
  // Joined relations
  client?: Client | null
  assignee?: Profile | null
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile }
      clients:  { Row: Client }
      tasks:    { Row: Task }
    }
  }
}
