import { Extension } from '@tiptap/core'
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion'

export interface WikiLinkItem {
  id: string
  title: string
  icon: string | null
}

export const WikiLink = Extension.create({
  name: 'wikiLink',

  addOptions() {
    return {
      suggestion: {
        char: '[[',
        command: ({ editor, range, props }: { editor: any; range: any; props: WikiLinkItem }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: 'text',
              text: props.title,
              marks: [{ type: 'link', attrs: { href: `/page/${props.id}` } }],
            })
            .run()
        },
      } as Partial<SuggestionOptions<WikiLinkItem>>,
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion<WikiLinkItem>({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
