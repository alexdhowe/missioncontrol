# Mission Control — Product Requirements Document

**Version:** 1.0
**Date:** February 7, 2026
**Status:** Draft for Development

---

## 1. Why This Exists

Microsoft's productivity suite is a graveyard of half-finished ideas. OneNote is a freeform canvas with no structure. To Do is a checklist disconnected from everything. Planner is a project board nobody asked for. Loop is a document editor pretending to be collaborative. None of them talk to each other in a meaningful way, and none of them respect how people actually think and work.

The core problem is fragmentation. Your notes live in one place, your tasks in another, your project plans in a third, and your calendar in a fourth. Every time you switch between them, you lose context. Every time you try to connect an idea to an action, you're copy-pasting between apps. This is not productivity — it's busywork.

**Mission Control unifies notes, tasks, projects, goals, and knowledge into a single, fluid workspace.** It treats every piece of information as a connected node in your personal operating system, not a siloed artifact in a specific app.

---

## 2. Design Philosophy

### 2.1 — Everything is a Block

Every piece of content in Mission Control is a **block**: a paragraph, a task, a table, an image, a code snippet, a database row, an embed. Blocks are the atomic unit. They can be:

- Nested inside other blocks (infinite hierarchy)
- Referenced from anywhere (bidirectional links)
- Converted between types (a note becomes a task, a task becomes a project)
- Filtered, sorted, and queried like data

This is the foundational departure from Microsoft. In OneNote, a note is a note. In To Do, a task is a task. In Mission Control, **the boundary between note and task and project does not exist.** You write a thought, and with one keystroke it becomes an actionable item with a due date, an owner, and a parent project — without ever leaving the page you're on.

### 2.2 — Context Never Breaks

When you're working on something, everything related to that thing should be within reach. Mission Control maintains **contextual awareness** — if you're looking at a project, you can see its notes, tasks, timeline, linked documents, and recent activity in a single view. If you're writing a note, you can see what it's linked to and what tasks reference it.

No more "let me switch to the other app to check that." The workspace reshapes itself around what you're doing.

### 2.3 — Speed as a Feature

The app must feel instantaneous. Every interaction — opening a page, creating a task, searching, navigating — must complete in under 100ms on a modern device. This isn't aspirational; it's a hard requirement. The reason people abandon productivity tools is friction, and the biggest source of friction is latency.

### 2.4 — Offline-First, Sync Always

Mission Control works fully offline with local-first data architecture. Changes sync when connectivity returns via CRDTs (Conflict-free Replicated Data Types), meaning there are never merge conflicts. You edit on your phone during a flight, edit on your laptop at home, and everything resolves automatically.

---

## 3. Architecture Overview

### 3.1 — Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React + TypeScript | Component model fits block-based architecture; massive ecosystem |
| **Desktop App** | Tauri (Rust) | Native performance, ~10x smaller than Electron, access to filesystem |
| **Mobile** | React Native or Capacitor | Code sharing with web; native feel on iOS/Android |
| **Local Database** | SQLite (via wa-sqlite or better-sqlite3) | Battle-tested, fast, works everywhere including WASM |
| **Sync Engine** | Yjs (CRDT library) | Mature, performant CRDT implementation for real-time + offline sync |
| **Backend API** | Hono or Fastify on Cloudflare Workers | Edge-deployed, globally fast, cheap to scale |
| **Cloud Database** | Turso (libSQL) or Cloudflare D1 | SQLite-compatible, edge-replicated, pairs with local SQLite |
| **Auth** | Lucia Auth or Auth.js | Lightweight, self-hostable, supports OAuth + magic links |
| **File Storage** | Cloudflare R2 or S3-compatible | For images, attachments, exports |
| **Search** | MeiliSearch (self-hosted) or Orama (client-side) | Full-text search with typo tolerance; Orama for offline search |
| **Real-time** | WebSockets via PartyKit or Cloudflare Durable Objects | For live collaboration and push sync |

### 3.2 — Local-First Data Model

