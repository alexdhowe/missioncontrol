import { useNavigate, useLocation } from 'react-router-dom'
import {
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react'
import { usePagesStore } from '../../stores/pages'

interface TopBarProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export default function TopBar({ sidebarOpen, onToggleSidebar }: TopBarProps) {
  const navigate = useNavigate()
  const currentPage = usePagesStore((s) => s.currentPage)

  return (
    <header className="glass-clear h-11 flex items-center gap-1 px-2 border-b border-white/[0.06] shrink-0">
      <button
        onClick={onToggleSidebar}
        className="rounded-lg p-1.5 hover:bg-white/[0.06] text-white/40 transition-all duration-200"
        title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {sidebarOpen ? (
          <PanelLeftClose size={16} />
        ) : (
          <PanelLeftOpen size={16} />
        )}
      </button>

      <button
        onClick={() => navigate(-1)}
        className="rounded-lg p-1.5 hover:bg-white/[0.06] text-white/40 transition-all duration-200"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={() => navigate(1)}
        className="rounded-lg p-1.5 hover:bg-white/[0.06] text-white/40 transition-all duration-200"
      >
        <ChevronRight size={16} />
      </button>

      {currentPage && (
        <div className="flex items-center gap-1 text-sm text-white/55 ml-1">
          <span>{currentPage.icon || '📄'}</span>
          <span className="truncate max-w-xs">{currentPage.title}</span>
        </div>
      )}

      <div className="flex-1" />

      <button
        onClick={() => {
          document.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'k', metaKey: true })
          )
        }}
        className="glass flex items-center gap-2 px-2.5 py-1 rounded-xl text-sm text-white/40 hover:bg-white/[0.06] transition-all duration-200"
      >
        <Search size={14} />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline text-xs bg-white/[0.06] text-white/30 px-1.5 py-0.5 rounded">
          ⌘K
        </kbd>
      </button>
    </header>
  )
}
