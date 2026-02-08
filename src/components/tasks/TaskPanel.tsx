import { useEffect, useState } from 'react'
import { X, Trash2 } from 'lucide-react'
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

  useEffect(() => {
    if (task) setTitle(task.title)
  }, [taskId, task?.title])

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
    <div className="w-panel border-l border-white/[0.06] bg-surface-raised shrink-0 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <span className="text-sm font-medium text-gray-500">Task Details</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/[0.06] text-gray-500 transition-all duration-200">
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
          className="text-lg font-semibold outline-none border-none w-full bg-transparent text-white placeholder-gray-600"
        />

        {/* Properties */}
        <div className="flex flex-col gap-3">
          {/* Status */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-500 w-20 shrink-0">Status</label>
            <select
              value={task.status}
              onChange={(e) => updateTask(taskId, { status: e.target.value as TaskStatus })}
              className="select-dark flex-1"
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
            <label className="text-sm text-gray-500 w-20 shrink-0">Priority</label>
            <select
              value={task.priority}
              onChange={(e) =>
                updateTask(taskId, { priority: e.target.value as TaskPriority })
              }
              className="select-dark flex-1"
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
            <label className="text-sm text-gray-500 w-20 shrink-0">Due date</label>
            <input
              type="date"
              value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
              onChange={(e) =>
                updateTask(taskId, {
                  dueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                })
              }
              className="input-dark flex-1"
            />
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-500 w-20 shrink-0">Start date</label>
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
              className="input-dark flex-1"
            />
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-4 pt-4 border-t border-white/[0.06] text-xs text-gray-600 flex flex-col gap-1">
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
          className="flex items-center gap-2 mt-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all duration-200"
        >
          <Trash2 size={14} />
          Delete task
        </button>
      </div>
    </div>
  )
}
