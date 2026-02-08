import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTasksStore } from '../../stores/tasks'
import type { Task, TaskPriority } from '../../types'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const PRIORITY_PILL_COLORS: Record<TaskPriority, string> = {
  none: 'bg-gray-500/20 text-gray-300',
  low: 'bg-gray-500/20 text-gray-400',
  medium: 'bg-yellow-500/20 text-yellow-300',
  high: 'bg-orange-500/20 text-orange-300',
  urgent: 'bg-rose-500/20 text-rose-300',
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export default function TaskCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const tasks = useTasksStore((s) => s.tasks)
  const selectTask = useTasksStore((s) => s.selectTask)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = new Date()

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)

  // Build the calendar grid cells
  const calendarDays = useMemo(() => {
    const cells: (number | null)[] = []

    // Leading empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      cells.push(null)
    }

    // Day numbers
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d)
    }

    // Trailing empty cells to complete the last row
    while (cells.length % 7 !== 0) {
      cells.push(null)
    }

    return cells
  }, [firstDay, daysInMonth])

  // Map tasks to their due dates within this month
  const tasksByDay = useMemo(() => {
    const map = new Map<number, Task[]>()
    for (const task of tasks) {
      if (!task.dueDate) continue
      const d = new Date(task.dueDate)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!map.has(day)) map.set(day, [])
        map.get(day)!.push(task)
      }
    }
    return map
  }, [tasks, year, month])

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const monthLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="glass-panel overflow-hidden">
      {/* Month Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <button
          onClick={goToPrevMonth}
          className="p-1 rounded-md hover:bg-white/[0.06] transition-all duration-200"
        >
          <ChevronLeft size={18} className="text-gray-500" />
        </button>
        <h3 className="text-sm font-semibold text-white">{monthLabel}</h3>
        <button
          onClick={goToNextMonth}
          className="p-1 rounded-md hover:bg-white/[0.06] transition-all duration-200"
        >
          <ChevronRight size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-white/[0.06]">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[80px] border-b border-r border-white/[0.03] bg-white/[0.01]"
              />
            )
          }

          const cellDate = new Date(year, month, day)
          const isToday = isSameDay(cellDate, today)
          const dayTasks = tasksByDay.get(day) || []

          return (
            <div
              key={day}
              className={`min-h-[80px] border-b border-r border-white/[0.03] p-1 ${
                isToday ? 'bg-accent/10' : ''
              }`}
            >
              {/* Day Number */}
              <div className="flex justify-end mb-0.5">
                <span
                  className={`text-xs w-5 h-5 flex items-center justify-center rounded-full ${
                    isToday
                      ? 'bg-accent text-white font-semibold'
                      : 'text-gray-500'
                  }`}
                >
                  {day}
                </span>
              </div>

              {/* Task Pills */}
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => selectTask(task.id)}
                    className={`block w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate ${
                      PRIORITY_PILL_COLORS[task.priority]
                    } hover:opacity-80 transition-opacity`}
                    title={task.title}
                  >
                    {task.title || 'Untitled'}
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-[10px] text-gray-500 pl-1">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
