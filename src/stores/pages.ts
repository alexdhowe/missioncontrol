import { create } from 'zustand'
import type { Page, PageMeta, PageTreeNode } from '../types'
import { api } from '../lib/api'

interface PagesState {
  pages: PageMeta[]
  currentPage: Page | null
  loading: boolean

  fetchPages: () => Promise<void>
  fetchPage: (id: string) => Promise<void>
  createPage: (data?: { title?: string; parentId?: string }) => Promise<Page>
  updatePage: (id: string, data: Partial<Page>) => Promise<void>
  deletePage: (id: string) => Promise<void>
  getPageTree: () => PageTreeNode[]
}

export const usePagesStore = create<PagesState>((set, get) => ({
  pages: [],
  currentPage: null,
  loading: false,

  async fetchPages() {
    const pages = await api.pages.list()
    set({ pages })
  },

  async fetchPage(id) {
    set({ loading: true })
    try {
      const page = await api.pages.get(id)
      set({ currentPage: page, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  async createPage(data) {
    const page = await api.pages.create(data || {})
    await get().fetchPages()
    return page
  },

  async updatePage(id, data) {
    const page = await api.pages.update(id, data)
    set((state) => ({
      currentPage: state.currentPage?.id === id ? page : state.currentPage,
      pages: state.pages.map((p) => (p.id === id ? { ...p, ...page } : p)),
    }))
  },

  async deletePage(id) {
    await api.pages.delete(id)
    set((state) => ({
      pages: state.pages.filter((p) => p.id !== id),
      currentPage: state.currentPage?.id === id ? null : state.currentPage,
    }))
  },

  getPageTree() {
    const { pages } = get()
    const map = new Map<string, PageTreeNode>()
    const roots: PageTreeNode[] = []

    // Create nodes
    for (const page of pages) {
      map.set(page.id, { ...page, children: [] })
    }

    // Build tree
    for (const page of pages) {
      const node = map.get(page.id)!
      if (page.parentId && map.has(page.parentId)) {
        map.get(page.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    return roots
  },
}))
