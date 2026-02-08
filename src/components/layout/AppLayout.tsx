import { useState, useEffect } from 'react'
import Sidebar from '../sidebar/Sidebar'
import TopBar from './TopBar'
import CommandPalette from '../CommandPalette'
import QuickTaskCreator from '../tasks/QuickTaskCreator'
import { usePagesStore } from '../../stores/pages'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [quickTaskOpen, setQuickTaskOpen] = useState(false)
  const fetchPages = usePagesStore((s) => s.fetchPages)

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

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

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {sidebarOpen && <Sidebar onClose={() => setSidebarOpen(false)} />}

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
