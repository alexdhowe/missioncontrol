import { Hono } from 'hono'
import { eq, and, desc, asc, lte, gte, inArray, isNull, isNotNull, sql } from 'drizzle-orm'
import { ulid } from 'ulid'
import { db, schema } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'
import type { AppEnv } from '../types.js'

const tasks = new Hono<AppEnv>()

tasks.use('*', requireAuth)

// Task stats for dashboard
tasks.get('/stats', async (c) => {
  const workspaceId = c.get('workspaceId')
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const allTasks = await db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.workspaceId, workspaceId))

  const overdue = allTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done' && t.status !== 'cancelled'
  ).length
  const dueToday = allTasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) >= todayStart &&
      new Date(t.dueDate) <= todayEnd &&
      t.status !== 'done' && t.status !== 'cancelled'
  ).length
  const dueThisWeek = allTasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) >= now &&
      new Date(t.dueDate) <= weekEnd &&
      t.status !== 'done' && t.status !== 'cancelled'
  ).length
  const completedToday = allTasks.filter(
    (t) => t.completedAt && new Date(t.completedAt) >= todayStart
  ).length

  const byStatus: Record<string, number> = {}
  const byPriority: Record<string, number> = {}
  for (const t of allTasks) {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1
    byPriority[t.priority] = (byPriority[t.priority] || 0) + 1
  }

  return c.json({
    total: allTasks.length,
    overdue,
    dueToday,
    dueThisWeek,
    completedToday,
    byStatus,
    byPriority,
  })
})

// List tasks with filters
tasks.get('/', async (c) => {
  const workspaceId = c.get('workspaceId')
  const status = c.req.query('status')
  const priority = c.req.query('priority')
  const projectId = c.req.query('projectId')
  const due = c.req.query('due') // 'overdue', 'today', 'week', 'none'
  const sort = c.req.query('sort') || 'created_at'
  const order = c.req.query('order') || 'desc'

  const conditions = [eq(schema.tasks.workspaceId, workspaceId)]

  if (status && status !== 'all') {
    const statuses = status.split(',')
    conditions.push(inArray(schema.tasks.status, statuses))
  }
  if (priority && priority !== 'all') {
    const priorities = priority.split(',')
    conditions.push(inArray(schema.tasks.priority, priorities))
  }
  if (projectId) {
    conditions.push(eq(schema.tasks.projectId, projectId))
  }
  if (due === 'overdue') {
    conditions.push(lte(schema.tasks.dueDate, new Date()))
  } else if (due === 'today') {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    conditions.push(gte(schema.tasks.dueDate, start))
    conditions.push(lte(schema.tasks.dueDate, end))
  } else if (due === 'week') {
    const end = new Date()
    end.setDate(end.getDate() + 7)
    conditions.push(lte(schema.tasks.dueDate, end))
    conditions.push(gte(schema.tasks.dueDate, new Date()))
  } else if (due === 'none') {
    conditions.push(isNull(schema.tasks.dueDate))
  }

  const dueAfter = c.req.query('dueAfter')
  const dueBefore = c.req.query('dueBefore')
  if (dueAfter) {
    conditions.push(gte(schema.tasks.dueDate, new Date(dueAfter)))
  }
  if (dueBefore) {
    conditions.push(lte(schema.tasks.dueDate, new Date(dueBefore)))
  }

  const sortColumn =
    sort === 'due_date'
      ? schema.tasks.dueDate
      : sort === 'priority'
        ? schema.tasks.priority
        : sort === 'status'
          ? schema.tasks.status
          : sort === 'sort_order'
            ? schema.tasks.sortOrder
            : schema.tasks.createdAt

  const orderFn = order === 'asc' ? asc : desc

  const allTasks = await db
    .select()
    .from(schema.tasks)
    .where(and(...conditions))
    .orderBy(orderFn(sortColumn))
    .limit(200)

  return c.json(allTasks)
})

// Get subtasks for a task
tasks.get('/subtasks/:parentId', async (c) => {
  const parentId = c.req.param('parentId')
  const workspaceId = c.get('workspaceId')

  const subtasks = await db
    .select()
    .from(schema.tasks)
    .where(and(eq(schema.tasks.parentTaskId, parentId), eq(schema.tasks.workspaceId, workspaceId)))
    .orderBy(asc(schema.tasks.sortOrder))

  return c.json(subtasks)
})

// Get single task
tasks.get('/:id', async (c) => {
  const taskId = c.req.param('id')
  const workspaceId = c.get('workspaceId')

  const [task] = await db
    .select()
    .from(schema.tasks)
    .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.workspaceId, workspaceId)))
    .limit(1)

  if (!task) return c.json({ error: 'Task not found' }, 404)
  return c.json(task)
})

// Create task
tasks.post('/', async (c) => {
  const userId = c.get('userId')
  const workspaceId = c.get('workspaceId')
  const body = await c.req.json()

  // Get next sort order
  const [last] = await db
    .select({ sortOrder: schema.tasks.sortOrder })
    .from(schema.tasks)
    .where(eq(schema.tasks.workspaceId, workspaceId))
    .orderBy(desc(schema.tasks.sortOrder))
    .limit(1)

  const taskId = ulid()
  const [task] = await db
    .insert(schema.tasks)
    .values({
      id: taskId,
      title: body.title || '',
      status: body.status || 'not_started',
      priority: body.priority || 'none',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      startDate: body.startDate ? new Date(body.startDate) : null,
      pageId: body.pageId || null,
      projectId: body.projectId || null,
      workspaceId,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      tags: body.tags || [],
      parentTaskId: body.parentTaskId || null,
      createdBy: userId,
    })
    .returning()

  return c.json(task, 201)
})

// Update task
tasks.patch('/:id', async (c) => {
  const taskId = c.req.param('id')
  const workspaceId = c.get('workspaceId')
  const body = await c.req.json()

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (body.title !== undefined) updates.title = body.title
  if (body.status !== undefined) {
    updates.status = body.status
    updates.completedAt =
      body.status === 'done' ? new Date() : body.status === 'cancelled' ? new Date() : null
  }
  if (body.priority !== undefined) updates.priority = body.priority
  if (body.dueDate !== undefined) updates.dueDate = body.dueDate ? new Date(body.dueDate) : null
  if (body.startDate !== undefined)
    updates.startDate = body.startDate ? new Date(body.startDate) : null
  if (body.pageId !== undefined) updates.pageId = body.pageId || null
  if (body.projectId !== undefined) updates.projectId = body.projectId || null
  if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder
  if (body.tags !== undefined) updates.tags = body.tags
  if (body.parentTaskId !== undefined) updates.parentTaskId = body.parentTaskId || null

  const [task] = await db
    .update(schema.tasks)
    .set(updates)
    .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.workspaceId, workspaceId)))
    .returning()

  if (!task) return c.json({ error: 'Task not found' }, 404)
  return c.json(task)
})

// Delete task
tasks.delete('/:id', async (c) => {
  const taskId = c.req.param('id')
  const workspaceId = c.get('workspaceId')

  const [task] = await db
    .delete(schema.tasks)
    .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.workspaceId, workspaceId)))
    .returning()

  if (!task) return c.json({ error: 'Task not found' }, 404)
  return c.json({ ok: true })
})

export default tasks
