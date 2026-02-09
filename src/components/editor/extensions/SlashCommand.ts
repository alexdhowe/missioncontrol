import { Extension } from '@tiptap/core'
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion'
import { PluginKey } from '@tiptap/pm/state'

const slashCommandPluginKey = new PluginKey('slashCommand')

export interface SlashCommandItem {
  title: string
  description: string
  icon: string
  command: (props: { editor: any; range: any }) => void
}

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        pluginKey: slashCommandPluginKey,
        command: ({
          editor,
          range,
          props,
        }: {
          editor: any
          range: any
          props: SlashCommandItem
        }) => {
          props.command({ editor, range })
        },
      } as Partial<SuggestionOptions<SlashCommandItem>>,
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashCommandItem>({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
