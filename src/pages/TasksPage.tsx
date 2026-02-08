import { useEffect, useState, lazy, Suspense } from 'react'
import { Plus, LayoutList, Kanban, CalendarDays } from 'lucide-react'
import { useTasksStore } from '../stores/tasks'
import TaskList from '../components/tasks/TaskList'
import TaskBoard from '../components/tasks/TaskBoard'
import TaskPanel from '../components/tasks/TaskPanel'
import TaskCalendar from '../components/tasks/TaskCalendar'

type ViewMode = 'list' | 'board' | 'calendar'

export default function TasksPage() {
  const [view, setView] = useState<ViewMode>('list')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const { fetchTasks, createTask, selectedTaskId, selectTask, setFilters } = useTasksStore()

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleFilterChange = (status: string, priority: string) => {
    setStatusFilter(status)
    setPriorityFilter(priority)
    const filters: Record<string, string> = {}
    if (status !== 'all') filters.status = status
    if (priority !== 'all') filters.priority = priority
    setFilters(filters)
  }

  const handleNewTask = async () => {
    const task = await createTask({ title: '' })
    selectTask(task.id)
  }

  return (
    <div className="flex h-full animate-fade-in">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-white/95">Tasks</h1>
            <button
              onClick={handleNewTask}
              className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-sm"
            >
              <Plus size={16} />
              New Task
            </button>
          </div>

          {/* Filters + View Toggle */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value, priorityFilter)}
              className="select-glass text-xs sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting">Waiting</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => handleFilterChange(statusFilter, e.target.value)}
              className="select-glass text-xs sm:text-sm"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="none">None</option>
            </select>

            <div className="flex-1" />

            <div className="glass rounded-xl p-0.5 flex items-center">
              {([
                { key: 'list' as const, icon: LayoutList, label: 'List' },
                { key: 'board' as const, icon: Kanban, label: 'Board' },
                { key: 'calendar' as const, icon: CalendarDays, label: 'Calendar' },
              ] as const).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs sm:text-sm transition-all duration-200 ${
                    view === key ? 'bg-white/[0.1] text-white/90 font-medium' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* View */}
          {view === 'list' && <TaskList />}
          {view === 'board' && <TaskBoard />}
          {view === 'calendar' && <TaskCalendar />}
        </div>
      </div>

      {/* Side Panel */}
      {selectedTaskId && (
        <TaskPanel taskId={selectedTaskId} onClose={() => selectTask(null)} />
      )}
    </div>
  )
}
