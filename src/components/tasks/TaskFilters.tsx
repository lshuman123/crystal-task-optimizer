import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useEmployees } from '@/hooks/useProfiles'
import { useClients } from '@/hooks/useClients'
import type { TaskFilters } from '@/hooks/useTasks'
import { X } from 'lucide-react'

interface Props {
  filters: TaskFilters
  onChange: (filters: TaskFilters) => void
}

export function TaskFiltersBar({ filters, onChange }: Props) {
  const { data: employees = [] } = useEmployees()
  const { data: clients = [] } = useClients()

  function set(key: keyof TaskFilters, value: string) {
    onChange({ ...filters, [key]: value || undefined })
  }

  function reset() {
    onChange({})
  }

  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={filters.status ?? 'all'} onValueChange={v => set('status', v === 'all' ? '' : v)}>
        <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="complete">Complete</SelectItem>
          <SelectItem value="flagged">Blocked</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.assignedTo ?? 'all'} onValueChange={v => set('assignedTo', v === 'all' ? '' : v)}>
        <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Employee" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Employees</SelectItem>
          {employees.map(e => (
            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.clientId ?? 'all'} onValueChange={v => set('clientId', v === 'all' ? '' : v)}>
        <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Client" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Clients</SelectItem>
          {clients.map(c => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.taskType ?? 'all'} onValueChange={v => set('taskType', v === 'all' ? '' : v)}>
        <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="Task Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="payment_posting">Payment Posting</SelectItem>
          <SelectItem value="claims_scrubbing">Claims Scrubbing</SelectItem>
          <SelectItem value="era_pulling">ERA Pulling</SelectItem>
          <SelectItem value="eligibility_verification">Eligibility Verification</SelectItem>
          <SelectItem value="ar_followup">AR Follow-up</SelectItem>
          <SelectItem value="denial_appeal">Denial Appeal</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={reset}>
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  )
}
