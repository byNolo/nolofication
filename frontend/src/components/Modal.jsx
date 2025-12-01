import { X } from 'lucide-react'
import { useEffect } from 'react'
import Button from './Button'

export default function Modal({ isOpen, onClose, title, children, footer }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-[#13181a] rounded-xl shadow-2xl border border-[#2a2f31] max-w-lg w-full animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2f31]">
            <h3 className="text-lg font-semibold text-[#f3f7f7]">{title}</h3>
            <button
              onClick={onClose}
              className="text-[#f3f7f7]/50 hover:text-[#f3f7f7] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-[#2a2f31] flex justify-end gap-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
