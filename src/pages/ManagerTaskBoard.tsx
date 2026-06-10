import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTasks, useDeleteTask } from '@/hooks/useTasks'
import type { TaskFilters } from '@/hooks/useTasks'
import { TaskFiltersBar } from '@/components/tasks/TaskFilters'
import { CreateEditTaskModal } from '@/components/tasks/CreateEditTaskModal'
import { PriorityBadge, StatusBadge, TaskTypeIcon, TaskTypeLabel } from '@/components/tasks/TaskBadges'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, MoreHorizontal, Pencil, Trash2, ExternalLink, ListTodo } from 'lucide-react'
import type { Task } from '@/types/database'
import { format, isPast, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

export default function ManagerTaskBoard() {
  const [filters, setFilters] = useState<TaskFilters>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const { data: tasks, isLoading } = useTasks(filters)
  const deleteTask = useDeleteTask()

  function handleEdit(task: Task) {
    setEditingTask(task)
    setModalOpen(true)
  }

  function handleCreate() {
    setEditingTask(null)
    setModalOpen(true)
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this task? This cannot be undone.')) {
      await deleteTask.mutateAsync(id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Task Board</h1>
          <p className="text-sm text-muted-foreground">
            {tasks ? `${tasks.length} task${tasks.length !== 1 ? 's' : ''}` : 'Loading…'}
          </p>
        </div>
        <Button onClick={handleCreate} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      <TaskFiltersBar filters={filters} onChange={setFilters} />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Task</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                  <TableCell />
                </TableRow>
              ))
            ) : tasks?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ListTodo className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No tasks found</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {Object.keys(filters).length > 0 ? 'Try adjusting your filters' : 'Create your first task to get started'}
                    </p>
                    {Object.keys(filters).length === 0 && (
                      <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={handleCreate}>
                        <Plus className="h-4 w-4" />
                        New Task
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tasks?.map(task => {
                const isOverdue = task.due_date && task.status !== 'complete' && isPast(parseISO(task.due_date))
                return (
                  <TableRow
                    key={task.id}
                    className={cn(
                      task.status === 'flagged' && 'bg-orange-50 border-l-2 border-l-orange-400',
                      isOverdue && 'bg-red-50'
                    )}
                  >
                    <TableCell className="font-medium">
                      <Link to={`/tasks/${task.id}`} className="hover:underline line-clamp-1">
                        {task.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <TaskTypeIcon taskType={task.task_type} />
                        <TaskTypeLabel taskType={task.task_type} />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {task.client?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {task.assignee?.name ?? <span className="text-muted-foreground">Unassigned</span>}
                    </TableCell>
                    <TableCell><PriorityBadge priority={task.priority} /></TableCell>
                    <TableCell><StatusBadge status={task.status} /></TableCell>
                    <TableCell className={cn('text-sm', isOverdue && 'text-red-600 font-medium')}>
                      {task.due_date ? format(parseISO(task.due_date), 'MMM d, yyyy') : '—'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/tasks/${task.id}`} className="flex items-center gap-2">
                              <ExternalLink className="h-4 w-4" />
                              View Detail
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(task)} className="gap-2">
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(task.id)}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CreateEditTaskModal
        open={modalOpen}
        onOpenChange={open => {
          setModalOpen(open)
          if (!open) setEditingTask(null)
        }}
        task={editingTask}
      />
    </div>
  )
}
