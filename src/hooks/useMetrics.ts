import { useMemo } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useEmployees } from '@/hooks/useProfiles'
import { startOfDay, isPast, parseISO } from 'date-fns'
import type { Profile, Task } from '@/types/database'

export interface EmployeeRow {
  employee: Profile
  open: number
  inProgress: number
  overdue: number
  completedToday: number
}

export interface DashboardMetrics {
  completedToday: number
  totalOpen: number
  totalInProgress: number
  totalOverdue: number
  byEmployee: EmployeeRow[]
}

export function useMetrics(): { data: DashboardMetrics | null; isLoading: boolean; isError: boolean; error: Error | null } {
  const { data: tasks, isLoading: tasksLoading, isError: tasksError, error: tasksErr } = useTasks()
  const { data: employees, isLoading: empLoading, isError: empError, error: empErr } = useEmployees()

  const data = useMemo<DashboardMetrics | null>(() => {
    if (!tasks || !employees) return null

    const todayStart = startOfDay(new Date())

    const isOverdue = (t: Task) =>
      !!t.due_date && t.status !== 'complete' && isPast(parseISO(t.due_date))

    const completedToday = tasks.filter(
      t => t.completed_at && new Date(t.completed_at) >= todayStart
    ).length

    const totalOpen       = tasks.filter(t => t.status === 'pending' || t.status === 'flagged').length
    const totalInProgress = tasks.filter(t => t.status === 'in_progress').length
    const totalOverdue    = tasks.filter(isOverdue).length

    const byEmployee: EmployeeRow[] = employees.map(emp => {
      const empTasks = tasks.filter(t => t.assigned_to === emp.id)
      return {
        employee: emp,
        open:           empTasks.filter(t => t.status === 'pending' || t.status === 'flagged').length,
        inProgress:     empTasks.filter(t => t.status === 'in_progress').length,
        overdue:        empTasks.filter(isOverdue).length,
        completedToday: empTasks.filter(t => t.completed_at && new Date(t.completed_at) >= todayStart).length,
      }
    })

    return { completedToday, totalOpen, totalInProgress, totalOverdue, byEmployee }
  }, [tasks, employees])

  return {
    data,
    isLoading: tasksLoading || empLoading,
    isError: tasksError || empError,
    error: (tasksErr || empErr) as Error | null,
  }
}
