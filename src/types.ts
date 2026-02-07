export interface User {
  id: string
  email: string
  name: string
  workspaceId: string
}

export type PageType = 'note' | 'project' | 'meeting' | 'journal' | 'dashboard' | 'template'

export interface Page {
  id: string
  title: string
  icon: string | null
  coverImage: string | null
  content: Record<string, unknown> | null
  pageType: PageType
  workspaceId: string
  parentId: string | null
  sortOrder: number
  isFavorite: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  archivedAt: string | null
}

// Page without content, used in sidebar/lists
export type PageMeta = Omit<Page, 'content' | 'coverImage' | 'createdBy'>

export interface PageTreeNode extends PageMeta {
  children: PageTreeNode[]
}
