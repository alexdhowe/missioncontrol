import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, FileText, MoreHorizontal, Plus, Trash2, Star } from 'lucide-react'
import type { PageTreeNode } from '../../types'
import { usePagesStore } from '../../stores/pages'

interface PageTreeItemProps {
  page: PageTreeNode
  depth: number
  activeId: string | null
}

export default function PageTreeItem({ page, depth, activeId }: PageTreeItemProps) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const { createPage, deletePage, updatePage } = usePagesStore()

  const isActive = page.id === activeId
  const hasChildren = page.children.length > 0

  const handleClick = () => {
    navigate(`/page/${page.id}`)
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded(!expanded)
  }

  const handleAddChild = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    const child = await createPage({ title: 'Untitled', parentId: page.id })
    setExpanded(true)
    navigate(`/page/${child.id}`)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    await deletePage(page.id)
    if (isActive) navigate('/')
  }

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    await updatePage(page.id, { isFavorite: !page.isFavorite } as any)
  }

  return (
    <div>
      <div
        className={`group flex items-center h-8 cursor-pointer hover:bg-white/[0.06] transition-all duration-200 ${
          isActive ? 'bg-white/[0.1] text-white' : 'text-gray-300'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {/* Expand toggle */}
        <button
          onClick={handleToggle}
          className={`p-0.5 rounded hover:bg-white/[0.1] shrink-0 transition-all duration-200 ${
            hasChildren ? 'text-gray-600' : 'text-transparent'
          }`}
        >
          <ChevronRight
            size={14}
            className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
          />
        </button>

        {/* Icon + title */}
        <span className="ml-0.5 mr-1.5 text-sm shrink-0">
          {page.icon || <FileText size={14} className="text-gray-500" />}
        </span>
        <span className="text-sm truncate flex-1">{page.title || 'Untitled'}</span>

        {/* Actions */}
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 mr-1">
          <button
            onClick={handleAddChild}
            className="p-0.5 rounded hover:bg-white/[0.1] text-gray-500 transition-all duration-200"
            title="Add subpage"
          >
            <Plus size={14} />
          </button>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-0.5 rounded hover:bg-white/[0.1] text-gray-500 transition-all duration-200"
            >
              <MoreHorizontal size={14} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-6 z-20 bg-surface-overlay border border-white/[0.08] rounded-lg shadow-glow-lg py-1 w-40">
                  <button
                    onClick={handleToggleFavorite}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-white/[0.06] text-gray-300 text-left transition-all duration-200"
                  >
                    <Star size={14} />
                    {page.isFavorite ? 'Unfavorite' : 'Favorite'}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-white/[0.06] text-red-400 text-left transition-all duration-200"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {expanded &&
        hasChildren &&
        page.children.map((child) => (
          <PageTreeItem
            key={child.id}
            page={child}
            depth={depth + 1}
            activeId={activeId}
          />
        ))}
    </div>
  )
}
