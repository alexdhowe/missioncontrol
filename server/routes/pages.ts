import { Hono } from 'hono'
import { eq, and, isNull, asc, desc, ilike, or } from 'drizzle-orm'
import { ulid } from 'ulid'
import { db, schema } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'
import type { AppEnv } from '../types.js'

const pages = new Hono<AppEnv>()

pages.use('*', requireAuth)

// Extract internal page links from TipTap JSON content
function extractInternalLinks(content: any): string[] {
  const links: string[] = []
  function traverse(node: any) {
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === 'link' && mark.attrs?.href?.startsWith('/page/')) {
          const pageId = mark.attrs.href.replace('/page/', '')
          if (pageId) links.push(pageId)
        }
      }
    }
    if (node.content) {
      for (const child of node.content) {
        traverse(child)
      }
    }
  }
  if (content) traverse(content)
  return [...new Set(links)]
}

// Update links table when page content changes
async function updatePageLinks(pageId: string, content: any) {
  const targetIds = extractInternalLinks(content)
  // Delete existing links from this page
  await db.delete(schema.links).where(eq(schema.links.sourcePageId, pageId))
  // Insert new links
  if (targetIds.length > 0) {
    await db.insert(schema.links).values(
      targetIds.map((targetId) => ({
        id: ulid(),
        sourcePageId: pageId,
        targetPageId: targetId,
      }))
    )
  }
}

// Search pages
pages.get('/search', async (c) => {
  const workspaceId = c.get('workspaceId')
  const q = c.req.query('q') || ''

  if (!q.trim()) return c.json([])

  const results = await db
    .select({
      id: schema.pages.id,
      title: schema.pages.title,
      icon: schema.pages.icon,
      pageType: schema.pages.pageType,
      updatedAt: schema.pages.updatedAt,
    })
    .from(schema.pages)
    .where(
      and(
        eq(schema.pages.workspaceId, workspaceId),
        isNull(schema.pages.archivedAt),
        ilike(schema.pages.title, `%${q}%`)
      )
    )
    .orderBy(desc(schema.pages.updatedAt))
    .limit(20)

  return c.json(results)
})

// Daily notes — find or create today's page
pages.post('/daily', async (c) => {
  const userId = c.get('userId')
  const workspaceId = c.get('workspaceId')

  const today = new Date()
  const title = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Check if today's note exists
  const [existing] = await db
    .select()
    .from(schema.pages)
    .where(
      and(
        eq(schema.pages.workspaceId, workspaceId),
        eq(schema.pages.title, title),
        eq(schema.pages.pageType, 'journal'),
        isNull(schema.pages.archivedAt)
      )
    )
    .limit(1)

  if (existing) return c.json(existing)

  // Create daily note
  const [page] = await db
    .insert(schema.pages)
    .values({
      id: ulid(),
      title,
      icon: '📅',
      pageType: 'journal',
      workspaceId,
      createdBy: userId,
      sortOrder: 0,
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: title }],
          },
          {
            type: 'heading',
            attrs: { level: 3 },
            content: [{ type: 'text', text: 'Top Priorities' }],
          },
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: false },
                content: [{ type: 'paragraph' }],
              },
              {
                type: 'taskItem',
                attrs: { checked: false },
                content: [{ type: 'paragraph' }],
              },
              {
                type: 'taskItem',
                attrs: { checked: false },
                content: [{ type: 'paragraph' }],
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 3 },
            content: [{ type: 'text', text: 'Notes' }],
          },
          { type: 'paragraph' },
        ],
      },
    })
    .returning()

  return c.json(page, 201)
})

// Get backlinks for a page
pages.get('/:id/backlinks', async (c) => {
  const pageId = c.req.param('id')
  const workspaceId = c.get('workspaceId')

  const backlinks = await db
    .select({
      id: schema.pages.id,
      title: schema.pages.title,
      icon: schema.pages.icon,
      updatedAt: schema.pages.updatedAt,
    })
    .from(schema.links)
    .innerJoin(schema.pages, eq(schema.links.sourcePageId, schema.pages.id))
    .where(
      and(
        eq(schema.links.targetPageId, pageId),
        eq(schema.pages.workspaceId, workspaceId),
        isNull(schema.pages.archivedAt)
      )
    )

  return c.json(backlinks)
})

