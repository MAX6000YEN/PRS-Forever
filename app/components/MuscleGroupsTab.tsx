'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MuscleGroup {
  id: string
  name: string
}

interface WorkoutScheduleItem {
  id: string
  day_of_week: number
  muscle_group_id: string
  muscle_groups: {
    id: string
    name: string
  }
}

interface MuscleGroupsTabProps {
  muscleGroups: MuscleGroup[]
  workoutSchedule: WorkoutScheduleItem[]
  userId: string
}

export default function MuscleGroupsTab({ 
  muscleGroups, 
  workoutSchedule: initialSchedule, 
  userId 
}: MuscleGroupsTabProps) {
  const [workoutSchedule, setWorkoutSchedule] = useState(initialSchedule)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  // Week starting Monday, Sunday at the end
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const dayIndexMap = [1, 2, 3, 4, 5, 6, 0] // Map to actual day indices (0 = Sunday, 1 = Monday, etc.)

  // Group schedule by day
  const scheduleByDay = workoutSchedule.reduce((acc, item) => {
    if (!acc[item.day_of_week]) {
      acc[item.day_of_week] = []
    }
    acc[item.day_of_week].push(item)
    return acc
  }, {} as Record<number, WorkoutScheduleItem[]>)

  const handleMuscleGroupToggle = async (dayOfWeek: number, muscleGroupId: string) => {
    setIsLoading(true)
    try {
      const existingItem = workoutSchedule.find(
        item => item.day_of_week === dayOfWeek && item.muscle_group_id === muscleGroupId
      )

      if (existingItem) {
        // Remove from schedule
        const { error } = await supabase
          .from('workout_schedule')
          .delete()
          .eq('id', existingItem.id)

        if (error) throw error

        setWorkoutSchedule(prev => 
          prev.filter(item => item.id !== existingItem.id)
        )
      } else {
        // Add to schedule
        const { data, error } = await supabase
          .from('workout_schedule')
          .insert({
            user_id: userId,
            muscle_group_id: muscleGroupId,
            day_of_week: dayOfWeek
          })
          .select(`
            *,
            muscle_groups (
              id,
              name
            )
          `)
          .single()

        if (error) throw error

        setWorkoutSchedule(prev => [...prev, data])
      }
    } catch (error) {
      console.error('Error updating workout schedule:', error)
      alert('Error updating workout schedule. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNoWorkoutDay = async (dayOfWeek: number) => {
    setIsLoading(true)
    try {
      // Remove all muscle groups for this day
      const { error } = await supabase
        .from('workout_schedule')
        .delete()
        .eq('user_id', userId)
        .eq('day_of_week', dayOfWeek)

      if (error) throw error

      setWorkoutSchedule(prev => 
        prev.filter(item => item.day_of_week !== dayOfWeek)
      )
    } catch (error) {
      console.error('Error clearing workout schedule:', error)
      alert('Error clearing workout schedule. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isMuscleGroupScheduled = (dayOfWeek: number, muscleGroupId: string) => {
    return workoutSchedule.some(
      item => item.day_of_week === dayOfWeek && item.muscle_group_id === muscleGroupId
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Workout Schedule</h2>
      <p className="text-gray-300 mb-6">
        Assign muscle groups to specific days of the week. You can assign multiple muscle groups to the same day.
      </p>

      <div className="space-y-6">
        {dayNames.map((dayName, index) => {
          const dayOfWeek = dayIndexMap[index]
          return (
            <div key={dayOfWeek} className="border border-gray-600 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">{dayName}</h3>
                <button
                  onClick={() => handleNoWorkoutDay(dayOfWeek)}
                  disabled={isLoading}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-500 disabled:opacity-50"
                >
                  No workout this day
                </button>
              </div>
              
              {/* Currently scheduled muscle groups */}
              <div className="mb-4">
                {scheduleByDay[dayOfWeek]?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {scheduleByDay[dayOfWeek].map(item => (
                      <span 
                        key={item.id}
                        className="bg-green-600 text-white px-3 py-1 rounded-full text-sm capitalize"
                      >
                        {item.muscle_groups.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 italic">No muscle groups scheduled</span>
                )}
              </div>

              {/* Muscle group toggles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {muscleGroups.map(muscleGroup => (
                  <button
                    key={muscleGroup.id}
                    onClick={() => handleMuscleGroupToggle(dayOfWeek, muscleGroup.id)}
                    disabled={isLoading}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors capitalize ${
                      isMuscleGroupScheduled(dayOfWeek, muscleGroup.id)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {muscleGroup.name}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}