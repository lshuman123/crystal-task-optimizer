import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface TimeEntry {
  id: string
  task_id: string
  employee_id: string
  started_at: string
  ended_at: string | null
  duration_minutes: number
  note: string | null
  created_at: string
  employee?: { id: string; name: string } | null
}

export function useTimeEntries(taskId: string) {
  return useQuery({
    queryKey: ['time_entries', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*, employee:profiles!time_entries_employee_id_fkey(id, name)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as TimeEntry[]
    },
    enabled: !!taskId,
  })
}

export function useLogTime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      taskId,
      employeeId,
      durationMinutes,
      note,
    }: {
      taskId: string
      employeeId: string
      durationMinutes: number
      note?: string
    }) => {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          task_id: taskId,
          employee_id: employeeId,
          started_at: now,
          ended_at: now,
          duration_minutes: durationMinutes,
          note: note || null,
        })
        .select()
        .single()
      if (error) throw error
      return data as TimeEntry
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['time_entries', data.task_id] })
      toast.success('Time logged')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteTimeEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      const { error } = await supabase.from('time_entries').delete().eq('id', id)
      if (error) throw error
      return taskId
    },
    onSuccess: (taskId) => {
      qc.invalidateQueries({ queryKey: ['time_entries', taskId] })
      toast.success('Entry removed')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
