import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  AlertCircle,
  ToggleRight,
  Info,
  Table2,
  ImageIcon,
} from 'lucide-react'
import type { SlashCommandItem } from './extensions/SlashCommand'

const ITEMS: SlashCommandItem[] = [
  {
    title: 'Text',
    description: 'Plain text block',
    icon: 'Type',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run()
    },
  },
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: 'Heading1',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run()
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: 'Heading2',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run()
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: 'Heading3',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run()
    },
  },
  {
    title: 'Bullet List',
    description: 'Unordered list',
    icon: 'List',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: 'Numbered List',
    description: 'Ordered list',
    icon: 'ListOrdered',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: 'Task List',
    description: 'Checklist with checkboxes',
    icon: 'CheckSquare',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
  },
  {
    title: 'Quote',
    description: 'Blockquote',
    icon: 'Quote',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setBlockquote().run()
    },
  },
  {
    title: 'Code Block',
    description: 'Code with syntax highlighting',
    icon: 'Code',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCodeBlock().run()
    },
  },
  {
    title: 'Toggle',
    description: 'Collapsible content',
    icon: 'ToggleRight',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setToggle().run()
    },
  },
  {
    title: 'Callout',
    description: 'Highlighted info block',
    icon: 'Info',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCallout({ variant: 'info' }).run()
    },
  },
  {
    title: 'Table',
    description: '3x3 table',
    icon: 'Table2',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    },
  },
  {
    title: 'Image',
    description: 'Embed an image from URL',
    icon: 'ImageIcon',
    command: ({ editor, range }) => {
      const url = window.prompt('Enter image URL:')
      if (url) {
        editor.chain().focus().deleteRange(range).setImage({ src: url }).run()
      }
    },
  },
  {
    title: 'Divider',
    description: 'Horizontal line separator',
    icon: 'Minus',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
]

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  AlertCircle,
  ToggleRight,
  Info,
  Table2,
  ImageIcon,
}

interface SlashCommandMenuProps {
  items: SlashCommandItem[]
  command: (item: SlashCommandItem) => void
}

export const SlashCommandMenu = forwardRef(
  ({ items, command }: SlashCommandMenuProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index]
        if (item) {
          command(item)
        }
      },
      [items, command]
    )

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
          No matching blocks
        </div>
      )
    }

    return (
      <div className="glass-prominent rounded-xl py-1 w-64 max-h-80 overflow-y-auto">
        {items.map((item, index) => {
          const Icon = ICON_MAP[item.icon] || Type
          return (
            <button
              key={item.title}
              onClick={() => selectItem(index)}
              className={`flex items-center gap-3 w-full px-3 py-2 text-left text-sm transition-all duration-200 ${
                index === selectedIndex
                  ? 'bg-accent/[0.1] text-accent-hover'
                  : 'text-white/70 hover:bg-white/[0.05]'
              }`}
            >
              <div className="w-8 h-8 bg-white/[0.06] rounded-lg flex items-center justify-center shrink-0">
                <Icon size={16} />
              </div>
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-white/35">{item.description}</div>
              </div>
            </button>
          )
        })}
      </div>
    )
  }
)

SlashCommandMenu.displayName = 'SlashCommandMenu'

export function getSuggestionItems({ query }: { query: string }) {
  return ITEMS.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  )
}
