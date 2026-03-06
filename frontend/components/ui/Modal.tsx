'use client'
import { ReactNode } from 'react'
import Button from './Button'
interface ModalProps { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: ReactNode; confirmLabel?: string; variant?: 'danger' | 'primary'; loading?: boolean }
export default function Modal({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger', loading = false }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white border border-[#e5e5e5] p-8 w-full max-w-md shadow-sm">
        <h2 className="text-lg font-semibold text-[#111111] mb-2">{title}</h2>
        <div className="text-[#666666] text-sm mb-6">{message}</div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
