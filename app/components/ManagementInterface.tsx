'use client'

import { useState } from 'react'
import MuscleGroupsTab from './MuscleGroupsTab'
import ExercisesTab from './ExercisesTab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MuscleGroup {
  id: string
  name: string
}

interface Exercise {
  id: string
  name: string
  muscle_group_id: string
  hidden: boolean
  description?: string
  external_link?: string
  external_link_name?: string
  muscle_groups: {
    id: string
    name: string
  }
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

interface ManagementInterfaceProps {
  muscleGroups: MuscleGroup[]
  exercises: Exercise[]
  workoutSchedule: WorkoutScheduleItem[]
  userId: string
}

export default function ManagementInterface({ 
  muscleGroups, 
  exercises, 
  workoutSchedule, 
  userId 
}: ManagementInterfaceProps) {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="muscle-groups" className="w-full">
          <TabsList className="grid w-full grid-cols-2 glass">
            <TabsTrigger value="muscle-groups">Muscle Groups</TabsTrigger>
            <TabsTrigger value="exercises">Exercises</TabsTrigger>
          </TabsList>
          
          <TabsContent value="muscle-groups" className="mt-6">
            <MuscleGroupsTab 
              muscleGroups={muscleGroups}
              workoutSchedule={workoutSchedule}
              userId={userId}
            />
          </TabsContent>
          
          <TabsContent value="exercises" className="mt-6">
            <ExercisesTab 
              muscleGroups={muscleGroups}
              exercises={exercises}
              userId={userId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}