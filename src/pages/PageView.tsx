import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { usePagesStore } from '../stores/pages'
import Editor from '../components/editor/Editor'
import BacklinksPanel from '../components/editor/BacklinksPanel'
import LinkPicker from '../components/editor/LinkPicker'

export default function PageView() {
  const { id } = useParams<{ id: string }>()
  const { currentPage, fetchPage, updatePage, loading } = usePagesStore()
  const [title, setTitle] = useState('')
  const [showLinkPicker, setShowLinkPicker] = useState(false)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const editorRef = useRef<any>(null)
  const saveTitleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (id) fetchPage(id)
  }, [id, fetchPage])

  useEffect(() => {
    if (currentPage) {
      setTitle(currentPage.title)
    }
  }, [currentPage?.id])

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto'
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`
    }
  }, [title])

  // Cmd+L to open link picker
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault()
        setShowLinkPicker(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)

    if (saveTitleTimer.current) clearTimeout(saveTitleTimer.current)
    saveTitleTimer.current = setTimeout(() => {
      if (id) updatePage(id, { title: newTitle || 'Untitled' } as any)
    }, 500)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const tiptap = document.querySelector('.tiptap') as HTMLElement
      tiptap?.focus()
    }
  }

  const handleEditorUpdate = useCallback(
    (content: Record<string, unknown>) => {
      if (id) updatePage(id, { content } as any)
    },
    [id, updatePage]
  )

  const handleLinkSelect = (page: { id: string; title: string }) => {
    setShowLinkPicker(false)
    // Insert a link at the current cursor position in the editor
    if (editorRef.current) {
      editorRef.current
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: page.title,
          marks: [{ type: 'link', attrs: { href: `/page/${page.id}` } }],
        })
        .run()
    }
  }

  if (loading || !currentPage) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
      </div>
    )
  }

  return (
    <div className="max-w-content mx-auto px-6 py-8 animate-fade-in">
      <textarea
        ref={titleRef}
        value={title}
        onChange={handleTitleChange}
        onKeyDown={handleTitleKeyDown}
        placeholder="Untitled"
        className="page-title"
        rows={1}
      />
      <div className="mt-4">
        <Editor
          content={currentPage.content as Record<string, unknown> | null}
          onUpdate={handleEditorUpdate}
          onEditorReady={(editor) => {
            editorRef.current = editor
          }}
        />
      </div>

      {/* Backlinks */}
      {id && (
        <div className="mt-12">
          <BacklinksPanel pageId={id} />
        </div>
      )}

      {/* Link picker modal */}
      {showLinkPicker && (
        <LinkPicker
          onSelect={handleLinkSelect}
          onClose={() => setShowLinkPicker(false)}
        />
      )}
    </div>
  )
}
