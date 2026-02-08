import { Node, mergeAttributes } from '@tiptap/core'

export const ToggleList = Node.create({
  name: 'details',
  group: 'block',
  content: 'detailsSummary detailsContent',
  defining: true,

  parseHTML() {
    return [{ tag: 'details' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['details', mergeAttributes(HTMLAttributes, { class: 'toggle-block' }), 0]
  },

  addCommands() {
    return {
      setToggle: () => ({ commands }: { commands: any }) => {
        return commands.insertContent({
          type: this.name,
          content: [
            { type: 'detailsSummary', content: [{ type: 'text', text: 'Toggle' }] },
            { type: 'detailsContent', content: [{ type: 'paragraph' }] },
          ],
        })
      },
    } as any
  },
})

export const DetailsSummary = Node.create({
  name: 'detailsSummary',
  group: 'block',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [{ tag: 'summary' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['summary', mergeAttributes(HTMLAttributes), 0]
  },
})

export const DetailsContent = Node.create({
  name: 'detailsContent',
  group: 'block',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-details-content]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-details-content': '' }), 0]
  },
})
