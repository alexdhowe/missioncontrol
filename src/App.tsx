import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from './stores/auth'
import { usePagesStore } from './stores/pages'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PageView from './pages/PageView'
import TasksPage from './pages/TasksPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore()

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  const { checkAuth, initialized } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="page/:id" element={<PageView />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="" element={<AutoNavigate />} />
                <Route path="*" element={<AutoNavigate />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function AutoNavigate() {
  const navigate = useNavigate()
  const pages = usePagesStore((s) => s.pages)

  useEffect(() => {
    if (pages.length > 0) {
      navigate(`/page/${pages[0].id}`, { replace: true })
    }
  }, [pages, navigate])

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p className="text-lg">Create your first page to get started</p>
      </div>
    )
  }

  return null
}
