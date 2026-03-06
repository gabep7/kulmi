import { HTMLAttributes, ReactNode } from 'react'
interface CardProps extends HTMLAttributes<HTMLDivElement> { children: ReactNode; hover?: boolean }
export default function Card({ children, hover = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-white border border-[#e5e5e5] ${hover ? 'hover:border-[#999999] transition-colors duration-150 cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
