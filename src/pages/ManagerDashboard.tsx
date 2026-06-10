import { useMetrics } from '@/hooks/useMetrics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  Flag,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ManagerDashboard() {
  const { data: metrics, isLoading, isError, error } = useMetrics()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (isError || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-medium">Failed to load dashboard</p>
        <p className="text-xs text-muted-foreground max-w-sm text-center font-mono">
          {error?.message ?? 'Unknown error — check the browser console (F12) for details.'}
        </p>
      </div>
    )
  }

  const { completedToday, totalOpen, totalInProgress, totalOverdue, byEmployee } = metrics

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Completed Today" value={completedToday} icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} />
        <StatCard label="Open" value={totalOpen} icon={<Circle className="h-4 w-4 text-zinc-400" />} />
        <StatCard label="In Progress" value={totalInProgress} icon={<Loader2 className="h-4 w-4 text-blue-500" />} />
        <StatCard label="Overdue" value={totalOverdue} icon={<AlertTriangle className="h-4 w-4 text-red-500" />} alert={totalOverdue > 0} />
      </div>

      {/* By employee */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            Tasks by Employee
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {byEmployee.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No employees yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                  <TableHead className="text-right">In Progress</TableHead>
                  <TableHead className="text-right">Overdue</TableHead>
                  <TableHead className="text-right">Done Today</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byEmployee.map(row => (
                  <TableRow key={row.employee.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{row.employee.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {row.employee.specialty?.replace(/_/g, ' ') ?? '—'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">{row.open}</TableCell>
                    <TableCell className="text-right text-sm">{row.inProgress}</TableCell>
                    <TableCell className={cn('text-right text-sm font-medium', row.overdue > 0 && 'text-red-600')}>
                      {row.overdue}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-green-700">
                      {row.completedToday}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Blocked tasks callout */}
      {totalOpen > 0 && <BlockedTasksPanel />}
    </div>
  )
}

function StatCard({ label, value, icon, alert }: {
  label: string
  value: number
  icon: React.ReactNode
  alert?: boolean
}) {
  return (
    <Card className={cn(alert && 'border-red-300')}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">{label}</p>
          {icon}
        </div>
        <p className={cn('text-2xl font-bold', alert && 'text-red-600')}>{value}</p>
      </CardContent>
    </Card>
  )
}

import { useTasks } from '@/hooks/useTasks'
import { Link } from 'react-router-dom'
import { PriorityBadge } from '@/components/tasks/TaskBadges'

function BlockedTasksPanel() {
  const { data: tasks } = useTasks({ status: 'flagged' })
  if (!tasks?.length) return null

  return (
    <Card className="border-orange-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
          <Flag className="h-4 w-4" />
          Blocked Tasks — Needs Attention
          <span className="ml-auto text-xs font-normal text-orange-600">{tasks.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y max-h-64 overflow-y-auto">
          {tasks.map(task => (
            <Link
              key={task.id}
              to={`/tasks/${task.id}`}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-orange-50/50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {task.assignee?.name ?? 'Unassigned'} · {task.client?.name ?? '—'}
                </p>
              </div>
              <div className="ml-3 shrink-0">
                <PriorityBadge priority={task.priority} />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
