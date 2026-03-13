'use client'

import { useState } from 'react'
import { StudySession } from '@/lib/api'

interface SessionHistoryProps {
  sessions: StudySession[]
  onDelete: (id: number) => void
}

export default function SessionHistory({ sessions, onDelete }: SessionHistoryProps) {
  const [expandedSession, setExpandedSession] = useState<number | null>(null)

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '—'
    const mins = Math.floor(seconds / 60)
    const hrs = Math.floor(mins / 60)
    if (hrs > 0) {
      return `${hrs}h ${mins % 60}m`
    }
    return `${mins}m`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      case 'active':
        return 'bg-blue-100 text-blue-700'
      case 'paused':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-[#999999]">
        <p className="text-sm">No sessions yet. Start your first study timer!</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <div 
          key={session.id}
          className="border border-[#e5e5e5] rounded-lg overflow-hidden hover:border-[#999999] transition-colors"
        >
          <div 
            className="flex items-center justify-between px-4 py-3 cursor-pointer bg-white"
            onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
          >
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded ${getStatusColor(session.status)}`}>
                {session.status}
              </span>
              <div>
                <p className="text-sm font-medium text-[#111111]">
                  {getMethodName(session.method)}
                </p>
                <p className="text-xs text-[#999999]">
                  {formatDate(session.started_at)} at {formatDateTime(session.started_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-[#111111]">
                  {formatTime(session.actual_duration)}
                </p>
                <p className="text-xs text-[#999999]">focused</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(session.id)
                }}
                className="text-[#999999] hover:text-red-600 transition-colors p-1"
                title="Delete session"
              >
                ×
              </button>
            </div>
          </div>

          {expandedSession === session.id && (
            <div className="px-4 py-3 border-t border-[#e5e5e5] bg-[#fafafa]">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-[#999999] text-xs mb-1">Planned</p>
                  <p className="text-[#111111] font-medium">{formatTime(session.planned_duration)}</p>
                </div>
                <div>
                  <p className="text-[#999999] text-xs mb-1">Actual</p>
                  <p className="text-[#111111] font-medium">{formatTime(session.actual_duration)}</p>
                </div>
                <div>
                  <p className="text-[#999999] text-xs mb-1">Break</p>
                  <p className="text-[#111111] font-medium">{formatTime(session.break_duration)}</p>
                </div>
              </div>
              
              {session.notes && (
                <div className="mt-3 pt-3 border-t border-[#e5e5e5]">
                  <p className="text-[#999999] text-xs mb-1">Notes</p>
                  <p className="text-sm text-[#666666]">{session.notes}</p>
                </div>
              )}

              {session.ended_at && (
                <div className="mt-3 text-xs text-[#999999]">
                  ended at {formatDateTime(session.ended_at)}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
