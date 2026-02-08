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

export type TaskStatus = 'not_started' | 'in_progress' | 'waiting' | 'done' | 'cancelled'
export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  startDate: string | null
  completedAt: string | null
  pageId: string | null
  projectId: string | null
  workspaceId: string
  sortOrder: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  waiting: 'Waiting',
  done: 'Done',
  cancelled: 'Cancelled',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}
