import { useEffect, useState } from 'react'
import { X, Trash2, Circle, CheckCircle2, Plus } from 'lucide-react'
import { useTasksStore } from '../../stores/tasks'
import type { TaskStatus, TaskPriority } from '../../types'
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../types'

interface TaskPanelProps {
  taskId: string
  onClose: () => void
}

export default function TaskPanel({ taskId, onClose }: TaskPanelProps) {
  const { tasks, updateTask, deleteTask } = useTasksStore()
  const task = tasks.find((t) => t.id === taskId)
  const [title, setTitle] = useState('')
  const [titleTimer, setTitleTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [subtasks, setSubtasks] = useState<any[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  useEffect(() => {
    if (task) setTitle(task.title)
  }, [taskId, task?.title])

  useEffect(() => {
    fetch(`/api/tasks/subtasks/${taskId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setSubtasks(Array.isArray(data) ? data : []))
      .catch(() => setSubtasks([]))
  }, [taskId])

  if (!task) return null

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (titleTimer) clearTimeout(titleTimer)
    setTitleTimer(
      setTimeout(() => {
        updateTask(taskId, { title: value })
      }, 400)
    )
  }

  const handleDelete = async () => {
    await deleteTask(taskId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 md:relative md:inset-auto md:z-auto w-full md:w-panel border-l border-white/[0.06] glass shrink-0 flex flex-col h-full overflow-y-auto animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <span className="text-sm font-medium text-white/40">Task Details</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/[0.06] text-white/30 transition-all duration-200">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Task title..."
          autoFocus
          className="text-lg font-medium bg-transparent text-white/95 placeholder-white/20 outline-none border-none w-full"
        />

        {/* Properties */}
        <div className="flex flex-col gap-3">
          {/* Status */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-white/35 w-20 shrink-0">Status</label>
            <select
              value={task.status}
              onChange={(e) => updateTask(taskId, { status: e.target.value as TaskStatus })}
              className="select-glass flex-1"
            >
              {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-white/35 w-20 shrink-0">Priority</label>
            <select
              value={task.priority}
              onChange={(e) =>
                updateTask(taskId, { priority: e.target.value as TaskPriority })
              }
              className="select-glass flex-1"
            >
              {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-white/35 w-20 shrink-0">Due date</label>
            <input
              type="date"
              value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
              onChange={(e) =>
                updateTask(taskId, {
                  dueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                })
              }
              className="input-glass flex-1"
            />
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-white/35 w-20 shrink-0">Start date</label>
            <input
              type="date"
              value={
                task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : ''
              }
              onChange={(e) =>
                updateTask(taskId, {
                  startDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                })
              }
              className="input-glass flex-1"
            />
          </div>

          {/* Tags */}
          <div className="flex items-start gap-3">
            <label className="text-sm text-white/35 w-20 shrink-0 mt-2">Tags</label>
            <div className="flex-1">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(task.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-white/[0.06] text-white/60 rounded-full px-2.5 py-0.5 text-xs"
                  >
                    {tag}
                    <button
                      onClick={() => {
                        const newTags = (task.tags || []).filter((t) => t !== tag)
                        updateTask(taskId, { tags: newTags } as any)
                      }}
                      className="text-white/25 hover:text-white/50 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add tag..."
                className="input-glass text-xs w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value.trim()
                    if (value && !(task.tags || []).includes(value)) {
                      updateTask(taskId, { tags: [...(task.tags || []), value] } as any)
                    }
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }}
              />
            </div>
          </div>

          {/* Subtasks */}
          <div className="flex items-start gap-3 mt-1">
            <label className="text-sm text-white/35 w-20 shrink-0 mt-1">Subtasks</label>
            <div className="flex-1 space-y-1">
              {subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 group">
                  <button
                    onClick={async () => {
                      const newStatus = sub.status === 'done' ? 'not_started' : 'done'
                      await fetch(`/api/tasks/${sub.id}`, {
                        method: 'PATCH',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus }),
                      })
                      setSubtasks((prev) =>
                        prev.map((s) => (s.id === sub.id ? { ...s, status: newStatus } : s))
                      )
                    }}
                    className="shrink-0"
                  >
                    {sub.status === 'done' ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : (
                      <Circle size={14} className="text-white/25" />
                    )}
                  </button>
                  <span className={`text-sm ${sub.status === 'done' ? 'line-through text-white/25' : 'text-white/70'}`}>
                    {sub.title || 'Untitled'}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-1">
                <Plus size={14} className="text-white/20 shrink-0" />
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add subtask..."
                  className="bg-transparent text-sm text-white/60 placeholder-white/20 outline-none flex-1"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && newSubtaskTitle.trim()) {
                      const res = await fetch('/api/tasks', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          title: newSubtaskTitle.trim(),
                          parentTaskId: taskId,
                        }),
                      })
                      const sub = await res.json()
                      setSubtasks((prev) => [...prev, sub])
                      setNewSubtaskTitle('')
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-4 pt-4 border-t border-white/[0.06] text-xs text-white/25 flex flex-col gap-1">
          <p>
            Created{' '}
            {new Date(task.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
          {task.completedAt && (
            <p>
              Completed{' '}
              {new Date(task.completedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 mt-2 px-3 py-2 text-sm text-rose-400/70 hover:bg-rose-500/[0.08] rounded-xl transition-all duration-200"
        >
          <Trash2 size={14} />
          Delete task
        </button>
      </div>
    </div>
  )
}
