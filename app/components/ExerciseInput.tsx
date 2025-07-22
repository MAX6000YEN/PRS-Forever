'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import RestTimer from './RestTimer'
import { Timer } from 'lucide-react'

interface ExerciseInputProps {
  exerciseId: string
  exerciseName: string
  description?: string
  externalLink?: string
  externalLinkName?: string
  restTime?: number
  previousData?: {
    weight: number
    reps: number
    sets: number
  }
  onDataChange: (exerciseId: string, data: { weight: number; reps: number; sets: number }) => void
}

export default function ExerciseInput({ 
  exerciseId, 
  exerciseName, 
  description,
  externalLink,
  externalLinkName,
  restTime = 60,
  previousData, 
  onDataChange 
}: ExerciseInputProps) {
  const [weight, setWeight] = useState<string>(previousData?.weight?.toString() || '')
  const [reps, setReps] = useState<string>(previousData?.reps?.toString() || '')
  const [sets, setSets] = useState<string>(previousData?.sets?.toString() || '')
  const [showTimer, setShowTimer] = useState(false)

  const totalWeight = weight && reps && sets 
    ? (parseFloat(weight) * parseInt(reps) * parseInt(sets)).toFixed(1)
    : '0'

  // Format rest time for display (e.g., "0:40" for 40 seconds, "5:00" for 5 minutes)
  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    const weightNum = parseFloat(weight) || 0
    const repsNum = parseInt(reps) || 0
    const setsNum = parseInt(sets) || 0
    
    // Always report the current state to parent, even if incomplete
    onDataChange(exerciseId, {
      weight: weightNum,
      reps: repsNum,
      sets: setsNum
    })
  }, [weight, reps, sets, exerciseId, onDataChange])

  const handleNumberInput = (value: string, setter: (value: string) => void) => {
    // Only allow positive numbers up to 2900
    if (value === '' || (/^\d+\.?\d*$/.test(value) && parseFloat(value) <= 2900)) {
      setter(value)
    }
  }

  return (
    <div className="glass rounded-lg p-4 mb-3">
      <h4 className="text-white font-medium mb-2">{exerciseName}</h4>
      
      {/* Description */}
      {description && (
        <p className="text-gray-300 text-sm mb-2">{description}</p>
      )}
      
      {/* External Link */}
      {externalLink && externalLinkName && (
        <div className="mb-3">
          <Button 
            variant="outline" 
            size="sm" 
            asChild
          >
            <a 
              href={externalLink} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {externalLinkName}
            </a>
          </Button>
        </div>
      )}

      {/* Rest time and Start exercise button - ABOVE the input fields */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-white font-medium">
          Rest time: {formatRestTime(restTime)}
        </div>
        <Button
          onClick={() => setShowTimer(true)}
          variant="default"
          size="sm"
          className="btn-primary"
        >
          Start exercise
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <Label className="text-sm text-gray-300 mb-1">Weight (kg)</Label>
          <Input
            type="number"
            inputMode="numeric"
            value={weight}
            onChange={(e) => handleNumberInput(e.target.value, setWeight)}
            placeholder="?"
            className="text-center"
            min="1"
            max="2900"
            step="0.5"
          />
        </div>
        
        <div>
          <Label className="text-sm text-gray-300 mb-1">Reps</Label>
          <Input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => handleNumberInput(e.target.value, setReps)}
            placeholder="?"
            className="text-center"
            min="1"
            max="2900"
          />
        </div>
        
        <div>
          <Label className="text-sm text-gray-300 mb-1">Sets</Label>
          <Input
            type="number"
            inputMode="numeric"
            value={sets}
            onChange={(e) => handleNumberInput(e.target.value, setSets)}
            placeholder="?"
            className="text-center"
            min="1"
            max="2900"
          />
        </div>
      </div>
      
      <div className="text-right">
        <span className="text-sm text-gray-300">Total: </span>
        <span className="text-white font-semibold">{totalWeight} kg</span>
      </div>
      
      <RestTimer
        isOpen={showTimer}
        onClose={() => setShowTimer(false)}
        restTime={restTime}
        exerciseName={exerciseName}
        totalSets={parseInt(sets) || 1}
      />
    </div>
  )
}