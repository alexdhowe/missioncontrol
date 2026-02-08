import { useState, useEffect, useRef } from 'react'
import { Link, FileText } from 'lucide-react'
import { usePagesStore } from '../../stores/pages'

interface LinkPickerProps {
  onSelect: (page: { id: string; title: string }) => void
  onClose: () => void
}

export default function LinkPicker({ onSelect, onClose }: LinkPickerProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
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

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement
      selected?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleSelect = (page: { id: string; title: string }) => {
    onSelect({ id: page.id, title: page.title })
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
      e.preventDefault()
      handleSelect(results[selectedIndex])
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-prominent rounded-2xl w-full max-w-lg overflow-hidden animate-scale-in">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <Link size={18} className="text-white/30 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages to link..."
            className="flex-1 bg-transparent text-white/90 placeholder-white/25 outline-none text-sm"
          />
          <kbd className="text-xs bg-white/[0.06] text-white/25 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>
        <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-white/25">
              No pages found
            </p>
          ) : (
            results.map((page, i) => (
              <button
                key={page.id}
                onClick={() => handleSelect(page)}
                className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-left transition-all duration-200 ${
                  i === selectedIndex
                    ? 'bg-accent/[0.1] text-accent-hover'
                    : 'text-white/70 hover:bg-white/[0.05]'
                }`}
              >
                <span className="shrink-0">
                  {page.icon || <FileText size={16} className="text-white/25" />}
                </span>
                <span className="truncate">{page.title || 'Untitled'}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
