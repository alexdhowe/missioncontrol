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
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold">Choose a template</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Template Grid */}
        <div className="p-4 grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
          {PAGE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className="flex flex-col items-start gap-1 p-3 rounded-lg border border-gray-200 text-left hover:border-[#2563EB] hover:bg-blue-50/30 transition-colors group"
            >
              <span className="text-2xl">{template.icon}</span>
              <span className="text-sm font-medium text-gray-800 group-hover:text-[#2563EB]">
                {template.name}
              </span>
              <span className="text-xs text-gray-400 leading-snug">
                {template.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
