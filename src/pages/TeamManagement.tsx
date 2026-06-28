import { useState } from 'react'
import { useProfiles } from '@/hooks/useProfiles'
import { useCreateUser } from '@/hooks/useCreateUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, UserCheck, Eye, EyeOff } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { Role, Specialty } from '@/types/database'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  name:      z.string().min(1, 'Name is required'),
  email:     z.string().email('Valid email required'),
  password:  z.string().min(8, 'At least 8 characters'),
  role:      z.enum(['manager', 'employee']),
  specialty: z.string(),
})
type FormValues = z.infer<typeof schema>

const specialtyLabel: Record<string, string> = {
  payment_poster:  'Payment Poster',
  ar_specialist:   'AR Specialist',
  claims_scrubber: 'Claims Scrubber',
}

export default function TeamManagement() {
  const { data: profiles = [], isLoading } = useProfiles()
  const createUser = useCreateUser()
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', email: '', password: '', role: 'employee', specialty: '__none__',
    },
  })

  function handleClose() {
    setOpen(false)
    setShowPassword(false)
    reset()
  }

  async function onSubmit(values: FormValues) {
    try {
      await createUser.mutateAsync({
        name:      values.name,
        email:     values.email,
        password:  values.password,
        role:      values.role as Role,
        specialty: (values.specialty !== '__none__' ? values.specialty : null) as Specialty | null,
      })
      handleClose()
    } catch {
      // error toast handled in mutation
    }
  }

  const employees = profiles.filter(p => p.role === 'employee')
  const managers  = profiles.filter(p => p.role === 'manager')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Team</h1>
          <p className="text-sm text-muted-foreground">
            {profiles.length} member{profiles.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Member
        </Button>
      </div>

      {/* Employees */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Employees
            <span className="ml-auto text-xs font-normal text-muted-foreground">{employees.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : employees.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No employees yet. Add your first team member.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.email}</TableCell>
                    <TableCell>
                      {p.specialty ? (
                        <Badge variant="outline" className="text-xs capitalize">
                          {specialtyLabel[p.specialty] ?? p.specialty.replace(/_/g, ' ')}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(parseISO(p.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Managers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Managers
            <span className="ml-auto text-xs font-normal text-muted-foreground">{managers.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {managers.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No managers</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managers.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(parseISO(p.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={open} onOpenChange={o => { if (!o) handleClose() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="tm-name">Full Name *</Label>
              <Input id="tm-name" {...register('name')} placeholder="Jane Smith" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tm-email">Work Email *</Label>
              <Input id="tm-email" {...register('email')} type="email" placeholder="jane@crystalrcm.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tm-password">Temporary Password *</Label>
              <div className="flex gap-2">
                <Input
                  id="tm-password"
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={watch('role')}
                  onValueChange={v => setValue('role', v as Role)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Specialty</Label>
                <Select
                  value={watch('specialty')}
                  onValueChange={v => setValue('specialty', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    <SelectItem value="payment_poster">Payment Poster</SelectItem>
                    <SelectItem value="ar_specialist">AR Specialist</SelectItem>
                    <SelectItem value="claims_scrubber">Claims Scrubber</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground space-y-1">
              <p>Share these credentials with the team member so they can log in.</p>
              <p>For immediate access without email confirmation: Supabase → Authentication → Settings → disable "Enable email confirmations".</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? 'Creating…' : 'Create Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
