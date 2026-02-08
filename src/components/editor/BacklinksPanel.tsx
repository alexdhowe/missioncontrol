import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link2, ChevronRight, FileText, Loader2 } from 'lucide-react'

interface Backlink {
  id: string
  title: string
  icon: string | null
}

interface BacklinksPanelProps {
  pageId: string
}

export default function BacklinksPanel({ pageId }: BacklinksPanelProps) {
  const [backlinks, setBacklinks] = useState<Backlink[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    setBacklinks([])
    setExpanded(false)

    fetch(`/api/pages/${pageId}/backlinks`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setBacklinks(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        setBacklinks([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [pageId])

  if (loading) {
    return (
      <div className="border-t border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 size={14} className="animate-spin" />
          <span>Loading backlinks...</span>
        </div>
      </div>
    )
  }

  if (backlinks.length === 0) {
    return null
  }

  return (
    <div className="border-t border-gray-200">
      {/* Toggle Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
      >
        <ChevronRight
          size={14}
          className={`text-gray-400 transition-transform ${
            expanded ? 'rotate-90' : ''
          }`}
        />
        <Link2 size={14} className="text-gray-400" />
        <span className="text-xs font-medium text-gray-500">Backlinks</span>
        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full ml-auto">
          {backlinks.length}
        </span>
      </button>

      {/* Backlinks List */}
      {expanded && (
        <div className="px-4 pb-3">
          <div className="space-y-0.5">
            {backlinks.map((link) => (
              <button
                key={link.id}
                onClick={() => navigate(`/page/${link.id}`)}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-left text-sm hover:bg-gray-50 transition-colors group"
              >
                <span className="shrink-0">
                  {link.icon || (
                    <FileText
                      size={14}
                      className="text-gray-400 group-hover:text-gray-500"
                    />
                  )}
                </span>
                <span className="truncate text-gray-600 group-hover:text-gray-900">
                  {link.title || 'Untitled'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
