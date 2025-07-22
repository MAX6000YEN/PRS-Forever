'use client'

import { useState, useCallback, useEffect } from 'react'
import MuscleGroupSection from './MuscleGroupSection'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Exercise {
  id: string
  name: string
  description?: string
  external_link?: string
  external_link_name?: string
  rest_time: number
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
  const [isWorkoutSaved, setIsWorkoutSaved] = useState(false)
  const [initialExerciseData, setInitialExerciseData] = useState<Record<string, { weight: number; reps: number; sets: number }>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Fetch existing workout data on component mount
  useEffect(() => {
    const fetchExistingWorkout = async () => {
      try {
        const response = await fetch(`/api/workouts/get?date=${currentDate}`)
        const result = await response.json()
        
        if (response.ok && result.exerciseData) {
          // Set the existing exercise data
          setExerciseData(result.exerciseData)
          setInitialExerciseData(JSON.parse(JSON.stringify(result.exerciseData)))
          setIsWorkoutSaved(true)
        }
      } catch (error) {
        console.error('Error fetching existing workout:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchExistingWorkout()
  }, [currentDate])

  const handleMuscleGroupTotalChange = useCallback((muscleGroup: string, total: number) => {
    setMuscleGroupTotals(prev => ({
      ...prev,
      [muscleGroup]: total
    }))
  }, [])

  const handleExerciseDataUpdate = useCallback((exerciseId: string, data: { weight: number; reps: number; sets: number }) => {
    setExerciseData(prev => {
      const newData = {
        ...prev,
        [exerciseId]: data
      }
      
      // Reset saved state when data changes from the initial saved state
      const hasChanged = JSON.stringify(newData) !== JSON.stringify(initialExerciseData)
      if (isWorkoutSaved && hasChanged) {
        setIsWorkoutSaved(false)
      }
      
      return newData
    })
  }, [isWorkoutSaved, initialExerciseData])

  const totalWorkoutWeight = Object.values(muscleGroupTotals).reduce((sum, total) => sum + total, 0)

  // Calculate total number of exercises across all muscle groups
  const totalExercises = workoutData.reduce((total, data) => total + data.exercises.length, 0)
  
  // Check if all exercises have been filled in
  const allExercisesFilled = workoutData.every(data => 
    data.exercises.every(exercise => {
      const exerciseEntry = exerciseData[exercise.id]
      return exerciseEntry && exerciseEntry.weight > 0 && exerciseEntry.reps > 0 && exerciseEntry.sets > 0
    })
  )

  // Check if workout data has changed since last save
  const hasDataChanged = JSON.stringify(exerciseData) !== JSON.stringify(initialExerciseData)

  const saveWorkout = async () => {
    // If trying to save without changes, show notification and return
    if (isWorkoutSaved && !hasDataChanged) {
      toast("Your workout is already saved. You'll be able to save again after making a change.")
      return
    }

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

      toast("Workout saved")
      setIsWorkoutSaved(true)
      // Create a deep copy to avoid reference issues
      setInitialExerciseData(JSON.parse(JSON.stringify(exerciseData)))
    } catch (error) {
      console.error('Error saving workout:', error)
      toast.error(error instanceof Error ? error.message : 'Error saving workout. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      {/* Show loading state while fetching existing workout data */}
      {isLoading ? (
        <div className="text-center text-white">
          <p>Loading workout data...</p>
        </div>
      ) : (
        <>
          {/* Today's muscle groups with badges */}
          {workoutData.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg text-white font-medium">Today&apos;s focus:</span>
                {workoutData.map((data, index) => (
                  <Badge 
                    key={data.muscleGroup} 
                    variant="secondary"
                    className="text-sm capitalize bg-white/20 text-white border-white/30 hover:bg-white/30"
                  >
                    {data.muscleGroup}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Muscle group sections */}
           <div className="space-y-6">
             {workoutData.map((data) => {
               // Merge existing exercise data with workout data
               const exercisesWithData = data.exercises.map(exercise => ({
                 ...exercise,
                 previousData: exerciseData[exercise.id] ? {
                   weight: exerciseData[exercise.id].weight,
                   reps: exerciseData[exercise.id].reps,
                   sets: exerciseData[exercise.id].sets
                 } : exercise.previousData
               }))
               
               return (
                 <MuscleGroupSection
                   key={data.muscleGroup}
                   muscleGroupName={data.muscleGroup}
                   exercises={exercisesWithData}
                   onMuscleGroupTotalChange={handleMuscleGroupTotalChange}
                   onExerciseDataUpdate={handleExerciseDataUpdate}
                 />
               )
             })}
           </div>

          {/* Total workout weight and save button - Show as soon as there are muscle groups scheduled */}
          {workoutData.length > 0 && (
            <div className="mt-8 text-center space-y-4">
              {/* Total Workout text without card */}
              <div className="flex justify-between items-center text-xl font-bold text-white">
                <span>Total Workout</span>
                <span>{totalWorkoutWeight.toFixed(1)} kg</span>
              </div>
              
              {/* Save button */}
              <Button
                onClick={saveWorkout}
                disabled={isSaving || !allExercisesFilled}
                size="lg"
                className="text-lg px-8 py-3"
              >
                {isSaving ? 'Saving...' : 'Save my workout'}
              </Button>

              {/* Validation message */}
              {!allExercisesFilled && (
                <p className="text-xs text-gray-400">
                  You must complete all exercises before saving your workout.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}