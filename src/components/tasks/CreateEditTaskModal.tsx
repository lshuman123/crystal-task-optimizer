import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks'
import { useClients } from '@/hooks/useClients'
import { useEmployees } from '@/hooks/useProfiles'
import type { Task, Priority, TaskType, TaskStatus } from '@/types/database'

const schema = z.object({
  title:       z.string().min(1, 'Title is required'),
  task_type:   z.enum(['payment_posting', 'claims_scrubbing', 'era_pulling', 'eligibility_verification', 'ar_followup', 'denial_appeal']),
  client_id:   z.string().optional(),
  assigned_to: z.string().optional(),
  priority:    z.enum(['high', 'medium', 'low']),
  status:      z.enum(['pending', 'in_progress', 'complete', 'flagged']),
  due_date:    z.string().optional(),
  notes:       z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
}

export function CreateEditTaskModal({ open, onOpenChange, task }: Props) {
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const { data: clients = [] } = useClients()
  const { data: employees = [] } = useEmployees()
  const isEdit = !!task

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '', task_type: 'payment_posting', client_id: '__none__', assigned_to: '__none__', priority: 'medium', status: 'pending',
    },
  })

  useEffect(() => {
    if (task) {
      reset({
        title:       task.title,
        task_type:   task.task_type,
        client_id:   task.client_id ?? '__none__',
        assigned_to: task.assigned_to ?? '__none__',
        priority:    task.priority,
        status:      task.status,
        due_date:    task.due_date ?? '',
        notes:       task.notes ?? '',
      })
    } else {
      reset({ title: '', task_type: 'payment_posting', client_id: '__none__', assigned_to: '__none__', priority: 'medium', status: 'pending' })
    }
  }, [task, reset, open])

  async function onSubmit(values: FormValues) {
    const payload = {
      title:       values.title,
      task_type:   values.task_type as TaskType,
      client_id:   (values.client_id && values.client_id !== '__none__') ? values.client_id : null,
      assigned_to: (values.assigned_to && values.assigned_to !== '__none__') ? values.assigned_to : null,
      priority:    values.priority as Priority,
      status:      values.status as TaskStatus,
      due_date:    values.due_date || null,
      notes:       values.notes || null,
    }

    try {
      if (isEdit && task) {
        await updateTask.mutateAsync({ id: task.id, ...payload })
      } else {
        await createTask.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch {
      // error already shown via toast in mutation's onError
    }
  }

  const isPending = createTask.isPending || updateTask.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Task' : 'Create Task'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" {...register('title')} placeholder="e.g. Post EOB for patient #4821" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {/* Task type + status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Task Type *</Label>
              <Select value={watch('task_type')} onValueChange={v => setValue('task_type', v as TaskType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment_posting">Payment Posting</SelectItem>
                  <SelectItem value="claims_scrubbing">Claims Scrubbing</SelectItem>
                  <SelectItem value="era_pulling">ERA Pulling</SelectItem>
                  <SelectItem value="eligibility_verification">Eligibility Verification</SelectItem>
                  <SelectItem value="ar_followup">AR Follow-up</SelectItem>
                  <SelectItem value="denial_appeal">Denial Appeal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={watch('status')} onValueChange={v => setValue('status', v as TaskStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="flagged">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client */}
          <div className="space-y-1.5">
            <Label>Client</Label>
            <Select value={watch('client_id') || '__none__'} onValueChange={v => setValue('client_id', v)}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None —</SelectItem>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assign to */}
          <div className="space-y-1.5">
            <Label>Assign To</Label>
            <Select value={watch('assigned_to') || '__none__'} onValueChange={v => setValue('assigned_to', v)}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Unassigned —</SelectItem>
                {employees.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority + due date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={watch('priority')} onValueChange={v => setValue('priority', v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due_date">Due Date</Label>
              <Input id="due_date" type="date" {...register('due_date')} />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} placeholder="Any additional context…" {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
