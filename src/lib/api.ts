import type { User, Page, PageMeta } from '../types'

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
    create(data: { title?: string; parentId?: string; pageType?: string }) {
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
  },
}
