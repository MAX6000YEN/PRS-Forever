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

  // Get current day
  const today = new Date()
  const currentDayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  // Week starting Monday, Sunday at the end
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const dayIndexMap = [1, 2, 3, 4, 5, 6, 0] // Map to actual day indices (0 = Sunday, 1 = Monday, etc.)

  // Create ordered days array with today first
  const getOrderedDays = () => {
    const orderedDays: Array<{ name: string; index: number; isToday: boolean; isSecondToday?: boolean }> = []
    
    // Find today's index in our dayNames array
    const todayIndex = dayIndexMap.findIndex(dayIndex => dayIndex === currentDayOfWeek)
    const todayName = dayNames[todayIndex]
    
    // Add today first if it exists in our array
    if (todayIndex !== -1) {
      orderedDays.push({ 
        name: `${todayName} (Today)`, 
        index: dayIndexMap[todayIndex], 
        isToday: true 
      })
    }
    
    // Add all other days in order, marking the second occurrence of today
    dayNames.forEach((dayName, index) => {
      const dayIndex = dayIndexMap[index]
      if (dayIndex !== currentDayOfWeek) {
        orderedDays.push({ 
          name: dayName, 
          index: dayIndex, 
          isToday: false 
        })
      } else {
        // This is the second occurrence of today
        orderedDays.push({ 
          name: dayName, 
          index: dayIndex, 
          isToday: false,
          isSecondToday: true
        })
      }
    })
    
    return orderedDays
  }

  const orderedDays = getOrderedDays()

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
        {orderedDays.map((day) => {
          const dayOfWeek = day.index
          return (
            <div key={`${dayOfWeek}-${day.isToday ? 'today' : 'regular'}`} className={`border rounded-lg p-4 ${
              day.isToday ? 'border-blue-500 bg-blue-900 bg-opacity-20' : 'border-gray-600'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className={`text-xl font-semibold ${day.isToday ? 'text-blue-300' : 'text-white'}`}>
                    {day.name}
                  </h3>
                  {day.isSecondToday && (
                    <p className="text-sm text-gray-400 mt-1">
                      Today is {dayNames[dayIndexMap.findIndex(dayIndex => dayIndex === currentDayOfWeek)]}, find it at the top of the page
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleNoWorkoutDay(dayOfWeek)}
                  disabled={isLoading}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-500 disabled:opacity-50"
                >
                  No workout this day
                </button>
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