import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, FileText, Star, LogOut, CheckSquare, LayoutDashboard, CalendarDays } from 'lucide-react'
import { usePagesStore } from '../../stores/pages'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/api'
import PageTreeItem from './PageTreeItem'
import TemplatePicker from '../TemplatePicker'
import type { PageTemplate } from '../../lib/templates'

interface SidebarProps {
  onClose: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { pages, createPage, fetchPages, getPageTree } = usePagesStore()
  const { user, logout } = useAuthStore()
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const tree = getPageTree()
  const favorites = pages.filter((p) => p.isFavorite)

  const handleCreatePage = () => {
    setShowTemplatePicker(true)
  }

  const handleTemplateSelect = async (template: PageTemplate) => {
    setShowTemplatePicker(false)
    const page = await createPage({
      title: template.id === 'blank' ? 'Untitled' : template.name,
      ...(template.id !== 'blank' ? { content: template.content } : {}),
    } as any)
    navigate(`/page/${page.id}`)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const currentPageId = location.pathname.startsWith('/page/')
    ? location.pathname.split('/page/')[1]
    : null

  return (
    <>
    <aside className="w-sidebar h-screen flex flex-col bg-sidebar/80 backdrop-blur-xl border-r border-white/[0.06] shrink-0">
      {/* Workspace header */}
      <div className="h-11 flex items-center justify-between px-3 border-b border-white/[0.06]">
        <span className="font-semibold text-sm truncate text-white">Mission Control</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Global views */}
        <div className="mb-3 px-1">
          <button
            onClick={() => navigate('/dashboard')}
            className={`btn-ghost flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded transition-all duration-200 ${
              location.pathname === '/dashboard' ? 'bg-white/[0.1] text-white font-medium' : ''
            }`}
          >
            <LayoutDashboard size={16} className="text-gray-500" />
            Dashboard
          </button>
          <button
            onClick={() => navigate('/tasks')}
            className={`btn-ghost flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded transition-all duration-200 ${
              location.pathname === '/tasks' ? 'bg-white/[0.1] text-white font-medium' : ''
            }`}
          >
            <CheckSquare size={16} className="text-gray-500" />
            Tasks
          </button>
          <button
            onClick={async () => {
              try {
                const page = await api.pages.daily()
                await fetchPages()
                navigate(`/page/${page.id}`)
              } catch {}
            }}
            className="btn-ghost flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded transition-all duration-200"
          >
            <CalendarDays size={16} className="text-gray-500" />
            Daily Notes
          </button>
        </div>

        {/* Favorites */}
        {favorites.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Star size={12} />
              <span>Favorites</span>
            </div>
            {favorites.map((page) => (
              <PageTreeItem
                key={page.id}
                page={{ ...page, children: [] }}
                depth={0}
                activeId={currentPageId}
              />
            ))}
          </div>
        )}

        {/* Pages */}
        <div>
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pages
            </span>
            <button
              onClick={handleCreatePage}
              className="p-0.5 rounded hover:bg-white/[0.06] text-gray-500 hover:text-gray-300 transition-all duration-200"
              title="New page"
            >
              <Plus size={14} />
            </button>
          </div>
          {tree.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500">No pages yet</p>
          ) : (
            tree.map((node) => (
              <PageTreeItem
                key={node.id}
                page={node}
                depth={0}
                activeId={currentPageId}
              />
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.06] p-2">
        <button
          onClick={handleCreatePage}
          className="btn-ghost flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded transition-all duration-200"
        >
          <Plus size={16} />
          <span>New page</span>
        </button>
        <button
          onClick={handleLogout}
          className="btn-ghost flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded transition-all duration-200"
        >
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </div>
    </aside>

    {showTemplatePicker && (
      <TemplatePicker
        onSelect={handleTemplateSelect}
        onClose={() => setShowTemplatePicker(false)}
      />
    )}
    </>
  )
}
