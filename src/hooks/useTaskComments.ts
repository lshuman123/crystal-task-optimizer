import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface TaskComment {
  id: string
  task_id: string
  author_id: string
  body: string
  created_at: string
  author?: { id: string; name: string; role: string } | null
}

const COMMENT_SELECT = `*, author:profiles!task_comments_author_id_fkey(id, name, role)`

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: ['task_comments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select(COMMENT_SELECT)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as TaskComment[]
    },
    enabled: !!taskId,
  })
}

export function useAddComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, body, authorId }: { taskId: string; body: string; authorId: string }) => {
      const { data, error } = await supabase
        .from('task_comments')
        .insert({ task_id: taskId, body, author_id: authorId })
        .select(COMMENT_SELECT)
        .single()
      if (error) throw error
      return data as TaskComment
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['task_comments', vars.taskId] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      const { error } = await supabase.from('task_comments').delete().eq('id', id)
      if (error) throw error
      return taskId
    },
    onSuccess: (taskId) => {
      qc.invalidateQueries({ queryKey: ['task_comments', taskId] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
