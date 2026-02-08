import { useState, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import { useTasksStore } from '../../stores/tasks'
import type { TaskPriority } from '../../types'

interface QuickTaskCreatorProps {
  onClose: () => void
}

export default function QuickTaskCreator({ onClose }: QuickTaskCreatorProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('none')
  const [dueDate, setDueDate] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { createTask } = useTasksStore()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    await createTask({
      title: title.trim(),
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    })
    setTitle('')
    setPriority('none')
    setDueDate('')
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-overlay border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <Plus size={18} className="text-accent shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What needs to be done?"
                className="flex-1 outline-none text-sm bg-transparent text-white placeholder-gray-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="select-dark"
            >
              <option value="none">No priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input-dark"
            />

            <div className="flex-1" />

            <button
              type="submit"
              disabled={!title.trim()}
              className="btn-gradient px-3 py-1 rounded-md text-xs font-medium disabled:opacity-50 transition-all duration-200"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
