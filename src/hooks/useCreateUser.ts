import { createClient } from '@supabase/supabase-js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Role, Specialty } from '@/types/database'

// Secondary client with no session persistence — calling signUp here won't
// touch the manager's active session stored in localStorage.
const signupClient = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  { auth: { persistSession: false, detectSessionInUrl: false, autoRefreshToken: false } }
)

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      name,
      email,
      password,
      role,
      specialty,
    }: {
      name: string
      email: string
      password: string
      role: Role
      specialty?: Specialty | null
    }) => {
      const { data, error } = await signupClient.auth.signUp({
        email,
        password,
        options: {
          data: { name, role, specialty: specialty ?? null },
        },
      })
      if (error) throw error
      if (!data.user) throw new Error('User creation failed — make sure email confirmations are disabled in Supabase Auth settings.')
      return data.user
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles'] })
      toast.success('Team member account created')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
