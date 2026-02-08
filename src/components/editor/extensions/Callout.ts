import { Node, mergeAttributes } from '@tiptap/core'

export type CalloutVariant = 'info' | 'warning' | 'success' | 'error'

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: 'info',
        parseHTML: (element) => element.getAttribute('data-variant') || 'info',
        renderHTML: (attributes) => ({ 'data-variant': attributes.variant }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '', class: 'callout' }), 0]
  },

  addCommands() {
    return {
      setCallout: (attrs?: { variant?: CalloutVariant }) => ({ commands }: { commands: any }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { variant: attrs?.variant || 'info' },
          content: [{ type: 'paragraph' }],
        })
      },
    } as any
  },
})
