'use client'
import { ButtonHTMLAttributes, ReactNode } from 'react'
import Spinner from './Spinner'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[#111111] text-white border-[#111111] hover:bg-[#333333] hover:border-[#333333]',
  secondary: 'bg-white text-[#111111] border-[#e5e5e5] hover:border-[#999999] hover:bg-[#f5f5f5]',
  danger: 'bg-white text-[#cc0000] border-[#cc0000] hover:bg-[#fff5f5]',
  ghost: 'bg-transparent text-[#666666] border-transparent hover:text-[#111111] hover:bg-[#f5f5f5]',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export default function Button({ variant = 'primary', size = 'md', loading = false, disabled, children, className = '', ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 border font-medium tracking-wide transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-[#111111] focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
