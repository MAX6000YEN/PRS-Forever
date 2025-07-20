'use client'

import { useState } from 'react'
import MuscleGroupsTab from './MuscleGroupsTab'
import ExercisesTab from './ExercisesTab'

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
  const [activeTab, setActiveTab] = useState<'muscle-groups' | 'exercises'>('muscle-groups')

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex mb-6">
        <button
          onClick={() => setActiveTab('muscle-groups')}
          className={`px-6 py-3 rounded-t-lg font-medium transition-colors ${
            activeTab === 'muscle-groups'
              ? 'bg-black bg-opacity-75 text-white border-b-2 border-white'
              : 'bg-black bg-opacity-50 text-gray-300 hover:text-white'
          }`}
        >
          Muscle Groups
        </button>
        <button
          onClick={() => setActiveTab('exercises')}
          className={`px-6 py-3 rounded-t-lg font-medium transition-colors ml-2 ${
            activeTab === 'exercises'
              ? 'bg-black bg-opacity-75 text-white border-b-2 border-white'
              : 'bg-black bg-opacity-50 text-gray-300 hover:text-white'
          }`}
        >
          Exercises
        </button>
      </div>

      {/* Tab Content */}
      <div className="block-bg rounded-lg p-6">
        {activeTab === 'muscle-groups' && (
          <MuscleGroupsTab 
            muscleGroups={muscleGroups}
            workoutSchedule={workoutSchedule}
            userId={userId}
          />
        )}
        {activeTab === 'exercises' && (
          <ExercisesTab 
            muscleGroups={muscleGroups}
            exercises={exercises}
            userId={userId}
          />
        )}
      </div>
    </div>
  )
}