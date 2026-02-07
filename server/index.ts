import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { migrate } from './db/migrate.js'
import authRoutes from './routes/auth.js'
import pageRoutes from './routes/pages.js'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use(
  '/api/*',
  cors({
    origin: process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173',
    credentials: true,
  })
)

// API routes
app.route('/api/auth', authRoutes)
app.route('/api/pages', pageRoutes)

// Health check
app.get('/api/health', (c) => c.json({ ok: true }))

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: './dist/client' }))
  app.get('*', serveStatic({ path: './dist/client/index.html' }))
}

const port = Number(process.env.PORT) || 3000

// Run migrations then start server
migrate()
  .then(() => {
    serve({ fetch: app.fetch, port }, (info) => {
      console.log(`Server running at http://localhost:${info.port}`)
    })
  })
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
