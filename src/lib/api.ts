import type { User, Page, PageMeta, Task } from '../types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.error || 'Request failed')
  }

  return res.json()
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Auth
export const api = {
  auth: {
    register(data: { email: string; password: string; name: string }) {
      return request<User>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    login(data: { email: string; password: string }) {
      return request<User>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    logout() {
      return request<{ ok: boolean }>('/auth/logout', { method: 'POST' })
    },
    me() {
      return request<User>('/auth/me')
    },
  },

  pages: {
    list() {
      return request<PageMeta[]>('/pages')
    },
    get(id: string) {
      return request<Page>(`/pages/${id}`)
    },
    create(data: { title?: string; parentId?: string; pageType?: string; content?: Record<string, unknown> }) {
      return request<Page>('/pages', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    update(id: string, data: Partial<Page>) {
      return request<Page>(`/pages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    },
    delete(id: string) {
      return request<{ ok: boolean }>(`/pages/${id}`, { method: 'DELETE' })
    },
    search(q: string) {
      return request<PageMeta[]>(`/pages/search?q=${encodeURIComponent(q)}`)
    },
    daily() {
      return request<Page>('/pages/daily', { method: 'POST' })
    },
    backlinks(id: string) {
      return request<PageMeta[]>(`/pages/${id}/backlinks`)
    },
  },

  tasks: {
    list(params?: Record<string, string>) {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request<Task[]>(`/tasks${qs}`)
    },
    get(id: string) {
      return request<Task>(`/tasks/${id}`)
    },
    create(data: Partial<Task>) {
      return request<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    update(id: string, data: Partial<Task>) {
      return request<Task>(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    },
    delete(id: string) {
      return request<{ ok: boolean }>(`/tasks/${id}`, { method: 'DELETE' })
    },
    subtasks(parentId: string) {
      return request<Task[]>(`/tasks/subtasks/${parentId}`)
    },
    stats() {
      return request<{
        total: number
        overdue: number
        dueToday: number
        dueThisWeek: number
        completedToday: number
        byStatus: Record<string, number>
        byPriority: Record<string, number>
      }>('/tasks/stats')
    },
  },
}