```
┌─────────────────────────────────────────────┐
│                  Client                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │  SQLite   │  │  Yjs Doc │  │  Search   │ │
│  │  (data)   │◄─┤  (CRDT)  │  │  Index    │ │
│  └──────────┘  └────┬─────┘  └───────────┘ │
│                     │                        │
└─────────────────────┼────────────────────────┘
                      │ WebSocket / HTTP
┌─────────────────────┼────────────────────────┐
│                  Sync Server                  │
│  ┌──────────────────┴──────────────────────┐ │
│  │  CRDT Merge + Persistence               │ │
│  │  (Cloudflare Durable Objects)           │ │
│  └──────────────────┬──────────────────────┘ │
│                     │                        │
│  ┌──────────┐  ┌────┴─────┐  ┌───────────┐ │
│  │  Turso    │  │  R2      │  │  Meili    │ │
│  │  (data)   │  │  (files) │  │  (search) │ │
│  └──────────┘  └──────────┘  └───────────┘ │
└──────────────────────────────────────────────┘
```

Data flows: User edits → local Yjs CRDT → local SQLite (for queries/views) → sync to server when online → server merges CRDTs → pushes to other devices.

### 3.3 — Access Anywhere

Mission Control is accessible from:

- **Web app** (PWA): Full functionality in any modern browser. Installable as PWA for near-native experience. This is the primary interface and should be built first.
- **Desktop app** (Tauri): Native wrapper with filesystem access, system tray, global shortcuts, offline storage. macOS, Windows, Linux.
- **Mobile app**: Native-feeling mobile experience with quick capture, widgets, and share sheet integration. iOS and Android.

**Build order:** Web (PWA) first → Desktop (Tauri wrap + native features) → Mobile.

---

## 4. Data Model

### 4.1 — Core Entities

```typescript
// Everything is a Block
interface Block {
  id: string;                    // ULID (sortable, unique, offline-safe)
  type: BlockType;               // 'page' | 'text' | 'heading' | 'task' | 'database' | etc.
  content: any;                  // Type-specific content (rich text, task metadata, etc.)
  parent_id: string | null;      // Parent block (null = root/workspace level)
  order: string;                 // Fractional indexing for ordering (e.g., "0|hzzzzz:")
  workspace_id: string;          // Workspace this belongs to
  created_by: string;            // User ID
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
  archived_at: string | null;    // Soft delete
  properties: Record<string, any>; // Extensible metadata
}

// Block Types
type BlockType =
  | 'page'           // A page (can contain child blocks)
  | 'text'           // Rich text paragraph
  | 'heading'        // H1, H2, H3
  | 'task'           // Checkbox item with status, dates, assignee
  | 'bullet'         // Bullet list item
  | 'numbered'       // Numbered list item
  | 'toggle'         // Collapsible content
  | 'code'           // Code block with syntax highlighting
  | 'table'          // Table (children are rows, grandchildren are cells)
  | 'database'       // Inline database / collection view
  | 'callout'        // Highlighted info box
  | 'divider'        // Horizontal rule
  | 'image'          // Image with caption
  | 'file'           // File attachment
  | 'embed'          // URL embed (YouTube, Figma, etc.)
  | 'bookmark'       // Web bookmark with preview
  | 'equation'       // LaTeX math
  | 'quote'          // Blockquote
  | 'column_layout'  // Multi-column container
  | 'synced_block'   // Block that mirrors content from another block

// Tasks have extended properties
interface TaskProperties {
  status: 'not_started' | 'in_progress' | 'waiting' | 'done' | 'cancelled';
  priority: 'none' | 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  start_date: string | null;
  assignee: string | null;
  tags: string[];
  project_id: string | null;     // Parent project (a page with type 'project')
  recurrence: RecurrenceRule | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
}

// Pages can be typed for different behaviors
interface PageProperties {
  icon: string | null;           // Emoji or uploaded icon
  cover: string | null;          // Cover image URL
  page_type: 'note' | 'project' | 'meeting' | 'journal' | 'template' | 'dashboard';
  pinned: boolean;
  favorite: boolean;
}

// Bidirectional Links
interface Link {
  id: string;
  source_block_id: string;       // Block containing the link
  target_block_id: string;       // Block being linked to
  context: string;               // Snippet of surrounding text for backlink preview
  created_at: string;
}

// Relations (for databases / structured connections)
interface Relation {
  id: string;
  source_id: string;
  target_id: string;
  relation_type: string;         // e.g., 'blocks', 'depends_on', 'parent_of'
  properties: Record<string, any>;
}
```

### 4.2 — Workspaces and Permissions

