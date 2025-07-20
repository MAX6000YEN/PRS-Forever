'use client'

import { useState, useCallback } from 'react'
import MuscleGroupSection from './MuscleGroupSection'
import Toast from './Toast'

interface Exercise {
  id: string
  name: string
  description?: string
  external_link?: string
  external_link_name?: string
  previousData?: {
    weight: number
    reps: number
    sets: number
  }
}

interface WorkoutData {
  muscleGroup: string
  exercises: Exercise[]
}

interface WorkoutInterfaceProps {
  workoutData: WorkoutData[]
  userId: string
  currentDate: string
}

export default function WorkoutInterface({ workoutData, userId, currentDate }: WorkoutInterfaceProps) {
  const [muscleGroupTotals, setMuscleGroupTotals] = useState<Record<string, number>>({})
  const [exerciseData, setExerciseData] = useState<Record<string, { weight: number; reps: number; sets: number }>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const handleMuscleGroupTotalChange = useCallback((muscleGroup: string, total: number) => {
    setMuscleGroupTotals(prev => ({
      ...prev,
      [muscleGroup]: total
    }))
  }, [])

  const handleExerciseDataUpdate = useCallback((exerciseId: string, data: { weight: number; reps: number; sets: number }) => {
    setExerciseData(prev => ({
      ...prev,
      [exerciseId]: data
    }))
  }, [])

  const totalWorkoutWeight = Object.values(muscleGroupTotals).reduce((sum, total) => sum + total, 0)

  const muscleGroupsText = workoutData.map(data => data.muscleGroup).join(' and ')

  // Calculate total number of exercises across all muscle groups
  const totalExercises = workoutData.reduce((total, data) => total + data.exercises.length, 0)
  
  // Check if all exercises have been filled in
  const allExercisesFilled = Object.keys(exerciseData).length === totalExercises && 
    Object.values(exerciseData).every(data => data.weight > 0 && data.reps > 0 && data.sets > 0)

  const saveWorkout = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/workouts/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseData,
          currentDate
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save workout')
      }

      setToast({ message: result.message, type: 'success' })
    } catch (error) {
      console.error('Error saving workout:', error)
      setToast({ 
        message: error instanceof Error ? error.message : 'Error saving workout. Please try again.', 
        type: 'error' 
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Today's muscle groups */}
      {workoutData.length > 0 && (
        <div className="mb-6">
          <p className="text-lg text-gray-300">
            <span className="text-white font-medium">Today&apos;s focus: </span>
            {muscleGroupsText}
          </p>
        </div>
      )}

      {/* Muscle group sections */}
      <div className="space-y-6">
        {workoutData.map((data) => (
          <MuscleGroupSection
            key={data.muscleGroup}
            muscleGroupName={data.muscleGroup}
            exercises={data.exercises}
            onMuscleGroupTotalChange={handleMuscleGroupTotalChange}
            onExerciseDataUpdate={handleExerciseDataUpdate}
          />
        ))}
      </div>

      {/* Total workout weight - Show as soon as there are muscle groups scheduled */}
      {workoutData.length > 0 && (
        <div className="block-bg rounded-lg p-6 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Total Workout</h2>
            <span className="text-2xl font-bold text-white">{totalWorkoutWeight.toFixed(1)} kg</span>
          </div>
        </div>
      )}

      {/* Save button - Show as soon as there are muscle groups scheduled, but disable until all fields are filled */}
      {workoutData.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={saveWorkout}
            disabled={isSaving || !allExercisesFilled}
            className={`text-lg px-8 py-3 rounded-lg font-medium transition-colors ${
              allExercisesFilled && !isSaving
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : 'My workout is over!'}
          </button>
        </div>
      )}
    </div>
  )
}