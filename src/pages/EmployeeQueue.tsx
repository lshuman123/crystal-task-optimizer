import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTasks, useCompleteTask, useFlagTask } from '@/hooks/useTasks'
import { useAuth } from '@/hooks/useAuth'
import {
  PriorityBadge,
  StatusBadge,
  TaskTypeIcon,
  TaskTypeLabel,
  DueSoonBadge,
  OverdueBadge,
} from '@/components/tasks/TaskBadges'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckSquare, Flag, ExternalLink } from 'lucide-react'
import type { Task } from '@/types/database'
import { format, isPast, parseISO, addHours } from 'date-fns'
import { cn } from '@/lib/utils'

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

function sortQueue(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const aIsAppeal = a.task_type === 'denial_appeal' ? 0 : 1
    const bIsAppeal = b.task_type === 'denial_appeal' ? 0 : 1
    if (aIsAppeal !== bIsAppeal) return aIsAppeal - bIsAppeal
    const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (pDiff !== 0) return pDiff
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
    if (a.due_date) return -1
    if (b.due_date) return 1
    return 0
  })
}

function taskAlertState(task: Task): 'overdue' | 'due-soon' | null {
  if (!task.due_date || task.status === 'complete') return null
  const due = parseISO(task.due_date)
  if (isPast(due)) return 'overdue'
  if (due <= addHours(new Date(), 24)) return 'due-soon'
  return null
}

export default function EmployeeQueue() {
  const { profile } = useAuth()
  const { data: allTasks, isLoading } = useTasks()
  const completeTask = useCompleteTask()
  const flagTask = useFlagTask()

  const [completeModal, setCompleteModal] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null })
  const [flagModal, setFlagModal] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null })
  const [completeNote, setCompleteNote] = useState('')
  const [flagReason, setFlagReason] = useState('')

  const tasks = sortQueue(
    (allTasks ?? []).filter(t => t.assigned_to === profile?.id && t.status !== 'complete')
  )

  async function handleComplete() {
    if (!completeModal.task) return
    await completeTask.mutateAsync({ id: completeModal.task.id, note: completeNote })
    setCompleteModal({ open: false, task: null })
    setCompleteNote('')
  }

  async function handleFlag() {
    if (!flagModal.task || !flagReason.trim()) return
    await flagTask.mutateAsync({ id: flagModal.task.id, reason: flagReason })
    setFlagModal({ open: false, task: null })
    setFlagReason('')
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">My Queue</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Loading…' : `${tasks.length} active task${tasks.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
            <CheckSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Queue is clear</p>
            <p className="text-xs text-muted-foreground/70 mt-1">No active tasks assigned to you</p>
          </div>
        ) : (
          tasks.map(task => {
            const alert = taskAlertState(task)
            const isOverdue = alert === 'overdue'
            const isDueSoon = alert === 'due-soon'

            return (
              <div
                key={task.id}
                className={cn(
                  'rounded-lg border bg-card p-4 transition-colors',
                  isOverdue && 'bg-red-50 border-red-200',
                  !isOverdue && task.status === 'flagged' && 'border-orange-300 bg-orange-50',
                  !isOverdue && isDueSoon && 'border-orange-200'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <Link
                        to={`/tasks/${task.id}`}
                        className="font-medium hover:underline line-clamp-1"
                      >
                        {task.task_type === 'denial_appeal' && (
                          <span className="mr-1 text-amber-600">⚑</span>
                        )}
                        {task.title}
                      </Link>
                      {isOverdue && <OverdueBadge />}
                      {isDueSoon && !isOverdue && <DueSoonBadge />}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TaskTypeIcon taskType={task.task_type} className="h-3.5 w-3.5" />
                        <TaskTypeLabel taskType={task.task_type} />
                      </span>
                      {task.client?.name && <span>{task.client.name}</span>}
                      {task.due_date && (
                        <span className={cn(isOverdue && 'text-red-600 font-medium')}>
                          Due {format(parseISO(task.due_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                    <Link to={`/tasks/${task.id}`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    {task.status !== 'flagged' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1.5 text-xs"
                          onClick={() => setFlagModal({ open: true, task })}
                        >
                          <Flag className="h-3.5 w-3.5" />
                          Block
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          onClick={() => setCompleteModal({ open: true, task })}
                        >
                          <CheckSquare className="h-3.5 w-3.5" />
                          Complete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Mark Complete Modal */}
      <Dialog open={completeModal.open} onOpenChange={open => setCompleteModal(s => ({ ...s, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Task Complete</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{completeModal.task?.title}</span>
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="complete-note">Completion note (optional)</Label>
              <Textarea
                id="complete-note"
                rows={3}
                placeholder="Any notes about how this was resolved…"
                value={completeNote}
                onChange={e => setCompleteNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteModal({ open: false, task: null })}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={completeTask.isPending}>
              {completeTask.isPending ? 'Saving…' : 'Mark Complete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flag as Blocked Modal */}
      <Dialog open={flagModal.open} onOpenChange={open => setFlagModal(s => ({ ...s, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Blocked</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Task: <span className="font-medium text-foreground">{flagModal.task?.title}</span>
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="flag-reason">Reason *</Label>
              <Textarea
                id="flag-reason"
                rows={3}
                placeholder="e.g. Missing EOB documentation, awaiting provider callback…"
                value={flagReason}
                onChange={e => setFlagReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagModal({ open: false, task: null })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleFlag}
              disabled={!flagReason.trim() || flagTask.isPending}
            >
              {flagTask.isPending ? 'Saving…' : 'Mark Blocked'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
