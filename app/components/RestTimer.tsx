'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Minus } from 'lucide-react'

interface RestTimerProps {
  isOpen: boolean
  onClose: () => void
  restTime: number
  exerciseName: string
  totalSets: number
}

export default function RestTimer({ isOpen, onClose, restTime, exerciseName, totalSets }: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(restTime)
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [currentSet, setCurrentSet] = useState(1)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(restTime)
      setIsRunning(false)
      setIsCompleted(false)
      setCurrentSet(1)
    }
  }, [isOpen, restTime])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            setIsCompleted(true)
            // Play completion sound
            if (typeof window !== 'undefined' && 'AudioContext' in window) {
              const audioContext = new AudioContext()
              const oscillator = audioContext.createOscillator()
              const gainNode = audioContext.createGain()
              
              oscillator.connect(gainNode)
              gainNode.connect(audioContext.destination)
              
              oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
              gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
              
              oscillator.start(audioContext.currentTime)
              oscillator.stop(audioContext.currentTime + 0.5)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    setIsRunning(true)
    setIsCompleted(false)
  }

  const handleSkip = () => {
    setIsRunning(false)
    setIsCompleted(true)
  }

  const handleNextSet = () => {
    if (currentSet < totalSets) {
      setCurrentSet(prev => prev + 1)
      setTimeLeft(restTime)
      setIsRunning(false)
      setIsCompleted(false)
    } else {
      onClose()
    }
  }

  const adjustTime = (adjustment: number) => {
    setTimeLeft((prev) => Math.max(0, prev + adjustment))
  }

  const progress = ((restTime - timeLeft) / restTime) * 100
  const remainingSets = totalSets - currentSet

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`w-[90vw] max-w-sm bg-white/5 backdrop-blur-xl border ${isCompleted ? 'border-green-400/30' : 'border-white/20'} shadow-2xl rounded-xl fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`}>
        <DialogHeader>
          <DialogTitle className="text-white text-center text-lg">
            {exerciseName} - Set {currentSet} of {totalSets}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 p-2">
          {/* Circular Progress - smaller on mobile */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto">
            <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-white/20"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                className={`transition-all duration-1000 ${
                  isCompleted ? 'text-green-400' : 'text-purple-400'
                }`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xl sm:text-2xl font-bold ${
                isCompleted ? 'text-green-400' : 'text-white'
              }`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Time Adjustment - only show when not running */}
          {!isRunning && !isCompleted && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => adjustTime(-10)}
                className="text-xs px-2 py-1"
              >
                <Minus className="w-3 h-3" />
                10s
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => adjustTime(10)}
                className="text-xs px-2 py-1"
              >
                <Plus className="w-3 h-3" />
                10s
              </Button>
            </div>
          )}

          {/* Main Action Button - smaller on mobile */}
          <div className="flex justify-center">
            {!isRunning && !isCompleted && (
              <Button onClick={handleStart} className="w-full py-2 text-sm">
                Start
              </Button>
            )}
            
            {isRunning && (
              <Button onClick={handleSkip} variant="outline" className="w-full py-2 text-sm">
                Skip
              </Button>
            )}
            
            {isCompleted && remainingSets > 0 && (
              <Button onClick={handleNextSet} className="w-full py-2 text-sm bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-300/30 hover:from-green-500/30 hover:to-emerald-500/30 text-white">
                Next set, {remainingSets} left
              </Button>
            )}

            {isCompleted && remainingSets === 0 && (
              <Button onClick={onClose} className="w-full py-2 text-sm bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-300/30 hover:from-green-500/30 hover:to-emerald-500/30 text-white">
                Workout Complete!
              </Button>
            )}
          </div>

          {/* Completion Message */}
          {isCompleted && (
            <div className="text-center">
              <p className="text-green-400 font-semibold text-sm">
                {remainingSets > 0 ? 'Rest Complete!' : 'All sets completed!'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}