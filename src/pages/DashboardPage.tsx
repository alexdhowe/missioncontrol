import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ListTodo,
  Loader2,
} from 'lucide-react'
import { TASK_STATUS_LABELS } from '../types'
import type { Task, TaskStatus } from '../types'

interface TaskStats {
  total: number
  overdue: number
  dueToday: number
  dueThisWeek: number
  completedToday: number
  byStatus: Record<string, number>
  byPriority: Record<string, number>
}

const STATUS_BAR_COLORS: Record<string, string> = {
  not_started: 'bg-gray-500',
  in_progress: 'bg-blue-500',
  waiting: 'bg-purple-500',
  done: 'bg-emerald-500',
  cancelled: 'bg-gray-600',
}

const STATUS_DOT_COLORS: Record<string, string> = {
  not_started: 'bg-gray-500',
  in_progress: 'bg-blue-400',
  waiting: 'bg-purple-400',
  done: 'bg-emerald-400',
  cancelled: 'bg-gray-600',
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

export default function DashboardPage() {
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [statsData, tasksData] = await Promise.all([
          fetch('/api/tasks/stats', { credentials: 'include' }).then((r) =>
            r.json()
          ),
          fetch('/api/tasks?limit=5', { credentials: 'include' }).then((r) =>
            r.json()
          ),
        ])
        setStats(statsData)
        setRecentTasks(Array.isArray(tasksData) ? tasksData.slice(0, 5) : [])
      } catch {
        // silently handle errors
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-surface">
        <Loader2 size={24} className="animate-spin text-gray-500" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full bg-surface text-gray-500">
        <p>Failed to load dashboard data</p>
      </div>
    )
  }

  const maxStatusCount = Math.max(...Object.values(stats.byStatus), 1)

  const cards = [
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/15',
    },
    {
      label: 'Due Today',
      value: stats.dueToday,
      icon: CalendarClock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/15',
    },
    {
      label: 'Due This Week',
      value: stats.dueThisWeek,
      icon: CalendarDays,
      color: 'text-blue-400',
      bg: 'bg-blue-500/15',
    },
    {
      label: 'Completed Today',
      value: stats.completedToday,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/15',
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 bg-surface min-h-full">
      {/* Greeting */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-white">
          Good {getGreeting()}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Here's what's on your plate today
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-slide-up">
        {cards.map((card) => (
          <div
            key={card.label}
            className="glass-panel-raised p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-md ${card.bg}`}>
                <card.icon size={16} className={card.color} />
              </div>
              <span className="text-sm text-gray-500">{card.label}</span>
            </div>
            <p className="text-3xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
        {/* Tasks by Status - Bar Chart */}
        <div className="glass-panel p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <ListTodo size={16} className="text-accent" />
            Tasks by Status
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-300">
                    {TASK_STATUS_LABELS[status as TaskStatus] || status}
                  </span>
                  <span className="text-gray-500 font-medium">{count}</span>
                </div>
                <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${STATUS_BAR_COLORS[status] || 'bg-gray-500'}`}
                    style={{
                      width: `${(count / maxStatusCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Total: {stats.total} tasks
          </p>
        </div>

        {/* Recent Tasks */}
        <div className="glass-panel p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <CalendarClock size={16} className="text-accent" />
            Recent Tasks
          </h2>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              No tasks yet
            </p>
          ) : (
            <div className="space-y-1">
              {recentTasks.map((task) => {
                const isDone =
                  task.status === 'done' || task.status === 'cancelled'
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-white/[0.04] transition-all duration-200"
                  >
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_COLORS[task.status] || 'bg-gray-500'}`}
                    />
                    <span
                      className={`text-sm truncate flex-1 ${isDone ? 'line-through text-gray-600' : 'text-gray-300'}`}
                    >
                      {task.title || 'Untitled task'}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-gray-500 shrink-0">
                        {new Date(task.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
