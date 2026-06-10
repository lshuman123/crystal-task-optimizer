import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import LoginPage from '@/pages/LoginPage'
import ManagerDashboard from '@/pages/ManagerDashboard'
import ManagerTaskBoard from '@/pages/ManagerTaskBoard'
import EmployeeQueue from '@/pages/EmployeeQueue'
import TaskDetail from '@/pages/TaskDetail'
import { RealtimeProvider } from '@/components/realtime/RealtimeProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
          <RealtimeProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              {/* Manager routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRole="manager">
                    <AppShell><ManagerDashboard /></AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute requiredRole="manager">
                    <AppShell><ManagerTaskBoard /></AppShell>
                  </ProtectedRoute>
                }
              />

              {/* Employee routes */}
              <Route
                path="/queue"
                element={
                  <ProtectedRoute requiredRole="employee">
                    <AppShell><EmployeeQueue /></AppShell>
                  </ProtectedRoute>
                }
              />

              {/* Shared task detail */}
              <Route
                path="/tasks/:id"
                element={
                  <ProtectedRoute>
                    <AppShell><TaskDetail /></AppShell>
                  </ProtectedRoute>
                }
              />

              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </RealtimeProvider>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