// List pages in workspace (tree structure)
pages.get('/', async (c) => {
  const workspaceId = c.get('workspaceId')

  const allPages = await db
    .select({
      id: schema.pages.id,
      title: schema.pages.title,
      icon: schema.pages.icon,
      pageType: schema.pages.pageType,
      parentId: schema.pages.parentId,
      sortOrder: schema.pages.sortOrder,
      isFavorite: schema.pages.isFavorite,
      createdAt: schema.pages.createdAt,
      updatedAt: schema.pages.updatedAt,
    })
    .from(schema.pages)
    .where(
      and(
        eq(schema.pages.workspaceId, workspaceId),
        isNull(schema.pages.archivedAt)
      )
    )
    .orderBy(asc(schema.pages.sortOrder))

  return c.json(allPages)
})

// Get single page with content
pages.get('/:id', async (c) => {
  const pageId = c.req.param('id')
  const workspaceId = c.get('workspaceId')

  const [page] = await db
    .select()
    .from(schema.pages)
    .where(
      and(
        eq(schema.pages.id, pageId),
        eq(schema.pages.workspaceId, workspaceId),
        isNull(schema.pages.archivedAt)
      )
    )
    .limit(1)

  if (!page) {
    return c.json({ error: 'Page not found' }, 404)
  }

  return c.json(page)
})

// Create page
pages.post('/', async (c) => {
  const userId = c.get('userId')
  const workspaceId = c.get('workspaceId')
  const body = await c.req.json()

  // Get the max sort order for the parent
  const siblings = await db
    .select({ sortOrder: schema.pages.sortOrder })
    .from(schema.pages)
    .where(
      and(
        eq(schema.pages.workspaceId, workspaceId),
        body.parentId
          ? eq(schema.pages.parentId, body.parentId)
          : isNull(schema.pages.parentId),
        isNull(schema.pages.archivedAt)
      )
    )
    .orderBy(desc(schema.pages.sortOrder))
    .limit(1)

  const nextOrder = (siblings[0]?.sortOrder ?? -1) + 1

  const pageId = ulid()
  const [page] = await db
    .insert(schema.pages)
    .values({
      id: pageId,
      title: body.title || 'Untitled',
      icon: body.icon || null,
      content: body.content || {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      },
      pageType: body.pageType || 'note',
      workspaceId,
      parentId: body.parentId || null,
      sortOrder: nextOrder,
      createdBy: userId,
    })
    .returning()

  return c.json(page, 201)
})

// Update page
pages.patch('/:id', async (c) => {
  const pageId = c.req.param('id')
  const workspaceId = c.get('workspaceId')
  const body = await c.req.json()

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (body.title !== undefined) updates.title = body.title
  if (body.icon !== undefined) updates.icon = body.icon
  if (body.coverImage !== undefined) updates.coverImage = body.coverImage
  if (body.content !== undefined) updates.content = body.content
  if (body.pageType !== undefined) updates.pageType = body.pageType
  if (body.parentId !== undefined) updates.parentId = body.parentId
  if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder
  if (body.isFavorite !== undefined) updates.isFavorite = body.isFavorite

  const [page] = await db
    .update(schema.pages)
    .set(updates)
    .where(
      and(
        eq(schema.pages.id, pageId),
        eq(schema.pages.workspaceId, workspaceId)
      )
    )
    .returning()

  if (!page) {
    return c.json({ error: 'Page not found' }, 404)
  }

  // Update links if content changed
  if (body.content) {
    await updatePageLinks(pageId, body.content).catch(() => {})
  }

  return c.json(page)
})

// Delete page (soft delete)
pages.delete('/:id', async (c) => {
  const pageId = c.req.param('id')
  const workspaceId = c.get('workspaceId')

  const [page] = await db
    .update(schema.pages)
    .set({ archivedAt: new Date() })
    .where(
      and(
        eq(schema.pages.id, pageId),
        eq(schema.pages.workspaceId, workspaceId)
      )
    )
    .returning()

  if (!page) {
    return c.json({ error: 'Page not found' }, 404)
  }

  return c.json({ ok: true })
})

export default pages
