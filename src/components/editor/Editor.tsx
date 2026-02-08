import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { ReactRenderer } from '@tiptap/react'
import { SlashCommand } from './extensions/SlashCommand'
import { SlashCommandMenu, getSuggestionItems } from './SlashCommandMenu'

interface EditorProps {
  content: Record<string, unknown> | null
  onUpdate: (content: Record<string, unknown>) => void
  onEditorReady?: (editor: any) => void
  editable?: boolean
}

export default function Editor({
  content,
  onUpdate,
  onEditorReady,
  editable = true,
}: EditorProps) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'not-prose' } },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
      }),
      Highlight.configure({ multicolor: true }),
      Underline,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: { class: 'text-[#7B8CF8] hover:text-[#A5B4FC] underline cursor-pointer transition-colors' },
      }),
      SlashCommand.configure({
        suggestion: {
          items: getSuggestionItems,
          render: () => {
            let component: ReactRenderer | null = null
            let popup: HTMLDivElement | null = null

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(SlashCommandMenu, {
                  props,
                  editor: props.editor,
                })

                popup = document.createElement('div')
                popup.style.position = 'absolute'
                popup.style.zIndex = '50'
                popup.appendChild(component.element)
                document.body.appendChild(popup)

                const rect = props.clientRect?.()
                if (rect && popup) {
                  popup.style.left = `${rect.left}px`
                  popup.style.top = `${rect.bottom + 4}px`
                }
              },
              onUpdate: (props: any) => {
                component?.updateProps(props)
                const rect = props.clientRect?.()
                if (rect && popup) {
                  popup.style.left = `${rect.left}px`
                  popup.style.top = `${rect.bottom + 4}px`
                }
              },
              onKeyDown: (props: any) => {
                if (props.event.key === 'Escape') {
                  popup?.remove()
                  component?.destroy()
                  popup = null
                  component = null
                  return true
                }
                return (component?.ref as any)?.onKeyDown(props) ?? false
              },
              onExit: () => {
                popup?.remove()
                component?.destroy()
                popup = null
                component = null
              },
            }
          },
        },
      }),
    ],
    content: content || { type: 'doc', content: [{ type: 'paragraph' }] },
    editable,
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-sm max-w-none focus:outline-none',
      },
      handleClick: (view, pos, event) => {
        // Handle internal link clicks
        const link = (event.target as HTMLElement).closest('a')
        if (link) {
          const href = link.getAttribute('href')
          if (href?.startsWith('/page/')) {
            event.preventDefault()
            window.history.pushState({}, '', href)
            window.dispatchEvent(new PopStateEvent('popstate'))
            return true
          }
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        onUpdate(editor.getJSON() as Record<string, unknown>)
      }, 500)
    },
  })

  // Expose editor instance
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor)
    }
  }, [editor, onEditorReady])

  // Update content when it changes externally (page navigation)
  useEffect(() => {
    if (editor && content) {
      const currentContent = JSON.stringify(editor.getJSON())
      const newContent = JSON.stringify(content)
      if (currentContent !== newContent) {
        editor.commands.setContent(content)
      }
    }
  }, [content, editor])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  return <EditorContent editor={editor} />
}
