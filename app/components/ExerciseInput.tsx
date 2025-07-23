'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import RestTimer from './RestTimer'
import { Timer, List } from 'lucide-react'

interface SetData {
  weight: number
  reps: number
}

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
    usesIndividualSets?: boolean
    individualSets?: SetData[]
  }
  onDataChange: (exerciseId: string, data: { 
    weight: number; 
    reps: number; 
    sets: number;
    usesIndividualSets?: boolean;
    individualSets?: SetData[];
  }) => void
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
  const [usesIndividualSets, setUsesIndividualSets] = useState(previousData?.usesIndividualSets || false)
  const [individualSets, setIndividualSets] = useState<SetData[]>(
    previousData?.individualSets || []
  )

  const totalWeight = usesIndividualSets 
    ? individualSets.reduce((total, set) => total + (set.weight * set.reps), 0).toFixed(1)
    : weight && reps && sets 
      ? (parseFloat(weight) * parseInt(reps) * parseInt(sets)).toFixed(1)
      : '0'

  // Format rest time for display (e.g., "0:40" for 40 seconds, "5:00" for 5 minutes)
  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Initialize individual sets when switching to individual mode
  const handleLogEachSet = () => {
    const numSets = parseInt(sets) || 1
    const defaultWeight = parseFloat(weight) || 0
    const defaultReps = parseInt(reps) || 0
    
    const newIndividualSets = Array.from({ length: numSets }, (_, index) => ({
      weight: individualSets[index]?.weight || defaultWeight,
      reps: individualSets[index]?.reps || defaultReps
    }))
    
    setIndividualSets(newIndividualSets)
    setUsesIndividualSets(true)
  }

  // Switch back to simple mode
  const handleUseSimpleMode = () => {
    setUsesIndividualSets(false)
    setIndividualSets([])
  }

  // Update individual set data
  const updateIndividualSet = (setIndex: number, field: 'weight' | 'reps', value: string) => {
    const numValue = field === 'weight' ? parseFloat(value) || 0 : parseInt(value) || 0
    const newSets = [...individualSets]
    newSets[setIndex] = {
      ...newSets[setIndex],
      [field]: numValue
    }
    setIndividualSets(newSets)
  }

  // Update the first set when original weight/reps change
  useEffect(() => {
    if (usesIndividualSets && individualSets.length > 0) {
      const weightNum = parseFloat(weight) || 0
      const repsNum = parseInt(reps) || 0
      const newSets = [...individualSets]
      newSets[0] = {
        ...newSets[0],
        weight: weightNum,
        reps: repsNum
      }
      setIndividualSets(newSets)
    }
  }, [weight, reps, usesIndividualSets])

  useEffect(() => {
    const weightNum = parseFloat(weight) || 0
    const repsNum = parseInt(reps) || 0
    const setsNum = parseInt(sets) || 0
    
    // Always report the current state to parent, even if incomplete
    onDataChange(exerciseId, {
      weight: weightNum,
      reps: repsNum,
      sets: setsNum,
      usesIndividualSets,
      individualSets: usesIndividualSets ? individualSets : undefined
    })
  }, [weight, reps, sets, exerciseId, onDataChange, usesIndividualSets, individualSets])

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

      {/* Original input fields - always visible */}
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

      {/* Individual sets mode - shown underneath original fields when enabled */}
      {usesIndividualSets && individualSets.length > 1 && (
        <div className="mb-3">
          <div className="space-y-2">
            {individualSets.slice(1).map((set, index) => (
              <div key={index + 1} className="grid grid-cols-3 gap-3">
                <div>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={set.weight || ''}
                    onChange={(e) => updateIndividualSet(index + 1, 'weight', e.target.value)}
                    placeholder="?"
                    className="text-center"
                    min="1"
                    max="2900"
                    step="0.5"
                  />
                </div>
                
                <div>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={set.reps || ''}
                    onChange={(e) => updateIndividualSet(index + 1, 'reps', e.target.value)}
                    placeholder="?"
                    className="text-center"
                    min="1"
                    max="2900"
                  />
                </div>
                
                <div className="flex items-center justify-center">
                  <span className="text-sm text-gray-300">Set {index + 2}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        {!usesIndividualSets ? (
          <Button
            onClick={handleLogEachSet}
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={!sets || parseInt(sets) === 0}
          >
            <List className="w-3 h-3 mr-1" />
            Log each set
          </Button>
        ) : (
          <Button
            onClick={handleUseSimpleMode}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Use simple mode
          </Button>
        )}
        <div>
          <span className="text-sm text-gray-300">Total: </span>
          <span className="text-white font-semibold">{totalWeight} kg</span>
        </div>
      </div>
      
      <RestTimer
        isOpen={showTimer}
        onClose={() => setShowTimer(false)}
        restTime={restTime}
        exerciseName={exerciseName}
        totalSets={usesIndividualSets ? individualSets.length : (parseInt(sets) || 1)}
      />
    </div>
  )
}