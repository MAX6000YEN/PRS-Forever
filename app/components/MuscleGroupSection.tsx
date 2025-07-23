'use client'

import { useState, useEffect, useCallback } from 'react'
import ExerciseInput from './ExerciseInput'
import Link from 'next/link'
import { Card, CardContent } from "@/components/ui/card"

interface Exercise {
  id: string
  name: string
  description?: string
  external_link?: string
  external_link_name?: string
  rest_time?: number
  previousData?: {
    weight: number
    reps: number
    sets: number
    usesIndividualSets?: boolean
    individualSets?: Array<{ weight: number; reps: number }>
  }
}

interface MuscleGroupSectionProps {
  muscleGroupName: string
  exercises: Exercise[]
  onMuscleGroupTotalChange: (muscleGroup: string, total: number) => void
  onExerciseDataUpdate?: (exerciseId: string, data: { 
    weight: number; 
    reps: number; 
    sets: number;
    usesIndividualSets?: boolean;
    individualSets?: Array<{ weight: number; reps: number }>;
  }) => void
}

export default function MuscleGroupSection({ 
  muscleGroupName, 
  exercises, 
  onMuscleGroupTotalChange,
  onExerciseDataUpdate
}: MuscleGroupSectionProps) {
  const [exerciseData, setExerciseData] = useState<Record<string, { 
    weight: number; 
    reps: number; 
    sets: number;
    usesIndividualSets?: boolean;
    individualSets?: Array<{ weight: number; reps: number }>;
  }>>({})

  const handleExerciseDataChange = useCallback((exerciseId: string, data: { 
    weight: number; 
    reps: number; 
    sets: number;
    usesIndividualSets?: boolean;
    individualSets?: Array<{ weight: number; reps: number }>;
  }) => {
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
    if (data.usesIndividualSets && data.individualSets && data.individualSets.length > 0) {
      // Calculate total from individual sets
      const setTotal = data.individualSets.reduce((setSum, set) => {
        return setSum + (set.weight * set.reps);
      }, 0);
      return total + setTotal;
    } else {
      // Use the standard calculation
      return total + (data.weight * data.reps * data.sets);
    }
  }, 0)

  useEffect(() => {
    onMuscleGroupTotalChange(muscleGroupName, muscleGroupTotal)
  }, [muscleGroupTotal, muscleGroupName, onMuscleGroupTotalChange])

  // Show message if no exercises
  if (exercises.length === 0) {
    return (
      <div className="mb-6">
        {/* Muscle group header with left-aligned name and right-aligned total */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white capitalize">{muscleGroupName}</h2>
          <span className="text-lg text-white font-medium">0.0 kg</span>
        </div>
        
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-300 mb-4">
              This muscle group doesn&apos;t contain any exercises yet. Head over to{' '}
              <Link href="/management" className="text-blue-400 hover:text-blue-300 underline">
                Management
              </Link>
              {' '}to add new ones.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mb-6">
      {/* Muscle group header with left-aligned name and right-aligned total */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white capitalize">{muscleGroupName}</h2>
        <span className="text-lg text-white font-medium">{muscleGroupTotal.toFixed(1)} kg</span>
      </div>
      
      {/* Exercise cards directly under the header */}
      <div className="space-y-3">
        {exercises.map((exercise) => (
          <ExerciseInput
            key={exercise.id}
            exerciseId={exercise.id}
            exerciseName={exercise.name}
            description={exercise.description}
            externalLink={exercise.external_link}
            externalLinkName={exercise.external_link_name}
            restTime={exercise.rest_time}
            previousData={exercise.previousData}
            onDataChange={handleExerciseDataChange}
          />
        ))}
      </div>
    </div>
  )
}