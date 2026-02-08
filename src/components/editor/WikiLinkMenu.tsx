import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { FileText } from 'lucide-react'
import type { WikiLinkItem } from './extensions/WikiLink'

interface WikiLinkMenuProps {
  items: WikiLinkItem[]
  command: (item: WikiLinkItem) => void
}

export const WikiLinkMenu = forwardRef(
  ({ items, command }: WikiLinkMenuProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    const selectItem = (index: number) => {
      const item = items[index]
      if (item) command(item)
    }

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i - 1 + items.length) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex)
          return true
        }
        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="glass-prominent rounded-xl p-3 text-sm text-white/35">
          No pages found
        </div>
      )
    }

    return (
      <div className="glass-prominent rounded-xl py-1 w-64 max-h-60 overflow-y-auto">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => selectItem(index)}
            className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-all duration-200 ${
              index === selectedIndex
                ? 'bg-accent/[0.1] text-accent-hover'
                : 'text-white/70 hover:bg-white/[0.05]'
            }`}
          >
            <span className="shrink-0">
              {item.icon || <FileText size={14} className="text-white/25" />}
            </span>
            <span className="truncate">{item.title || 'Untitled'}</span>
          </button>
        ))}
      </div>
    )
  }
)

WikiLinkMenu.displayName = 'WikiLinkMenu'