```typescript
interface Workspace {
  id: string;
  name: string;
  icon: string | null;
  owner_id: string;
  plan: 'free' | 'pro' | 'team';
  settings: WorkspaceSettings;
}

interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joined_at: string;
}
```

Users can have multiple workspaces (e.g., "Personal", "Side Project", "Shared with Partner"). Each workspace has its own page tree, databases, and settings.

---

## 5. Core Features

### 5.1 — The Editor

The editor is the heart of Mission Control. It must be world-class.

**Rich Text Capabilities:**
- Full Markdown support with live rendering (type `**bold**`, see **bold** immediately)
- Slash commands (`/`) for inserting any block type
- Inline formatting: bold, italic, underline, strikethrough, code, highlight (multiple colors), link
- Block-level: headings (H1-H3), bullet/numbered/toggle lists, quotes, callouts, dividers, code blocks, tables, equations
- Drag-and-drop block reordering
- Multi-column layouts (2 or 3 columns, drag blocks between them)
- Nested blocks (indent any block under any other block)
- Block-level comments and discussions

**Task Integration in the Editor:**
- Type `[] ` or `/task` to create an inline task
- Tasks created in any page automatically appear in the global task views
- Clicking a task expands a side panel with full task details (dates, priority, project, subtasks) without navigating away
- Tasks can be converted to full pages for complex items

**Keyboard-First Design:**
- Every action has a keyboard shortcut
- `Cmd+K` — Universal command palette (search pages, run commands, navigate)
- `Cmd+P` — Quick page switcher
- `Cmd+Shift+P` — Quick task creator
- `Cmd+/` — Slash command menu
- `Cmd+L` — Create link to another page
- `Cmd+Shift+L` — Create linked mention (backlink)
- `Tab/Shift+Tab` — Indent/outdent
- `Cmd+Enter` — Toggle task completion
- `Cmd+D` — Duplicate block
- Arrow keys with modifier — Navigate between blocks

**Implementation Notes:**
- Build on TipTap (ProseMirror-based) for the rich text engine
- Custom node types for each block type
- Yjs integration via y-prosemirror for real-time CRDT sync
- Virtual rendering for long documents (only render visible blocks)

### 5.2 — Pages and Navigation

**Page Tree (Sidebar):**
- Infinitely nestable page hierarchy in the left sidebar
- Drag-and-drop to reorganize
- Favorites section (pinned pages) at the top
- Recent pages section
- Quick search at the top of sidebar
- Collapsible sections

**Page Types:**
Each page can optionally be assigned a type that adds specialized behavior:

| Page Type | Additional Behavior |
|-----------|-------------------|
| **Note** | Default. Freeform content. |
| **Project** | Adds project-specific views: task board, timeline, progress tracker. All tasks with `project_id` pointing to this page aggregate here. |
| **Meeting** | Adds date/time, attendees, agenda template, action items auto-extraction. |
| **Journal** | Daily/weekly entry. Auto-creates with date. Supports templates and streaks. |
| **Dashboard** | Grid layout of widgets: task summaries, charts, recent activity, embedded database views. |
| **Template** | Reusable page structure. Can be applied when creating new pages. |

**Navigation:**
- Breadcrumb trail at the top of every page
- Back/forward browser-style navigation
- `Cmd+K` command palette searches everything: pages, tasks, block content, commands
- Page peek: hover over any internal link to see a preview popup
- Open pages in side-by-side split view

### 5.3 — Tasks and Projects

This is where Mission Control destroys Microsoft's fragmented approach. Tasks are not a separate app. They are a property of any block, visible everywhere.

**Task Creation:**
- Inline in any page (checkbox block)
- Quick add via `Cmd+Shift+P` from anywhere
- From highlighted text (select text → "Convert to task")
- From email/web via share sheet (mobile) or browser extension

**Task Properties:**
- Status (customizable per project: e.g., Not Started → In Progress → Review → Done)
- Priority (Urgent, High, Medium, Low, None)
- Due date and start date
- Assignee (in shared workspaces)
- Tags/labels
- Parent project
- Subtasks (nested task blocks)
- Estimated vs. actual time
- Recurrence rules
- Dependencies (task A blocks task B)

**Task Views (Global):**
A dedicated "Tasks" section in the sidebar that aggregates ALL tasks across ALL pages:

