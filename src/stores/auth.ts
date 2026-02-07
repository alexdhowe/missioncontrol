import { create } from 'zustand'
import type { User } from '../types'
import { api, ApiError } from '../lib/api'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  async checkAuth() {
    try {
      const user = await api.auth.me()
      set({ user, initialized: true })
    } catch {
      set({ user: null, initialized: true })
    }
  },

  async login(email, password) {
    set({ loading: true })
    try {
      const user = await api.auth.login({ email, password })
      set({ user, loading: false })
    } catch (e) {
      set({ loading: false })
      throw e
    }
  },

  async register(email, password, name) {
    set({ loading: true })
    try {
      const user = await api.auth.register({ email, password, name })
      set({ user, loading: false })
    } catch (e) {
      set({ loading: false })
      throw e
    }
  },

  async logout() {
    await api.auth.logout()
    set({ user: null })
  },
}))
