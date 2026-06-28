import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Task, TaskStatus, Priority, TaskType } from '@/types/database'
import { toast } from 'sonner'

const TASK_SELECT = `
  *,
  client:clients(id, name),
  assignee:profiles!tasks_assigned_to_fkey(id, name, email, role, specialty, created_at)
`

export interface TaskFilters {
  status?: TaskStatus | 'all'
  assignedTo?: string
  clientId?: string
  taskType?: TaskType | 'all'
}

export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select(TASK_SELECT)
        .order('created_at', { ascending: false })

      if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status)
      if (filters?.assignedTo) query = query.eq('assigned_to', filters.assignedTo)
      if (filters?.clientId) query = query.eq('client_id', filters.clientId)
      if (filters?.taskType && filters.taskType !== 'all') query = query.eq('task_type', filters.taskType)

      const { data, error } = await query
      if (error) throw error
      return data as Task[]
    },
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Task
    },
  })
}

interface CreateTaskInput {
  title: string
  task_type: TaskType
  client_id?: string | null
  assigned_to?: string | null
  priority: Priority
  status?: TaskStatus
  due_date?: string | null
  follow_up_date?: string | null
  notes?: string | null
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data, error } = await supabase.from('tasks').insert(input).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task created')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useCompleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const { data: current } = await supabase.from('tasks').select('notes').eq('id', id).single()
      const updatedNotes = note
        ? (current?.notes ? `${current.notes}\n\n${note}` : note)
        : current?.notes ?? null

      const { error } = await supabase.from('tasks').update({
        status: 'complete',
        completed_at: new Date().toISOString(),
        notes: updatedNotes,
      }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task marked complete')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useFlagTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      reason,
      flaggedBy,
      taskTitle,
    }: {
      id: string
      reason: string
      flaggedBy?: string
      taskTitle?: string
    }) => {
      const { data: current } = await supabase.from('tasks').select('notes').eq('id', id).single()
      const newNotes = current?.notes
        ? `${current.notes}\n\n⚑ Blocked: ${reason}`
        : `⚑ Blocked: ${reason}`

      const { error } = await supabase
        .from('tasks')
        .update({ status: 'flagged', notes: newNotes })
        .eq('id', id)
      if (error) throw error

      // Notify managers via edge function — fails silently if not deployed
      try {
        await supabase.functions.invoke('notify-manager', {
          body: { taskId: id, taskTitle: taskTitle ?? 'Task', flaggedBy: flaggedBy ?? 'An employee', reason },
        })
      } catch {
        // Edge function not deployed — in-app notification still works
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.warning('Task flagged as blocked')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
