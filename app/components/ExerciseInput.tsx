'use client'

import { useState, useEffect } from 'react'

interface ExerciseInputProps {
  exerciseId: string
  exerciseName: string
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
  previousData, 
  onDataChange 
}: ExerciseInputProps) {
  const [weight, setWeight] = useState<string>(previousData?.weight?.toString() || '')
  const [reps, setReps] = useState<string>(previousData?.reps?.toString() || '')
  const [sets, setSets] = useState<string>(previousData?.sets?.toString() || '')

  const totalWeight = weight && reps && sets 
    ? (parseFloat(weight) * parseInt(reps) * parseInt(sets)).toFixed(1)
    : '0'

  useEffect(() => {
    if (weight && reps && sets) {
      const weightNum = parseFloat(weight)
      const repsNum = parseInt(reps)
      const setsNum = parseInt(sets)
      
      if (weightNum > 0 && repsNum > 0 && setsNum > 0) {
        onDataChange(exerciseId, {
          weight: weightNum,
          reps: repsNum,
          sets: setsNum
        })
      }
    }
  }, [weight, reps, sets, exerciseId, onDataChange])

  const handleNumberInput = (value: string, setter: (value: string) => void) => {
    // Only allow positive numbers up to 2900
    if (value === '' || (/^\d+\.?\d*$/.test(value) && parseFloat(value) <= 2900)) {
      setter(value)
    }
  }

  return (
    <div className="block-bg rounded-lg p-4 mb-3">
      <h4 className="text-white font-medium mb-3">{exerciseName}</h4>
      
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Weight (kg)</label>
          <input
            type="number"
            inputMode="numeric"
            value={weight}
            onChange={(e) => handleNumberInput(e.target.value, setWeight)}
            placeholder="?"
            className="w-full text-center"
            min="1"
            max="2900"
            step="0.5"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-300 mb-1">Reps</label>
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => handleNumberInput(e.target.value, setReps)}
            placeholder="?"
            className="w-full text-center"
            min="1"
            max="2900"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-300 mb-1">Sets</label>
          <input
            type="number"
            inputMode="numeric"
            value={sets}
            onChange={(e) => handleNumberInput(e.target.value, setSets)}
            placeholder="?"
            className="w-full text-center"
            min="1"
            max="2900"
          />
        </div>
      </div>
      
      <div className="text-right">
        <span className="text-sm text-gray-300">Total: </span>
        <span className="text-white font-semibold">{totalWeight} kg</span>
      </div>
    </div>
  )
}