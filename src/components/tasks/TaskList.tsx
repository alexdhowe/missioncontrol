import {
  Circle,
  CircleDot,
  Clock,
  CheckCircle2,
  XCircle,
  Flag,
  Calendar,
} from 'lucide-react'
import { useTasksStore } from '../../stores/tasks'
import type { Task, TaskStatus, TaskPriority } from '../../types'

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  not_started: <Circle size={16} className="text-gray-400" />,
  in_progress: <CircleDot size={16} className="text-status-in-progress" />,
  waiting: <Clock size={16} className="text-status-waiting" />,
  done: <CheckCircle2 size={16} className="text-status-done" />,
  cancelled: <XCircle size={16} className="text-gray-400" />,
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  none: '',
  low: 'text-priority-low',
  medium: 'text-priority-medium',
  high: 'text-priority-high',
  urgent: 'text-priority-urgent',
}

function formatDueDate(date: string | null) {
  if (!date) return null
  const d = new Date(date)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (days < 0) return { text: `${Math.abs(days)}d overdue`, className: 'text-red-500' }
  if (days === 0) return { text: 'Today', className: 'text-orange-500' }
  if (days === 1) return { text: 'Tomorrow', className: 'text-yellow-600' }
  if (days <= 7) return { text: `${days}d`, className: 'text-gray-500' }
  return {
    text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    className: 'text-gray-400',
  }
}

export default function TaskList() {
  const { tasks, selectedTaskId, selectTask, updateTask } = useTasksStore()

  const handleStatusToggle = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation()
    const nextStatus = task.status === 'done' ? 'not_started' : 'done'
    await updateTask(task.id, { status: nextStatus })
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">No tasks yet</p>
        <p className="text-sm mt-1">Create your first task to get started</p>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {tasks.map((task) => {
        const due = formatDueDate(task.dueDate)
        const isActive = task.id === selectedTaskId
        const isDone = task.status === 'done' || task.status === 'cancelled'

        return (
          <div
            key={task.id}
            onClick={() => selectTask(task.id)}
            className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
              isActive ? 'bg-accent/5 border-l-2 border-l-accent' : ''
            }`}
          >
            {/* Status icon (clickable) */}
            <button
              onClick={(e) => handleStatusToggle(e, task)}
              className="shrink-0 hover:scale-110 transition-transform"
            >
              {STATUS_ICONS[task.status]}
            </button>

            {/* Title */}
            <span
              className={`flex-1 text-sm truncate ${
                isDone ? 'line-through text-gray-400' : ''
              }`}
            >
              {task.title || 'Untitled task'}
            </span>

            {/* Priority flag */}
            {task.priority !== 'none' && (
              <Flag size={14} className={`shrink-0 ${PRIORITY_COLORS[task.priority]}`} />
            )}

            {/* Due date */}
            {due && (
              <span className={`shrink-0 text-xs flex items-center gap-1 ${due.className}`}>
                <Calendar size={12} />
                {due.text}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
