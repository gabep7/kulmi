'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  getStudyMethods, 
  getStudySessions, 
  getStudyStats,
  getActiveStudySession,
  createStudySession,
  updateStudySession,
  deleteStudySession,
  StudyMethod,
  StudySession,
  StudyStats as StudyStatsType
} from '@/lib/api'
import MethodCard from '@/components/timer/MethodCard'
import ActiveTimer from '@/components/timer/ActiveTimer'
import SessionHistory from '@/components/timer/SessionHistory'
import StudyStats from '@/components/timer/StudyStats'
import Spinner from '@/components/ui/Spinner'

// default durations in seconds
const METHOD_DURATIONS: Record<string, number> = {
  'pomodoro': 25 * 60,
  '52-17': 52 * 60,
  'flowtime': 45 * 60,
  'ultradian': 90 * 60,
  'anime': 24 * 60,
  'rule-of-three': 30 * 60,
  'desktime': 52 * 60,
  'feynman': 45 * 60,
}

export default function TimerPage() {
  const { data: session } = useSession()
  const token = session?.accessToken

  const [methods, setMethods] = useState<StudyMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<StudyMethod | null>(null)
  const [activeSession, setActiveSession] = useState<StudySession | null>(null)
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [stats, setStats] = useState<StudyStatsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  const loadData = useCallback(async () => {
    if (!token) return
    
    try {
      const [methodsData, sessionsData, statsData, activeData] = await Promise.all([
        getStudyMethods(),
        getStudySessions(token),
        getStudyStats(token),
        getActiveStudySession(token).catch(() => null),
      ])
      
      setMethods(methodsData)
      setSessions(sessionsData)
      setStats(statsData)
      
      if (activeData && (activeData.status === 'active' || activeData.status === 'paused')) {
        setActiveSession(activeData)
        const method = methodsData.find(m => m.id === activeData.method)
        if (method) setSelectedMethod(method)
      }
    } catch (err) {
      console.error('failed to load timer data:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleStartSession = async () => {
    if (!selectedMethod || !token) return
    
    setStarting(true)
    try {
      if (activeSession && activeSession.status === 'active') {
        await updateStudySession(
          activeSession.id,
          { status: 'cancelled', ended_at: new Date().toISOString() },
          token
        )
      }

      const duration = METHOD_DURATIONS[selectedMethod.id] || 25 * 60
      const newSession = await createStudySession(
        { 
          method: selectedMethod.id, 
          planned_duration: duration 
        },
        token
      )
      
      setActiveSession(newSession)
      setSessions(prev => [newSession, ...prev])
    } catch (err) {
      console.error('failed to start session:', err)
    } finally {
      setStarting(false)
    }
  }

  const handlePauseSession = async () => {
    if (!activeSession || !token) return
    
    try {
      await updateStudySession(
        activeSession.id,
        { status: 'paused' },
        token
      )
    } catch (err) {
      console.error('failed to pause session:', err)
    }
  }

  const handleResumeSession = async () => {
    if (!activeSession || !token) return
    
    try {
      await updateStudySession(
        activeSession.id,
        { status: 'active' },
        token
      )
    } catch (err) {
      console.error('failed to resume session:', err)
    }
  }

  const handleCompleteSession = async () => {
    if (!activeSession || !token) return
    
    try {
      const endedAt = new Date()
      const startedAt = new Date(activeSession.started_at)
      const actualDuration = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)
      
      await updateStudySession(
        activeSession.id,
        { 
          status: 'completed',
          actual_duration: actualDuration,
          ended_at: endedAt.toISOString()
        },
        token
      )
      
      const [sessionsData, statsData] = await Promise.all([
        getStudySessions(token),
        getStudyStats(token),
      ])
      
      setSessions(sessionsData)
      setStats(statsData)
      setActiveSession(null)
      setSelectedMethod(null)
    } catch (err) {
      console.error('failed to complete session:', err)
    }
  }

  const handleCancelSession = async () => {
    if (!activeSession || !token) return
    
    try {
      await updateStudySession(
        activeSession.id,
        { 
          status: 'cancelled',
          ended_at: new Date().toISOString()
        },
        token
      )
      
      const sessionsData = await getStudySessions(token)
      setSessions(sessionsData)
      setActiveSession(null)
      setSelectedMethod(null)
    } catch (err) {
      console.error('failed to cancel session:', err)
    }
  }

  const handleDeleteSession = async (id: number) => {
    if (!token) return
    
    try {
      await deleteStudySession(id, token)
      setSessions(prev => prev.filter(s => s.id !== id))
      
      const statsData = await getStudyStats(token)
      setStats(statsData)
    } catch (err) {
      console.error('failed to delete session:', err)
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-10 max-w-4xl mx-auto">
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-[#111111] tracking-tight mb-1">
          Study Timer
        </h1>
        <p className="text-[#666666] text-sm">
          focused work sessions with structured breaks
        </p>
      </div>

      <div className="mb-8">
        <StudyStats stats={stats} />
      </div>

      {activeSession && selectedMethod ? (
        <div className="mb-10">
          <ActiveTimer
            session={activeSession}
            method={selectedMethod}
            onPause={handlePauseSession}
            onResume={handleResumeSession}
            onComplete={handleCompleteSession}
            onCancel={handleCancelSession}
          />
        </div>
      ) : (
        <div className="mb-10">
          <h2 className="text-xs tracking-widest uppercase text-[#999999] mb-4">
            choose a method
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {methods.map((method) => (
              <MethodCard
                key={method.id}
                method={method}
                isSelected={selectedMethod?.id === method.id}
                onSelect={() => setSelectedMethod(method)}
              />
            ))}
          </div>

          {selectedMethod && (
            <div className="flex justify-center">
              <button
                onClick={handleStartSession}
                disabled={starting}
                className="bg-[#111111] text-white text-sm font-medium px-8 py-3 hover:bg-[#333333] transition-colors rounded disabled:opacity-50"
              >
                {starting ? 'starting...' : `Start ${selectedMethod.name}`}
              </button>
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="text-xs tracking-widest uppercase text-[#999999] mb-4">
          recent sessions
        </h2>
        <SessionHistory 
          sessions={sessions.slice(0, 10)} 
          onDelete={handleDeleteSession}
        />
      </div>
    </div>
  )
}
