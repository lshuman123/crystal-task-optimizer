import { useState, useRef, useEffect } from 'react'
import { useTaskComments, useAddComment, useDeleteComment } from '@/hooks/useTaskComments'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { format, parseISO } from 'date-fns'
import { Trash2, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  taskId: string
}

export function TaskComments({ taskId }: Props) {
  const { profile } = useAuth()
  const { data: comments = [], isLoading } = useTaskComments(taskId)
  const addComment = useAddComment()
  const deleteComment = useDeleteComment()
  const [body, setBody] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  async function handleAdd() {
    if (!body.trim() || !profile) return
    await addComment.mutateAsync({ taskId, body: body.trim(), authorId: profile.id })
    setBody('')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Activity Log</span>
        {comments.length > 0 && (
          <span className="text-xs text-muted-foreground">({comments.length})</span>
        )}
      </div>

      <div className="rounded-md border bg-muted/20 max-h-72 overflow-y-auto divide-y">
        {isLoading ? (
          <div className="p-3 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No activity yet. Add a note about progress, calls made, or blockers.
          </div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="px-3 py-2.5 group hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={cn(
                      'text-xs font-semibold',
                      c.author?.role === 'manager' ? 'text-blue-700' : 'text-foreground'
                    )}>
                      {c.author?.name ?? 'Unknown'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(c.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{c.body}</p>
                </div>
                {(profile?.id === c.author_id || profile?.role === 'manager') && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => deleteComment.mutateAsync({ id: c.id, taskId })}
                    disabled={deleteComment.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 items-end">
        <Textarea
          rows={2}
          placeholder="Log a call, note progress, flag a payer issue… (⌘+Enter to submit)"
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd()
          }}
          className="resize-none text-sm flex-1"
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!body.trim() || addComment.isPending}
          className="shrink-0"
        >
          {addComment.isPending ? '…' : 'Add'}
        </Button>
      </div>
    </div>
  )
}
