import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText } from 'lucide-react'
import { usePagesStore } from '../stores/pages'

interface CommandPaletteProps {
  onClose: () => void
}

export default function CommandPalette({ onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const pages = usePagesStore((s) => s.pages)

  const results = query.trim()
    ? pages.filter((p) =>
        p.title.toLowerCase().includes(query.toLowerCase())
      )
    : pages.slice(0, 10)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSelect = (pageId: string) => {
    navigate(`/page/${pageId}`)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex].id)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-overlay/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-glow-lg w-full max-w-lg overflow-hidden animate-scale-in">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <Search size={18} className="text-gray-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages..."
            className="flex-1 outline-none text-sm bg-transparent text-white placeholder-gray-600"
          />
          <kbd className="text-xs bg-white/[0.06] text-gray-500 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">
              No pages found
            </p>
          ) : (
            results.map((page, i) => (
              <button
                key={page.id}
                onClick={() => handleSelect(page.id)}
                className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-left transition-all duration-200 ${
                  i === selectedIndex ? 'bg-accent/15 text-accent-hover' : 'text-gray-300 hover:bg-white/[0.04]'
                }`}
              >
                <span className="shrink-0">
                  {page.icon || <FileText size={16} className="text-gray-500" />}
                </span>
                <span className="truncate">{page.title}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
