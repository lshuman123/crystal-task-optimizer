import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTask, useUpdateTask, useCompleteTask, useFlagTask } from '@/hooks/useTasks'
import { useAuth } from '@/hooks/useAuth'
import { CreateEditTaskModal } from '@/components/tasks/CreateEditTaskModal'
import { PriorityBadge, StatusBadge, TaskTypeIcon, TaskTypeLabel } from '@/components/tasks/TaskBadges'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Pencil, CheckSquare, Flag } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { TaskStatus } from '@/types/database'
import { toast } from 'sonner'

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: task, isLoading } = useTask(id!)
  const updateTask = useUpdateTask()
  const completeTask = useCompleteTask()
  const flagTask = useFlagTask()

  const [editOpen, setEditOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [flagOpen, setFlagOpen] = useState(false)
  const [note, setNote] = useState('')
  const [flagReason, setFlagReason] = useState('')
  const [notesEdit, setNotesEdit] = useState<string | null>(null)

  const isManager = profile?.role === 'manager'
  const isAssignee = task?.assigned_to === profile?.id

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">Task not found.</p>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Go back
        </Button>
      </div>
    )
  }

  async function handleStatusChange(status: TaskStatus) {
    await updateTask.mutateAsync({ id: task!.id, status })
    toast.success('Status updated')
  }

  async function handleSaveNotes() {
    if (notesEdit === null) return
    await updateTask.mutateAsync({ id: task!.id, notes: notesEdit })
    setNotesEdit(null)
    toast.success('Notes saved')
  }

  async function handleComplete() {
    await completeTask.mutateAsync({ id: task!.id, note })
    setCompleteOpen(false)
    setNote('')
  }

  async function handleFlag() {
    if (!flagReason.trim()) return
    await flagTask.mutateAsync({ id: task!.id, reason: flagReason })
    setFlagOpen(false)
    setFlagReason('')
  }

  const backHref = isManager ? '/tasks' : '/queue'

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to={backHref}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            {isManager ? 'Task Board' : 'My Queue'}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold leading-snug">{task.title}</CardTitle>
              <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                <TaskTypeIcon taskType={task.task_type} />
                <TaskTypeLabel taskType={task.task_type} />
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Core fields */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Client</p>
              <p>{task.client?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Assigned To</p>
              <p>{task.assignee?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Due Date</p>
              <p>{task.due_date ? format(parseISO(task.due_date), 'MMMM d, yyyy') : '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Created</p>
              <p>{format(parseISO(task.created_at), 'MMMM d, yyyy')}</p>
            </div>
            {task.completed_at && (
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Completed</p>
                <p>{format(parseISO(task.completed_at), 'MMM d, h:mm a')}</p>
              </div>
            )}
          </div>

          {/* Status update */}
          {(isManager || isAssignee) && task.status !== 'complete' && (
            <div className="space-y-1.5">
              <Label>Update Status</Label>
              <Select value={task.status} onValueChange={v => handleStatusChange(v as TaskStatus)}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="flagged">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Notes</Label>
              {notesEdit === null ? (
                <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={() => setNotesEdit(task.notes ?? '')}>
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
              ) : (
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setNotesEdit(null)}>Cancel</Button>
                  <Button size="sm" className="h-6 text-xs" onClick={handleSaveNotes} disabled={updateTask.isPending}>Save</Button>
                </div>
              )}
            </div>
            {notesEdit !== null ? (
              <Textarea rows={4} value={notesEdit} onChange={e => setNotesEdit(e.target.value)} placeholder="Add notes…" />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap min-h-[2rem]">
                {task.notes || 'No notes yet.'}
              </p>
            )}
          </div>

          {/* Action buttons */}
          {task.status !== 'complete' && (isManager || isAssignee) && (
            <div className="flex gap-2 pt-2 border-t flex-wrap">
              {isManager && (
                <Button size="sm" variant="outline" onClick={() => setEditOpen(true)} className="gap-1.5">
                  <Pencil className="h-4 w-4" /> Edit Task
                </Button>
              )}
              {task.status !== 'flagged' && (
                <Button size="sm" variant="outline" onClick={() => setFlagOpen(true)} className="gap-1.5">
                  <Flag className="h-4 w-4" /> Mark Blocked
                </Button>
              )}
              <Button size="sm" onClick={() => setCompleteOpen(true)} className="gap-1.5">
                <CheckSquare className="h-4 w-4" /> Mark Complete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateEditTaskModal open={editOpen} onOpenChange={setEditOpen} task={task} />

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark Complete</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Completion note (optional)</Label>
              <Textarea rows={3} placeholder="Any notes…" value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>Cancel</Button>
            <Button onClick={handleComplete} disabled={completeTask.isPending}>
              {completeTask.isPending ? 'Saving…' : 'Mark Complete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={flagOpen} onOpenChange={setFlagOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark as Blocked</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Reason *</Label>
              <Textarea rows={3} placeholder="e.g. Missing documentation, awaiting callback…" value={flagReason} onChange={e => setFlagReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleFlag} disabled={!flagReason.trim() || flagTask.isPending}>
              {flagTask.isPending ? 'Saving…' : 'Mark Blocked'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
