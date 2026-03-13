'use client'

import { StudyStats as StudyStatsType } from '@/lib/api'

interface StudyStatsProps {
  stats: StudyStatsType | null
}

export default function StudyStats({ stats }: StudyStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#f5f5f5] rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-[#e5e5e5] rounded w-12 mb-2"></div>
            <div className="h-3 bg-[#e5e5e5] rounded w-20"></div>
          </div>
        ))}
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const hrs = Math.floor(mins / 60)
    if (hrs > 0) {
      return `${hrs}h ${mins % 60}m`
    }
    return `${mins}m`
  }

  const getMethodName = (methodId: string) => {
    const names: Record<string, string> = {
      'pomodoro': 'pomodoro',
      '52-17': '52/17',
      'flowtime': 'flowtime',
      'ultradian': 'ultradian',
      'anime': 'anime',
      'rule-of-three': 'rule of 3',
      'desktime': 'desktime',
      'feynman': 'feynman',
    }
    return names[methodId] || methodId
  }

  const statItems = [
    {
      value: stats.total_sessions.toString(),
      label: 'Total Sessions',
      highlight: stats.total_sessions > 0,
    },
    {
      value: formatTime(stats.total_focus_time),
      label: 'Total Focus',
      highlight: stats.total_focus_time > 0,
    },
    {
      value: stats.sessions_today.toString(),
      label: 'Today',
      highlight: stats.sessions_today > 0,
    },
    {
      value: getMethodName(stats.favorite_method),
      label: 'Favorite',
      highlight: stats.total_sessions > 0,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statItems.map((item, i) => (
        <div 
          key={i}
          className={`
            rounded-lg p-4 transition-colors
            ${item.highlight 
              ? 'bg-[#111111] text-white' 
              : 'bg-[#f5f5f5] text-[#111111]'
            }
          `}
        >
          <p className={`text-2xl font-bold ${item.highlight ? 'text-white' : 'text-[#111111]'}`}>
            {item.value}
          </p>
          <p className={`text-xs mt-1 ${item.highlight ? 'text-white/70' : 'text-[#666666]'}`}>
            {item.label}
          </p>
        </div>
      ))}
    </div>
  )
}
