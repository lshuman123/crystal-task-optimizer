import { useState } from 'react'
import { useTimeEntries, useLogTime, useDeleteTimeEntry } from '@/hooks/useTimeTracking'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { format, parseISO } from 'date-fns'
import { Clock, Plus, Trash2 } from 'lucide-react'

interface Props {
  taskId: string
}

function formatMinutes(mins: number) {
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`
  return `${mins}m`
}

export function TimeTracker({ taskId }: Props) {
  const { profile } = useAuth()
  const { data: entries = [], isLoading } = useTimeEntries(taskId)
  const logTime = useLogTime()
  const deleteEntry = useDeleteTimeEntry()
  const [open, setOpen] = useState(false)
  const [duration, setDuration] = useState('')
  const [note, setNote] = useState('')

  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0)

  async function handleLog() {
    const mins = parseInt(duration)
    if (!mins || mins <= 0 || !profile) return
    await logTime.mutateAsync({
      taskId,
      employeeId: profile.id,
      durationMinutes: mins,
      note: note.trim() || undefined,
    })
    setOpen(false)
    setDuration('')
    setNote('')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Time Logged</span>
          {totalMinutes > 0 && (
            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
              {formatMinutes(totalMinutes)} total
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-3 w-3" />
          Log Time
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No time logged yet.</p>
      ) : (
        <div className="space-y-1">
          {entries.map(e => (
            <div
              key={e.id}
              className="flex items-center justify-between text-xs bg-muted/40 rounded px-2.5 py-1.5 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono font-semibold text-foreground shrink-0">
                  {formatMinutes(e.duration_minutes ?? 0)}
                </span>
                <span className="text-muted-foreground shrink-0">{e.employee?.name ?? '—'}</span>
                {e.note && (
                  <span className="text-muted-foreground italic truncate">{e.note}</span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-muted-foreground hidden sm:inline">
                  {format(parseISO(e.created_at), 'MMM d, h:mm a')}
                </span>
                {(profile?.id === e.employee_id || profile?.role === 'manager') && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => deleteEntry.mutateAsync({ id: e.id, taskId })}
                    disabled={deleteEntry.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Log Time</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="600"
                placeholder="e.g. 30"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time-note">Note (optional)</Label>
              <Textarea
                id="time-note"
                rows={2}
                placeholder="e.g. Posted 12 EOBs from Medicare batch"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleLog}
              disabled={!duration || parseInt(duration) <= 0 || logTime.isPending}
            >
              {logTime.isPending ? 'Saving…' : 'Log Time'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
