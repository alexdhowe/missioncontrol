import { Hono } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { ulid } from 'ulid'
import { db, schema } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'

import type { AppEnv } from '../types.js'

const auth = new Hono<AppEnv>()

// Register
auth.post('/register', async (c) => {
  const { email, password, name } = await c.req.json()

  if (!email || !password || !name) {
    return c.json({ error: 'Email, password, and name are required' }, 400)
  }

  // Check for existing user
  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1)

  if (existing) {
    return c.json({ error: 'Email already registered' }, 409)
  }

  const userId = ulid()
  const workspaceId = ulid()
  const sessionId = ulid()
  const passwordHash = await bcrypt.hash(password, 12)

  // Create user
  await db.insert(schema.users).values({
    id: userId,
    email: email.toLowerCase(),
    name,
    passwordHash,
  })

  // Create default workspace
  await db.insert(schema.workspaces).values({
    id: workspaceId,
    name: `${name}'s Workspace`,
    ownerId: userId,
  })

  // Add user as workspace owner
  await db.insert(schema.workspaceMembers).values({
    id: ulid(),
    workspaceId,
    userId,
    role: 'owner',
  })

  // Create welcome page
  await db.insert(schema.pages).values({
    id: ulid(),
    title: 'Welcome to Mission Control',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Welcome to Mission Control' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Your unified workspace for notes, tasks, and projects. Start typing here or use the ',
            },
            { type: 'text', marks: [{ type: 'code' }], text: '/' },
            { type: 'text', text: ' slash command to add different block types.' },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Quick Start' }],
        },
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Try typing some text here' }],
                },
              ],
            },
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: 'Use ' },
                    { type: 'text', marks: [{ type: 'code' }], text: '/' },
                    { type: 'text', text: ' to insert different block types' },
                  ],
                },
              ],
            },
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Create a new page from the sidebar' }],
                },
              ],
            },
          ],
        },
      ],
    },
    workspaceId,
    createdBy: userId,
    sortOrder: 0,
  })

  // Create session
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  await db.insert(schema.sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  })

  setCookie(c, 'session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  })

  return c.json({ id: userId, email: email.toLowerCase(), name, workspaceId })
})

// Login
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json()

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400)
  }

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1)

  if (!user) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  // Get workspace
  const [membership] = await db
    .select()
    .from(schema.workspaceMembers)
    .where(eq(schema.workspaceMembers.userId, user.id))
    .limit(1)

  const sessionId = ulid()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await db.insert(schema.sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt,
  })

  setCookie(c, 'session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  })

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    workspaceId: membership?.workspaceId,
  })
})

// Logout
auth.post('/logout', async (c) => {
  deleteCookie(c, 'session', { path: '/' })
  return c.json({ ok: true })
})

// Get current user
auth.get('/me', requireAuth, async (c) => {
  const userId = c.get('userId')
  const workspaceId = c.get('workspaceId')

  const [user] = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1)

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({ ...user, workspaceId })
})

export default auth
