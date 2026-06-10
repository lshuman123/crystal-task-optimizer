import { type ReactNode, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/hooks/useAuth'

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()

  useEffect(() => {
    if (!session) return

    const channel = supabase
      .channel('global-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
        queryClient.invalidateQueries({ queryKey: ['notification-count'] })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session])

  return <>{children}</>
}
