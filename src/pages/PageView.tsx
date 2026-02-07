import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { usePagesStore } from '../stores/pages'
import Editor from '../components/editor/Editor'

export default function PageView() {
  const { id } = useParams<{ id: string }>()
  const { currentPage, fetchPage, updatePage, loading } = usePagesStore()
  const [title, setTitle] = useState('')
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const saveTitleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (id) fetchPage(id)
  }, [id, fetchPage])

  useEffect(() => {
    if (currentPage) {
      setTitle(currentPage.title)
    }
  }, [currentPage?.id])

  // Auto-resize title textarea
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto'
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`
    }
  }, [title])

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
      // Focus the editor below
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

  if (loading || !currentPage) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
      </div>
    )
  }

  return (
    <div className="max-w-content mx-auto px-6 py-8">
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
        />
      </div>
    </div>
  )
}