- **List View** — Filterable, sortable flat list. Group by project, priority, date, tag.
- **Board View** — Kanban columns by status (or any property). Drag cards between columns.
- **Calendar View** — Tasks plotted on a day/week/month calendar by due date.
- **Timeline View** — Gantt-style view showing task durations and dependencies.
- **Matrix View** — Eisenhower matrix (Urgent/Important quadrants) or custom 2-axis.

Every view supports saved filters. For example: "My high-priority tasks due this week, grouped by project."

**Project Pages:**
When a page is typed as "Project," it becomes a container with:
- Overview tab (description, status, key dates, team)
- Tasks tab (all tasks linked to this project, in any view)
- Notes tab (all pages nested under this project)
- Timeline tab (Gantt chart of project tasks)
- Activity tab (recent changes log)

**Recurring Tasks:**
Full recurrence support: daily, weekly (specific days), monthly (specific date or Nth weekday), yearly, custom intervals. Completing a recurring task automatically creates the next occurrence.

### 5.4 — Databases (Structured Collections)

Any page can contain an inline database — a structured collection of items with custom properties, viewable in multiple layouts.

**Creating a Database:**
- `/database` slash command or from the block menu
- Start with a template (CRM, habit tracker, reading list, inventory) or blank
- Each row in a database is itself a page (can be opened and contain blocks)

**Property Types:**
- Text, Number, Select (single), Multi-select, Date, Person, Checkbox, URL, Email, Phone, File, Relation (link to another database), Rollup (computed from relations), Formula, Created time, Last edited time, Created by, Last edited by

**Database Views:**
Each database can have multiple saved views:
- **Table** — Spreadsheet-like grid. Resize columns, sort, filter, group.
- **Board** — Kanban grouped by any Select property.
- **List** — Compact list with configurable visible properties.
- **Calendar** — Items plotted by any Date property.
- **Gallery** — Card grid with cover images and preview properties.
- **Timeline** — Gantt view using start/end date properties.
- **Chart** — Bar, line, pie charts aggregating numeric properties.

**Filters and Sorts:**
- Filter by any property with type-appropriate operators (contains, equals, before/after, is empty, etc.)
- Multi-level sorting
- Grouping by any property (with subtotals for numbers)
- Save filter/sort/group combinations as named views

**Relations and Rollups:**
- Link database rows to rows in other databases (e.g., link Tasks to Projects)
- Rollup: compute aggregates across relations (e.g., "Count of incomplete tasks" on a Project row)
- Self-relations for hierarchies within a single database

**Formulas:**
A formula language for computed properties:
```
// Examples
if(prop("Status") == "Done", "✅", "⏳")
dateBetween(prop("Due Date"), now(), "days")
prop("Price") * prop("Quantity")
format(prop("Revenue") / prop("Headcount"), "$0,0")
```

### 5.5 — Bidirectional Links and Knowledge Graph

Every internal link creates a connection in both directions. If Page A links to Page B, Page B's backlinks section shows Page A with surrounding context.

**Link Types:**
- **Page link** — `[[Page Name]]` syntax. Autocomplete as you type.
- **Block link** — Link to a specific block within a page. `[[Page Name > Block]]`
- **Inline mention** — `@Page Name` or `@Task Name` for lightweight references.
- **Synced blocks** — A block that mirrors content from another location. Edit in one place, updates everywhere.

