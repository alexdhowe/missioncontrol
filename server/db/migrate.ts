import pg from 'pg'

export async function migrate() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
  })

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS workspace_members (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'editor',
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS pages (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT 'Untitled',
        icon TEXT,
        cover_image TEXT,
        content JSONB,
        page_type TEXT NOT NULL DEFAULT 'note',
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        parent_id TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
        created_by TEXT NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        archived_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS links (
        id TEXT PRIMARY KEY,
        source_page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
        target_page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_page_id);
      CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_page_id);

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'not_started',
        priority TEXT NOT NULL DEFAULT 'none',
        due_date TIMESTAMPTZ,
        start_date TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        page_id TEXT REFERENCES pages(id) ON DELETE SET NULL,
        project_id TEXT REFERENCES pages(id) ON DELETE SET NULL,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_by TEXT NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)
    console.log('Database tables ready')

    try {
      await pool.query(`
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[];
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id TEXT;
      `)
    } catch {
      // columns may already exist
    }
  } finally {
    await pool.end()
  }
}
