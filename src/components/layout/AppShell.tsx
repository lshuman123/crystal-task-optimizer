import { type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Activity,
  LayoutDashboard,
  ListTodo,
  LogOut,
  CheckSquare,
  Bell,
} from 'lucide-react'
import { useNotificationCount } from '@/hooks/useNotificationCount'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const managerNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Task Board', href: '/tasks', icon: ListTodo },
]

const employeeNav: NavItem[] = [
  { label: 'My Queue', href: '/queue', icon: CheckSquare },
]

function NavLink({ item }: { item: NavItem }) {
  const location = useLocation()
  const active = location.pathname === item.href
  const Icon = item.icon
  return (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  )
}

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { profile, signOut } = useAuth()
  const notificationCount = useNotificationCount()
  const navItems = profile?.role === 'manager' ? managerNav : employeeNav

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r bg-sidebar">
        <div className="flex h-14 items-center gap-2.5 border-b px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary">
            <Activity className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-sidebar-foreground">Crystal RCM</span>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map(item => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        <div className="border-t p-3 space-y-1">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{profile?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2.5 text-muted-foreground hover:text-foreground"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b bg-background px-6">
          <div className="flex items-center gap-2">
            {profile?.role === 'manager' && notificationCount > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Bell className="h-4 w-4" />
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground">
                  {notificationCount}
                </span>
                <span>alerts</span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
