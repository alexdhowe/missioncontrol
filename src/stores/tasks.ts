import { create } from 'zustand'
import type { Task } from '../types'
import { api } from '../lib/api'

interface TasksState {
  tasks: Task[]
  selectedTaskId: string | null
  loading: boolean
  filters: Record<string, string>

  fetchTasks: (filters?: Record<string, string>) => Promise<void>
  createTask: (data: Partial<Task>) => Promise<Task>
  updateTask: (id: string, data: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  selectTask: (id: string | null) => void
  setFilters: (filters: Record<string, string>) => void
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  selectedTaskId: null,
  loading: false,
  filters: {},

  async fetchTasks(filters) {
    const f = filters || get().filters
    set({ loading: true })
    try {
      const tasks = await api.tasks.list(Object.keys(f).length ? f : undefined)
      set({ tasks, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  async createTask(data) {
    const task = await api.tasks.create(data)
    set((s) => ({ tasks: [task, ...s.tasks] }))
    return task
  },

  async updateTask(id, data) {
    const task = await api.tasks.update(id, data)
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? task : t)),
    }))
  },

  async deleteTask(id) {
    await api.tasks.delete(id)
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      selectedTaskId: s.selectedTaskId === id ? null : s.selectedTaskId,
    }))
  },

  selectTask(id) {
    set({ selectedTaskId: id })
  },

  setFilters(filters) {
    set({ filters })
    get().fetchTasks(filters)
  },
}))
