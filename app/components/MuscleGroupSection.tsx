'use client'

import { useState, useEffect, useCallback } from 'react'
import ExerciseInput from './ExerciseInput'
import Link from 'next/link'

interface Exercise {
  id: string
  name: string
  previousData?: {
    weight: number
    reps: number
    sets: number
  }
}

interface MuscleGroupSectionProps {
  muscleGroupName: string
  exercises: Exercise[]
  onMuscleGroupTotalChange: (muscleGroup: string, total: number) => void
  onExerciseDataUpdate?: (exerciseId: string, data: { weight: number; reps: number; sets: number }) => void
}

export default function MuscleGroupSection({ 
  muscleGroupName, 
  exercises, 
  onMuscleGroupTotalChange,
  onExerciseDataUpdate
}: MuscleGroupSectionProps) {
  const [exerciseData, setExerciseData] = useState<Record<string, { weight: number; reps: number; sets: number }>>({})

  const handleExerciseDataChange = useCallback((exerciseId: string, data: { weight: number; reps: number; sets: number }) => {
    setExerciseData(prev => ({
      ...prev,
      [exerciseId]: data
    }))
    
    // Pass data to parent if callback provided
    if (onExerciseDataUpdate) {
      onExerciseDataUpdate(exerciseId, data)
    }
  }, [onExerciseDataUpdate])

  const muscleGroupTotal = Object.values(exerciseData).reduce((total, data) => {
    return total + (data.weight * data.reps * data.sets)
  }, 0)

  useEffect(() => {
    onMuscleGroupTotalChange(muscleGroupName, muscleGroupTotal)
  }, [muscleGroupTotal, muscleGroupName, onMuscleGroupTotalChange])

  // Show message if no exercises
  if (exercises.length === 0) {
    return (
      <div className="block-bg rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white capitalize">{muscleGroupName}</h3>
          <span className="text-lg text-white font-medium">0.0 kg</span>
        </div>
        
        <div className="text-center py-8">
          <p className="text-gray-300 mb-4">
            This muscle group doesn&apos;t contain any exercises yet. Head over to{' '}
            <Link href="/management" className="text-blue-400 hover:text-blue-300 underline">
              Management
            </Link>
            {' '}to add new ones.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="block-bg rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white capitalize">{muscleGroupName}</h3>
        <span className="text-lg text-white font-medium">{muscleGroupTotal.toFixed(1)} kg</span>
      </div>
      
      <div className="space-y-3">
        {exercises.map((exercise) => (
          <ExerciseInput
            key={exercise.id}
            exerciseId={exercise.id}
            exerciseName={exercise.name}
            previousData={exercise.previousData}
            onDataChange={handleExerciseDataChange}
          />
        ))}
      </div>
    </div>
  )
}