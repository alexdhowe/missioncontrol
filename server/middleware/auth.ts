import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { eq } from 'drizzle-orm'
import { db, schema } from '../db/index.js'
import type { AppEnv } from '../types.js'

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const sessionId = getCookie(c, 'session')

  if (!sessionId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const [session] = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.id, sessionId))
    .limit(1)

  if (!session || new Date(session.expiresAt) < new Date()) {
    if (session) {
      await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId))
    }
    return c.json({ error: 'Session expired' }, 401)
  }

  // Get user's first workspace
  const [membership] = await db
    .select()
    .from(schema.workspaceMembers)
    .where(eq(schema.workspaceMembers.userId, session.userId))
    .limit(1)

  c.set('userId', session.userId)
  c.set('workspaceId', membership?.workspaceId ?? '')

  await next()
})
