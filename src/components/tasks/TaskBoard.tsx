import { Plus, Flag, Calendar } from 'lucide-react'
import { useTasksStore } from '../../stores/tasks'
import type { Task, TaskStatus, TaskPriority } from '../../types'
import { TASK_STATUS_LABELS } from '../../types'

const BOARD_COLUMNS: TaskStatus[] = ['not_started', 'in_progress', 'waiting', 'done']

const COLUMN_COLORS: Record<TaskStatus, string> = {
  not_started: 'bg-white/30',
  in_progress: 'bg-blue-400',
  waiting: 'bg-purple-400',
  done: 'bg-emerald-400',
  cancelled: 'bg-white/20',
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  none: '',
  low: 'text-white/35',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  urgent: 'text-rose-400',
}

function formatShortDate(date: string | null) {
  if (!date) return null
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function TaskBoard() {
  const { tasks, selectTask, updateTask, createTask } = useTasksStore()

  const tasksByStatus = BOARD_COLUMNS.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status)
      return acc
    },
    {} as Record<TaskStatus, Task[]>
  )

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId) {
      await updateTask(taskId, { status: targetStatus })
    }
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleAddToColumn = async (status: TaskStatus) => {
    const task = await createTask({ title: '', status })
    selectTask(task.id)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {BOARD_COLUMNS.map((status) => (
        <div
          key={status}
          className="flex flex-col w-64 shrink-0"
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
          }}
          onDrop={(e) => handleDrop(e, status)}
        >
          {/* Column header */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className={`w-2 h-2 rounded-full ${COLUMN_COLORS[status]}`} />
            <span className="text-sm font-medium text-white/80">
              {TASK_STATUS_LABELS[status]}
            </span>
            <span className="text-xs text-white/30">{tasksByStatus[status].length}</span>
            <div className="flex-1" />
            <button
              onClick={() => handleAddToColumn(status)}
              className="p-0.5 text-white/20 hover:text-white/40 hover:bg-white/[0.06] rounded-lg transition-all duration-200"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-2 min-h-[100px]">
            {tasksByStatus[status].map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onClick={() => selectTask(task.id)}
                className="glass rounded-xl p-3 cursor-pointer hover:bg-white/[0.07] transition-all duration-200"
              >
                <p className="text-sm mb-2 text-white/80">
                  {task.title || (
                    <span className="text-white/25 italic">Untitled task</span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  {task.priority !== 'none' && (
                    <Flag
                      size={12}
                      className={PRIORITY_COLORS[task.priority]}
                    />
                  )}
                  {task.dueDate && (
                    <span className="text-xs text-white/35 flex items-center gap-0.5">
                      <Calendar size={10} />
                      {formatShortDate(task.dueDate)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
