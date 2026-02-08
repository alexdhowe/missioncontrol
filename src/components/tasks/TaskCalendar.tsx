import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTasksStore } from '../../stores/tasks'
import type { Task, TaskPriority } from '../../types'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const PRIORITY_PILL_COLORS: Record<TaskPriority, string> = {
  none: 'bg-gray-200 text-gray-700',
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
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
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Month Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button
          onClick={goToPrevMonth}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={18} className="text-gray-500" />
        </button>
        <h3 className="text-sm font-semibold">{monthLabel}</h3>
        <button
          onClick={goToNextMonth}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="text-center text-xs font-medium text-gray-400 py-2"
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
                className="min-h-[80px] border-b border-r border-gray-50 bg-gray-50/30"
              />
            )
          }

          const cellDate = new Date(year, month, day)
          const isToday = isSameDay(cellDate, today)
          const dayTasks = tasksByDay.get(day) || []

          return (
            <div
              key={day}
              className={`min-h-[80px] border-b border-r border-gray-50 p-1 ${
                isToday ? 'bg-blue-50/40' : ''
              }`}
            >
              {/* Day Number */}
              <div className="flex justify-end mb-0.5">
                <span
                  className={`text-xs w-5 h-5 flex items-center justify-center rounded-full ${
                    isToday
                      ? 'bg-[#2563EB] text-white font-semibold'
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
                  <span className="text-[10px] text-gray-400 pl-1">
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
