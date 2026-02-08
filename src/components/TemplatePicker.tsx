import { useEffect } from 'react'
import { X } from 'lucide-react'
import { PAGE_TEMPLATES } from '../lib/templates'
import type { PageTemplate } from '../lib/templates'

interface TemplatePickerProps {
  onSelect: (template: PageTemplate) => void
  onClose: () => void
}

export default function TemplatePicker({ onSelect, onClose }: TemplatePickerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-overlay border border-white/[0.08] rounded-2xl shadow-glow-lg w-full max-w-lg overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">Choose a template</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/[0.06] transition-all duration-200"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Template Grid */}
        <div className="p-4 grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
          {PAGE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className="flex flex-col items-start gap-1 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-left hover:border-accent/50 hover:bg-accent/5 transition-all duration-200 group"
            >
              <span className="text-2xl">{template.icon}</span>
              <span className="text-sm font-medium text-gray-200 group-hover:text-accent">
                {template.name}
              </span>
              <span className="text-xs text-gray-500 leading-snug">
                {template.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
