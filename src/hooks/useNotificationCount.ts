import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { isPast, parseISO } from 'date-fns'

export function useNotificationCount(): number {
  const { profile } = useAuth()

  const { data } = useQuery({
    queryKey: ['notification-count'],
    enabled: profile?.role === 'manager',
    queryFn: async () => {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, status, due_date')
        .neq('status', 'complete')

      if (!tasks) return 0

      let count = 0
      for (const task of tasks) {
        if (task.status === 'flagged') { count++; continue }
        if (task.due_date && isPast(parseISO(task.due_date))) count++
      }
      return count
    },
    refetchInterval: 60_000,
  })

  return data ?? 0
}
