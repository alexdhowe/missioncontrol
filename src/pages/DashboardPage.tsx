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
  not_started: 'bg-white/20',
  in_progress: 'bg-blue-400',
  waiting: 'bg-purple-400',
  done: 'bg-emerald-400',
  cancelled: 'bg-white/15',
}

const STATUS_DOT_COLORS: Record<string, string> = {
  not_started: 'bg-white/20',
  in_progress: 'bg-blue-400',
  waiting: 'bg-purple-400',
  done: 'bg-emerald-400',
  cancelled: 'bg-white/15',
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
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-white/30" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full text-white/30">
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
      bg: 'bg-white/[0.06]',
    },
    {
      label: 'Due Today',
      value: stats.dueToday,
      icon: CalendarClock,
      color: 'text-amber-400',
      bg: 'bg-white/[0.06]',
    },
    {
      label: 'Due This Week',
      value: stats.dueThisWeek,
      icon: CalendarDays,
      color: 'text-blue-400',
      bg: 'bg-white/[0.06]',
    },
    {
      label: 'Completed Today',
      value: stats.completedToday,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-white/[0.06]',
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white/95">
          Good {getGreeting()}
        </h1>
        <p className="text-white/35 text-sm mt-1">
          Here's what's on your plate today
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className="glass rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`${card.bg} rounded-xl p-2`}>
                <card.icon size={16} className={card.color} />
              </div>
              <span className="text-sm text-white/40">{card.label}</span>
            </div>
            <p className="text-2xl font-semibold text-white/95">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tasks by Status - Bar Chart */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <ListTodo size={16} className="text-accent" />
            Tasks by Status
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white/50">
                    {TASK_STATUS_LABELS[status as TaskStatus] || status}
                  </span>
                  <span className="text-white/30 font-medium">{count}</span>
                </div>
                <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${STATUS_BAR_COLORS[status] || 'bg-white/20'}`}
                    style={{
                      width: `${(count / maxStatusCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/30 mt-3">
            Total: {stats.total} tasks
          </p>
        </div>

        {/* Recent Tasks */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <CalendarClock size={16} className="text-accent" />
            Recent Tasks
          </h2>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-6">
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
                      className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_COLORS[task.status] || 'bg-white/20'}`}
                    />
                    <span
                      className={`text-sm truncate flex-1 ${isDone ? 'line-through text-white/30' : 'text-white/70'}`}
                    >
                      {task.title || 'Untitled task'}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-white/30 shrink-0">
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
