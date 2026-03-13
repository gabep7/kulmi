'use client'

import { useState } from 'react'
import { StudyMethod } from '@/lib/api'

interface MethodCardProps {
  method: StudyMethod
  isSelected: boolean
  onSelect: () => void
}

export default function MethodCard({ method, isSelected, onSelect }: MethodCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div
      className={`
        border rounded-lg overflow-hidden transition-all
        ${isSelected 
          ? 'border-[#111111] bg-[#fafafa] ring-1 ring-[#111111]' 
          : 'border-[#e5e5e5] hover:border-[#999999] bg-white'
        }
      `}
    >
      <div 
        className="p-4"
        onClick={onSelect}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#111111] text-base">{method.name}</h3>
            {!showDetails && (
              <p className="text-sm text-[#666666] mt-1 overflow-hidden text-ellipsis line-clamp-2">
                {method.description}
              </p>
            )}
          </div>
          <div className="ml-4 text-right shrink-0">
            <div className="text-xs font-medium text-[#111111] bg-[#f0f0f0] px-2 py-1 rounded">
              {method.focus_time}
            </div>
            <div className="text-xs text-[#999999] mt-1">focus</div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-3">
          <span className="text-xs text-[#666666] bg-[#f5f5f5] px-2 py-1 rounded">
            Break: {method.break_time}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {method.ideal_for.slice(0, 3).map((item, i) => (
            <span 
              key={i}
              className="text-[10px] text-[#666666] border border-[#e5e5e5] px-2 py-0.5 rounded-full"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-[#e5e5e5]">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowDetails(!showDetails)
          }}
          className="w-full px-4 py-2 text-xs text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5] transition-colors flex items-center justify-center gap-1"
        >
          {showDetails ? 'Show less' : 'Show more details'}
          <span className={`transform transition-transform ${showDetails ? 'rotate-180' : ''}`}>▼</span>
        </button>
        
        {showDetails && (
          <div className="px-4 pb-4 space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-[#111111] uppercase tracking-wide mb-2">About</h4>
              <p className="text-sm text-[#666666] leading-relaxed">{method.description}</p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-[#111111] uppercase tracking-wide mb-2">Benefits</h4>
              <ul className="space-y-1">
                {method.benefits.map((benefit, i) => (
                  <li key={i} className="text-xs text-[#666666] flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Pros</h4>
                <ul className="space-y-1">
                  {method.pros.slice(0, 3).map((pro, i) => (
                    <li key={i} className="text-xs text-[#666666] flex items-start gap-1.5">
                      <span className="text-green-500">+</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">Cons</h4>
                <ul className="space-y-1">
                  {method.cons.slice(0, 3).map((con, i) => (
                    <li key={i} className="text-xs text-[#666666] flex items-start gap-1.5">
                      <span className="text-red-500">−</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
