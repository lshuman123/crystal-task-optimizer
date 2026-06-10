import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  FileSearch,
  ShieldCheck,
  Phone,
  AlertTriangle,
  Download,
} from 'lucide-react'
import type { Priority, TaskStatus, TaskType } from '@/types/database'
import { cn } from '@/lib/utils'

export function PriorityBadge({ priority }: { priority: Priority }) {
  const variants: Record<Priority, string> = {
    high:   'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low:    'bg-green-100 text-green-700 border-green-200',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', variants[priority])}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  )
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const variants: Record<TaskStatus, string> = {
    pending:     'bg-zinc-100 text-zinc-600 border-zinc-200',
    in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
    complete:    'bg-green-100 text-green-700 border-green-200',
    flagged:     'bg-orange-100 text-orange-700 border-orange-200',
  }
  const labels: Record<TaskStatus, string> = {
    pending:     'Pending',
    in_progress: 'In Progress',
    complete:    'Complete',
    flagged:     'Blocked',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', variants[status])}>
      {labels[status]}
    </span>
  )
}

export function TaskTypeIcon({ taskType, className }: { taskType: TaskType; className?: string }) {
  const icons: Record<TaskType, React.ElementType> = {
    payment_posting:          CreditCard,
    claims_scrubbing:         FileSearch,
    era_pulling:              Download,
    eligibility_verification: ShieldCheck,
    ar_followup:              Phone,
    denial_appeal:            AlertTriangle,
  }
  const Icon = icons[taskType]
  return <Icon className={cn('h-4 w-4', className)} />
}

export function TaskTypeLabel({ taskType }: { taskType: TaskType }) {
  const labels: Record<TaskType, string> = {
    payment_posting:          'Payment Posting',
    claims_scrubbing:         'Claims Scrubbing',
    era_pulling:              'ERA Pulling',
    eligibility_verification: 'Eligibility Verification',
    ar_followup:              'AR Follow-up',
    denial_appeal:            'Denial Appeal',
  }
  return <>{labels[taskType]}</>
}

export function DueSoonBadge() {
  return (
    <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs font-medium">
      Due Soon
    </Badge>
  )
}

export function OverdueBadge() {
  return (
    <Badge className="bg-red-100 text-red-800 border-red-200 text-xs font-medium">
      Overdue
    </Badge>
  )
}
