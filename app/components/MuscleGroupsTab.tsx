'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
  onWorkoutScheduleChange: (schedule: WorkoutScheduleItem[]) => void
  userId: string
}

export default function MuscleGroupsTab({ 
  muscleGroups, 
  workoutSchedule, 
  onWorkoutScheduleChange,
  userId 
}: MuscleGroupsTabProps) {
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
        name: todayName, 
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

        onWorkoutScheduleChange(
          workoutSchedule.filter(item => item.id !== existingItem.id)
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

        onWorkoutScheduleChange([...workoutSchedule, data])
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

      onWorkoutScheduleChange(
        workoutSchedule.filter(item => item.day_of_week !== dayOfWeek)
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
            <Card key={`${dayOfWeek}-${day.isToday ? 'today' : 'regular'}`} className={day.isToday ? 'border-blue-500' : ''}>
              <CardHeader className="p-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">
                    {day.name}
                  </CardTitle>
                  {day.isToday && (
                    <Badge variant="secondary">Today</Badge>
                  )}
                </div>
                {day.isSecondToday && (
                  <p className="text-sm text-gray-400 mt-1">
                    Today is {dayNames[dayIndexMap.findIndex(dayIndex => dayIndex === currentDayOfWeek)]}, find it at the top of the page
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {/* Muscle group toggles with "No workout this day" button included */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {muscleGroups.map(muscleGroup => (
                    <Button
                      key={muscleGroup.id}
                      onClick={() => handleMuscleGroupToggle(dayOfWeek, muscleGroup.id)}
                      disabled={isLoading}
                      variant={isMuscleGroupScheduled(dayOfWeek, muscleGroup.id) ? "default" : "outline"}
                      className="capitalize"
                    >
                      {muscleGroup.name}
                    </Button>
                  ))}
                  
                  {/* No workout this day button */}
                  <Button
                    onClick={() => handleNoWorkoutDay(dayOfWeek)}
                    disabled={isLoading}
                    variant="destructive"
                    className="col-span-2 md:col-span-1"
                  >
                    Deselect all muscle groups
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}