**Backlinks Panel:**
Every page has a collapsible backlinks section showing:
- Which pages link to this page
- The surrounding context of each link (a few lines around the mention)
- Unlinked mentions (pages that reference this page's title without an explicit link)

**Graph View:**
A visual, interactive graph showing all pages and their connections. Zoom in/out, filter by page type or tag, click to navigate. This is useful for seeing the structure of your knowledge and finding unexpected connections.

### 5.6 — Quick Capture

Getting information INTO the system must be frictionless:

- **Global shortcut** (desktop): `Cmd+Shift+M` opens a floating quick capture window from anywhere. Type a thought, select a destination, done.
- **Mobile widget**: Home screen widget with one-tap capture. Opens directly to text input.
- **Share sheet** (mobile): Share URLs, text, images from any app directly into Mission Control.
- **Browser extension**: Clip web pages, selected text, or full articles. Save to inbox or specific page.
- **Email to inbox**: Forward emails to `capture@[your-workspace].missioncontrol.app` to create pages.
- **API**: Webhooks and REST API for automation (Zapier, Make, custom scripts).

**Inbox:**
All quick captures land in an Inbox unless a destination is specified. The inbox is a triage area — review, tag, move to the right place, or delete.

### 5.7 — Search

Search must be fast, fuzzy, and comprehensive.

**Universal Search (`Cmd+K`):**
- Searches page titles, full block content, task names, database properties
- Fuzzy matching with typo tolerance (powered by MeiliSearch/Orama)
- Results ranked by recency, relevance, and frequency of access
- Filter results by type (pages, tasks, databases), date range, workspace
- Search works fully offline (client-side index)

**Performance Target:** Results appear as you type, within 50ms of each keystroke.

**Advanced Search:**
- Boolean operators: AND, OR, NOT
- Property filters: `status:done`, `priority:high`, `due:this-week`, `in:Project Name`
- Date filters: `created:last-7-days`, `modified:today`
- Full regex support for power users

### 5.8 — Templates

**Page Templates:**
Predefined page structures that can be applied when creating a new page:
- Meeting notes (date, attendees, agenda, notes, action items)
- Weekly review (reflection prompts, goal check-in, next week planning)
- Project kickoff (goals, scope, timeline, team, risks)
- Decision log (context, options, criteria, decision, rationale)
- 1:1 meeting (talking points, action items, notes)
- Bug report, feature request, design brief, etc.
- Users can create and share custom templates

**Database Templates:**
Predefined database schemas:
- Habit tracker, reading list, CRM, content calendar, OKR tracker, inventory, recipe book, travel planner

**Block Templates:**
Reusable block snippets that expand via slash command or text shortcut:
- Signature blocks, standard disclaimers, common table structures
- `/snippet [name]` to insert

### 5.9 — Daily Notes / Journal

A dedicated daily notes feature:
- Automatically creates a page for each day (named with the date)
- Accessible via a "Today" button in the sidebar
- Customizable daily template (e.g., gratitude prompt, top 3 priorities, end-of-day reflection)
- Calendar navigation to browse past daily notes
- Tasks created in daily notes can automatically inherit the current date as their due date
- Weekly and monthly roll-up views that aggregate daily note content

### 5.10 — Dashboards

Dashboard pages provide at-a-glance views by composing widgets:

**Widget Types:**
- Task summary (overdue, due today, due this week, by project)
- Database view embed (any saved view from any database)
- Calendar preview (upcoming events/tasks)
- Recent activity feed
- Progress bars (project completion %)
- Streak tracker (consecutive days of journal entries, habit completions)
- Custom chart (from database data)
- Markdown text block (for static content / notes)
- Clock / weather (because why not)
- Embedded web content (iframe)

Widgets are arranged in a responsive grid. Drag to reorder and resize.

---

## 6. Differentiators — What Microsoft Can't or Won't Do

### 6.1 — Fluid Type Conversion

In Mission Control, content is fluid. A bullet point can become a task. A task can become a full page. A page can become a project. A table can become a database. This happens with one action (right-click → "Convert to…" or a keyboard shortcut), and all existing references and links are preserved.

Microsoft treats each content type as a separate product. Mission Control treats them as views of the same underlying data.

### 6.2 — True Offline-First

OneNote's sync is famously unreliable. Loop requires constant connectivity. Mission Control uses CRDTs, which means:
- Every edit is applied locally first (instant)
- Sync happens in the background when online
- Conflicts are resolved automatically at the character level
- You can work for days offline and everything merges cleanly

### 6.3 — Everything Queryable

In Mission Control, you can query your entire workspace like a database:
- "Show me all tasks across all projects that are high priority and due this week"
- "Show me all pages I edited in the last 3 days that mention Q4 planning"
- "Show me a chart of tasks completed per week over the last 3 months"

This is enabled by the block-based data model and SQLite's query capabilities. Microsoft's tools can't do this because the data is scattered across disconnected apps.

### 6.4 — No Vendor Lock-in

- All data stored in SQLite (open format, export anytime)
- Full data export: Markdown, JSON, CSV, HTML
- API access to all data
- Self-hostable (the sync server can run on your own infrastructure)

### 6.5 — Speed

Mission Control targets sub-100ms interaction times for all common operations. This is achievable because:
- Local-first architecture (no network round-trips for reads or writes)
- SQLite is extremely fast for structured queries
- Virtual rendering for long documents
- Web Workers for background processing (indexing, sync)
- No bloated framework overhead (Tauri, not Electron)

---

## 7. Technical Implementation Plan

### 7.1 — Phase 1: Foundation (Weeks 1–4)

**Goal:** Core editor and page management working in the browser.

**Deliverables:**
1. Project scaffolding: Vite + React + TypeScript + Tailwind CSS
2. SQLite setup via wa-sqlite (WASM) for browser, better-sqlite3 for desktop
3. Core data layer: Block CRUD operations, page tree management
4. TipTap editor integration with custom block types:
   - Text, heading, bullet list, numbered list, toggle, quote, callout, divider, code block
   - Task block (checkbox with inline properties)
5. Slash command menu (`/`)
6. Page sidebar with tree navigation, favorites, recent pages
7. Basic page CRUD: create, rename, delete (soft), move, nest
8. Fractional indexing for block and page ordering
9. Local persistence (all data in SQLite, survives refresh)
10. Basic keyboard shortcuts (Cmd+K palette, Cmd+P page switcher)

### 7.2 — Phase 2: Tasks and Views (Weeks 5–8)

**Goal:** Task management across all pages with multiple view types.

**Deliverables:**
1. Task block enhancements: status, priority, due date, tags, assignee, subtasks
2. Global task aggregation: query all tasks across all pages
3. Task views: List, Board (Kanban), Calendar
4. Saved filters and views
5. Quick task creator (`Cmd+Shift+P`)
6. Task side panel (click task → detail panel slides in from right)
7. Project page type with task aggregation
8. Recurring task support
9. Drag-and-drop across views (e.g., drag task to different Kanban column)

### 7.3 — Phase 3: Databases and Relations (Weeks 9–12)

**Goal:** Inline databases with custom properties and multiple view types.

**Deliverables:**
1. Database block type with property system
2. Property types: text, number, select, multi-select, date, checkbox, URL, relation, formula
3. Table view with sorting, filtering, grouping
4. Board view for databases
5. Gallery view
6. Calendar view for databases
7. Relation properties (link between databases)
8. Rollup properties
9. Formula language (basic arithmetic, conditionals, date math, string ops)
10. Database templates

### 7.4 — Phase 4: Sync and Collaboration (Weeks 13–16)

**Goal:** Multi-device sync and real-time collaboration.

**Deliverables:**
1. Yjs CRDT integration with the editor and data layer
2. Sync server (Cloudflare Workers + Durable Objects or PartyKit)
3. User authentication (magic link + OAuth with Google/GitHub)
4. Workspace creation and management
5. Real-time cursor presence (see other users' cursors)
6. Change history / version timeline per page
7. Conflict-free offline sync across devices
8. Cloud database (Turso) for server-side persistence

### 7.5 — Phase 5: Search, Links, and Polish (Weeks 17–20)

**Goal:** Knowledge graph, search, and quality-of-life features.

**Deliverables:**
1. Full-text search with client-side index (Orama or Lunr)
2. Server-side search (MeiliSearch) for cross-device
3. Bidirectional links: `[[wiki-link]]` syntax with autocomplete
4. Backlinks panel on every page
5. Graph view (force-directed visualization of page links)
6. Quick capture: global shortcut (desktop), inbox
7. Daily notes / journal feature
8. Templates system (page templates, database templates, block snippets)
9. Import from: Markdown, OneNote export, Notion export, CSV
10. Export to: Markdown, JSON, CSV, HTML, PDF

### 7.6 — Phase 6: Desktop, Mobile, and Dashboards (Weeks 21–26)

**Goal:** Native apps and dashboard views.

**Deliverables:**
1. Tauri desktop wrapper with native features:
   - System tray with quick capture
   - Global keyboard shortcut
   - File system access for attachments
   - Auto-update mechanism
2. PWA optimization (service worker, offline caching, installable)
3. Mobile-responsive web layout (or React Native app)
   - Quick capture widget
   - Share sheet integration
   - Swipe gestures for task management
4. Dashboard page type with widget grid
5. Timeline / Gantt view for projects
6. Chart widgets (bar, line, pie from database data)
7. Browser extension for web clipping

---

## 8. UI/UX Specifications

### 8.1 — Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ◀ ▶   Breadcrumb > Trail > Current Page          🔍  ⚙️  👤  │
├────────────┬─────────────────────────────────────┬───────────────┤
│            │                                     │               │
│  Search    │                                     │  Side Panel   │
│            │                                     │  (contextual) │
│  ★ Faves   │          Main Content               │               │
│  Page 1    │                                     │  - Task detail│
│  Page 2    │          (Editor / View)            │  - Backlinks  │
│    └ Sub   │                                     │  - Comments   │
│  📋 Tasks  │                                     │  - Properties │
│  📊 Dash   │                                     │               │
│  📥 Inbox  │                                     │               │
│            │                                     │               │
│  ─────     │                                     │               │
│  Workspace │                                     │               │
│  Settings  │                                     │               │
│            │                                     │               │
├────────────┴─────────────────────────────────────┴───────────────┤
│  ⌘K Command Palette (when active, overlays center)              │
└──────────────────────────────────────────────────────────────────┘
```

- **Left sidebar** (280px, collapsible): Page tree, favorites, global views (Tasks, Inbox, Dashboard), workspace switcher.
- **Main content** (flexible): The editor or view. Full width when sidebar and panel are collapsed.
- **Right panel** (360px, contextual): Opens when needed for task details, backlinks, page properties, comments. Can be pinned or dismissed.
- **Top bar**: Navigation (back/forward, breadcrumbs), search trigger, settings, user avatar.
- **Command palette**: Overlay that appears on `Cmd+K`. Searches everything and runs commands.

### 8.2 — Design System

**Visual Style:**
- Clean, minimal, content-focused. No visual clutter.
- Light and dark mode (system preference or manual toggle)
- Neutral base palette with a single accent color (customizable per workspace)
- Typography: Inter for UI, monospace (JetBrains Mono or Fira Code) for code blocks
- Subtle animations for state changes (< 200ms, ease-out curves)
- High contrast text. WCAG AA minimum.

**Spacing and Sizing:**
- 4px base grid
- Content max-width: 720px (centered in main area, expandable for tables/databases)
- Sidebar item height: 32px
- Block spacing: 4px between blocks, 16px for section breaks

**Colors (Light Mode, defaults):**
- Background: #FFFFFF
- Sidebar: #F7F7F7
- Text primary: #1A1A1A
- Text secondary: #6B6B6B
- Accent: #2563EB (blue, customizable)
- Task priority colors: Urgent=#EF4444, High=#F97316, Medium=#EAB308, Low=#6B7280
- Status colors: Done=#22C55E, In Progress=#3B82F6, Waiting=#A855F7, Not Started=#9CA3AF

### 8.3 — Interactions

**Hover States:** Blocks show a subtle drag handle (⠿) on hover to the left. Options menu (⋯) appears on hover to the right.

**Selection:** Click to place cursor. Click drag handle to select entire block. Shift+click to multi-select blocks. Selected blocks can be moved, deleted, duplicated, or converted.

**Context Menus:** Right-click any block for contextual actions: Convert to, Move to, Copy link, Duplicate, Delete, Comment, Color/highlight.

**Transitions:** Page navigation uses a subtle crossfade (150ms). Side panel slides in from the right (200ms). Modals fade in with slight scale (150ms).

---

## 9. API and Integrations

### 9.1 — REST API

Full CRUD API for all entities:

```
GET    /api/v1/workspaces
GET    /api/v1/pages
POST   /api/v1/pages
GET    /api/v1/pages/:id
PATCH  /api/v1/pages/:id
DELETE /api/v1/pages/:id
GET    /api/v1/pages/:id/blocks
POST   /api/v1/blocks
PATCH  /api/v1/blocks/:id
DELETE /api/v1/blocks/:id
GET    /api/v1/tasks?filter=...&sort=...
POST   /api/v1/search
GET    /api/v1/databases/:id/rows
POST   /api/v1/databases/:id/rows
POST   /api/v1/capture  (quick capture endpoint)
```

API keys per workspace. Rate limited. Webhook subscriptions for events (page created, task completed, etc.).

### 9.2 — Integrations (Future)

- **Calendar sync**: Google Calendar / Apple Calendar bi-directional sync for tasks with due dates
- **Browser extension**: Web clipper for saving articles, bookmarks, highlighted text
- **Zapier / Make**: Triggers and actions for automation
- **GitHub**: Link commits/PRs to tasks
- **Slack**: Share pages, receive task notifications
- **Email**: Forward emails to create pages, send task reminders

---

## 10. Performance Budgets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.0s |
| Time to Interactive | < 2.0s |
| Block creation latency | < 50ms |
| Page switch latency | < 100ms |
| Search result display | < 50ms per keystroke |
| Sync round-trip (online) | < 500ms |
| Offline-to-online sync | < 2s for typical session |
| Bundle size (initial) | < 200KB gzipped |
| SQLite query (local) | < 10ms for common queries |
| Memory usage (1000 blocks) | < 50MB |

---

## 11. Security and Privacy

- All data encrypted in transit (TLS 1.3) and at rest (AES-256)
- End-to-end encryption option for sensitive workspaces (server cannot read content)
- No telemetry without explicit opt-in
- GDPR-compliant data handling
- SOC 2 compliance roadmap
- Self-hosting option for full data sovereignty
- Regular security audits
- 2FA support (TOTP, WebAuthn/passkeys)

---

## 12. Monetization (Future)

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | $0 | 1 workspace, unlimited pages/tasks, local storage, 100MB file storage |
| **Pro** | $8/mo | Unlimited workspaces, cloud sync across devices, 10GB file storage, version history (30 days), priority support |
| **Team** | $12/user/mo | Everything in Pro + real-time collaboration, shared workspaces, admin controls, SSO, 50GB file storage, unlimited version history |

Free tier must be genuinely useful, not crippled. The product sells itself when people hit the limits of single-device use.

---

## 13. Success Metrics

**North Stars:**
- Daily Active Users (DAU) / Monthly Active Users (MAU) ratio > 60% (high engagement)
- Pages created per active user per week > 5
- Task completion rate > 70% (tasks created vs. completed within 2 weeks)

**Experience Metrics:**
- Page load time p95 < 1.5s
- Sync conflict rate < 0.1%
- Crash rate < 0.5%
- NPS > 50

**Growth Metrics:**
- Organic signups (word of mouth, content marketing)
- Free → Pro conversion rate > 5%
- Monthly churn < 3%

---

## 14. Open Questions for Development

1. **Editor library**: TipTap is recommended, but evaluate BlockNote (TipTap-based, block-native) as a potentially faster starting point. Trade-off: less customization vs. faster time to MVP.
2. **Mobile strategy**: React Native for true native, or Capacitor/PWA for code sharing? PWA is recommended for Phase 1, native app for Phase 2 if adoption warrants it.
3. **Self-hosting**: How early to support? Recommend offering a Docker compose setup by Phase 4.
4. **AI features**: Intentionally omitted from V1 to focus on fundamentals. Future additions could include: summarize page, auto-tag tasks, suggest links, generate templates, natural language database queries. These should be opt-in and privacy-respecting.
5. **File handling**: How to handle large file attachments in local-first architecture? Recommend: files stored as references (uploaded to R2), not embedded in CRDT. Download on demand.

---

## 15. Development Guidelines for Claude Code

**When building this with Claude Code, follow these principles:**

1. **Start with the data model.** Get the SQLite schema and Block CRUD operations right before touching any UI. Everything depends on this.

2. **Editor quality is non-negotiable.** Spend extra time on TipTap configuration. A buggy editor will kill the product. Test every block type, every keyboard shortcut, every edge case (empty blocks, nested blocks, long documents).

3. **Ship incremental phases.** Each phase should produce a usable (if incomplete) product. Don't stub out features — build each one fully before moving on.

4. **Performance from day one.** Don't "optimize later." Use virtual rendering for lists from the start. Use Web Workers for search indexing from the start. Set up performance monitoring early.

5. **Test offline behavior constantly.** After Phase 4 (sync), every new feature must be tested with: (a) online, (b) offline, (c) offline-then-online, (d) conflicting edits on two devices.

6. **Keep the bundle small.** Code-split aggressively. The editor, database views, graph view, and charting should all be lazy-loaded.

7. **Accessibility matters.** Keyboard navigation, screen reader support, high contrast mode. Build it in from the start, not as an afterthought.

---

*Mission Control: Your entire work life in one place. Fast, connected, and always available.*
