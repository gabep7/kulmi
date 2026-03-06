'use client'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, id, className = '', ...props }, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-base font-medium text-[#111111]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`w-full border bg-white px-3 py-2.5 text-[#111111] placeholder-[#bbbbbb] text-base transition-colors focus:outline-none focus:ring-1 focus:ring-[#111111] focus:border-[#111111] disabled:opacity-40 disabled:cursor-not-allowed ${error ? 'border-[#cc0000]' : 'border-[#e5e5e5] hover:border-[#999999]'} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-[#cc0000]">{error}</p>}
    </div>
  )
})
Input.displayName = 'Input'
export default Input
