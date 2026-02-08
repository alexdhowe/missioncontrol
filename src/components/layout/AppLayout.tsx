import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from '../sidebar/Sidebar'
import TopBar from './TopBar'
import CommandPalette from '../CommandPalette'
import QuickTaskCreator from '../tasks/QuickTaskCreator'
import { usePagesStore } from '../../stores/pages'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [quickTaskOpen, setQuickTaskOpen] = useState(false)
  const fetchPages = usePagesStore((s) => s.fetchPages)
  const location = useLocation()

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [location.pathname, isMobile])

  // Close sidebar when switching to mobile breakpoint
  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
    else setSidebarOpen(true)
  }, [isMobile])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault()
        setQuickTaskOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop: inline sidebar */}
      {!isMobile && sidebarOpen && <Sidebar onClose={closeSidebar} />}

      {/* Mobile: overlay sidebar */}
      {isMobile && sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 animate-fade-in"
            onClick={closeSidebar}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-[280px] animate-slide-in-left">
            <Sidebar onClose={closeSidebar} />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {commandPaletteOpen && (
        <CommandPalette onClose={() => setCommandPaletteOpen(false)} />
      )}
      {quickTaskOpen && (
        <QuickTaskCreator onClose={() => setQuickTaskOpen(false)} />
      )}
    </div>
  )
}
