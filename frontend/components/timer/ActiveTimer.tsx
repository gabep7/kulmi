'use client'

import { useState, useEffect, useCallback } from 'react'
import { StudyMethod, StudySession } from '@/lib/api'

interface ActiveTimerProps {
  session: StudySession
  method: StudyMethod
  onPause: () => void
  onResume: () => void
  onComplete: () => void
  onCancel: () => void
}

type TimerPhase = 'focus' | 'break' | 'completed'

export default function ActiveTimer({ 
  session, 
  method, 
  onPause, 
  onResume, 
  onComplete, 
  onCancel 
}: ActiveTimerProps) {
  const [phase, setPhase] = useState<TimerPhase>('focus')
  const [timeLeft, setTimeLeft] = useState(session.planned_duration)
  const [breakTimeLeft, setBreakTimeLeft] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [breakDuration, setBreakDuration] = useState(0)

  const getBreakDuration = useCallback(() => {
    const match = method.break_time.match(/(\d+)/)
    if (match) {
      return parseInt(match[1]) * 60
    }
    return 300
  }, [method.break_time])

  useEffect(() => {
    if (phase !== 'focus' || isPaused) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPhase('break')
          setBreakTimeLeft(getBreakDuration())
          return 0
        }
        return prev - 1
      })
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [phase, isPaused, getBreakDuration])

  useEffect(() => {
    if (phase !== 'break' || isPaused) return

    const interval = setInterval(() => {
      setBreakTimeLeft((prev) => {
        if (prev <= 1) {
          setPhase('completed')
          return 0
        }
        return prev - 1
      })
      setBreakDuration((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [phase, isPaused])

  const handlePause = () => {
    setIsPaused(true)
    onPause()
  }

  const handleResume = () => {
    setIsPaused(false)
    onResume()
  }

  const handleComplete = () => {
    onComplete()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgress = () => {
    if (phase === 'focus') {
      return ((session.planned_duration - timeLeft) / session.planned_duration) * 100
    } else if (phase === 'break') {
      return ((getBreakDuration() - breakTimeLeft) / getBreakDuration()) * 100
    }
    return 100
  }

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg p-6 md:p-8">
      <div className="text-center mb-6">
        <span className={`
          inline-block px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide
          ${phase === 'focus' ? 'bg-blue-100 text-blue-700' : ''}
          ${phase === 'break' ? 'bg-green-100 text-green-700' : ''}
          ${phase === 'completed' ? 'bg-purple-100 text-purple-700' : ''}
        `}>
          {phase === 'focus' && 'Focus Time'}
          {phase === 'break' && 'Break Time'}
          {phase === 'completed' && 'Session Complete!'}
        </span>
      </div>

      <div className="text-center mb-8">
        <div className="text-7xl md:text-8xl font-bold text-[#111111] tabular-nums tracking-tight">
          {phase === 'focus' && formatTime(timeLeft)}
          {phase === 'break' && formatTime(breakTimeLeft)}
          {phase === 'completed' && '00:00'}
        </div>
        <p className="text-sm text-[#999999] mt-2">
          {phase === 'focus' && `of ${formatTime(session.planned_duration)} focus time`}
          {phase === 'break' && 'Take a break, stretch, hydrate'}
          {phase === 'completed' && 'Great work! Ready for another round?'}
        </p>
      </div>

      <div className="w-full h-2 bg-[#f0f0f0] rounded-full overflow-hidden mb-8">
        <div 
          className={`
            h-full transition-all duration-1000 ease-linear
            ${phase === 'focus' ? 'bg-[#111111]' : ''}
            ${phase === 'break' ? 'bg-green-500' : ''}
            ${phase === 'completed' ? 'bg-purple-500' : ''}
          `}
          style={{ width: `${getProgress()}%` }}
        />
      </div>

      <div className="flex justify-center gap-6 text-xs text-[#666666] mb-8">
        <div className="text-center">
          <div className="font-medium text-[#111111]">{method.name}</div>
          <div className="text-[#999999]">method</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-[#111111]">{formatTime(elapsedTime)}</div>
          <div className="text-[#999999]">elapsed</div>
        </div>
        {breakDuration > 0 && (
          <div className="text-center">
            <div className="font-medium text-[#111111]">{formatTime(breakDuration)}</div>
            <div className="text-[#999999]">break taken</div>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3">
        {phase !== 'completed' ? (
          <>
            {isPaused ? (
              <button
                onClick={handleResume}
                className="bg-[#111111] text-white text-sm font-medium px-6 py-2.5 hover:bg-[#333333] transition-colors rounded"
              >
                Resume
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="bg-[#111111] text-white text-sm font-medium px-6 py-2.5 hover:bg-[#333333] transition-colors rounded"
              >
                Pause
              </button>
            )}
            
            {phase === 'break' && (
              <button
                onClick={handleComplete}
                className="bg-green-600 text-white text-sm font-medium px-6 py-2.5 hover:bg-green-700 transition-colors rounded"
              >
                Finish
              </button>
            )}
            
            <button
              onClick={onCancel}
              className="border border-[#e5e5e5] text-[#666666] text-sm font-medium px-6 py-2.5 hover:border-[#999999] hover:text-[#111111] transition-colors rounded"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleComplete}
              className="bg-[#111111] text-white text-sm font-medium px-6 py-2.5 hover:bg-[#333333] transition-colors rounded"
            >
              Complete Session
            </button>
            <button
              onClick={onCancel}
              className="border border-[#e5e5e5] text-[#666666] text-sm font-medium px-6 py-2.5 hover:border-[#999999] hover:text-[#111111] transition-colors rounded"
            >
              Start New
            </button>
          </>
        )}
      </div>
    </div>
  )
}
