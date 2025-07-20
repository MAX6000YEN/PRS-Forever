'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

interface ExercisesTabProps {
  muscleGroups: MuscleGroup[]
  exercises: Exercise[]
  userId: string
}

export default function ExercisesTab({ 
  muscleGroups, 
  exercises: initialExercises, 
  userId 
}: ExercisesTabProps) {
  const [exercises, setExercises] = useState(initialExercises)
  const [isLoading, setIsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newExercise, setNewExercise] = useState({
    name: '',
    muscle_group_id: '',
    description: '',
    external_link: '',
    external_link_name: ''
  })
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const supabase = createClient()

  // Group exercises by muscle group
  const exercisesByMuscleGroup = exercises.reduce((acc, exercise) => {
    const muscleGroupName = exercise.muscle_groups.name
    if (!acc[muscleGroupName]) {
      acc[muscleGroupName] = []
    }
    acc[muscleGroupName].push(exercise)
    return acc
  }, {} as Record<string, Exercise[]>)

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExercise.name.trim() || !newExercise.muscle_group_id) return

    setIsLoading(true)
    try {
      // Check for duplicates
      const isDuplicate = exercises.some(
        ex => ex.name.toLowerCase() === newExercise.name.toLowerCase().trim()
      )

      if (isDuplicate) {
        alert('An exercise with this name already exists.')
        return
      }

      const { data, error } = await supabase
        .from('exercises')
        .insert({
          name: newExercise.name.trim(),
          muscle_group_id: newExercise.muscle_group_id,
          user_id: userId,
          hidden: false,
          description: newExercise.description.trim() || null,
          external_link: newExercise.external_link.trim() || null,
          external_link_name: newExercise.external_link_name.trim() || null
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

      setExercises(prev => [...prev, data])
      setNewExercise({ 
        name: '', 
        muscle_group_id: '', 
        description: '', 
        external_link: '', 
        external_link_name: '' 
      })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding exercise:', error)
      alert('Error adding exercise. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateExercise = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExercise) return

    setIsLoading(true)
    try {
      // Check for duplicates (excluding current exercise)
      const isDuplicate = exercises.some(
        ex => ex.id !== editingExercise.id && 
        ex.name.toLowerCase() === editingExercise.name.toLowerCase().trim()
      )

      if (isDuplicate) {
        alert('An exercise with this name already exists.')
        return
      }

      const { data, error } = await supabase
        .from('exercises')
        .update({
          name: editingExercise.name.trim(),
          muscle_group_id: editingExercise.muscle_group_id,
          description: editingExercise.description?.trim() || null,
          external_link: editingExercise.external_link?.trim() || null,
          external_link_name: editingExercise.external_link_name?.trim() || null
        })
        .eq('id', editingExercise.id)
        .select(`
          *,
          muscle_groups (
            id,
            name
          )
        `)
        .single()

      if (error) throw error

      setExercises(prev => 
        prev.map(ex => ex.id === editingExercise.id ? data : ex)
      )
      setEditingExercise(null)
    } catch (error) {
      console.error('Error updating exercise:', error)
      alert('Error updating exercise. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleHidden = async (exerciseId: string, currentHidden: boolean) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('exercises')
        .update({ hidden: !currentHidden })
        .eq('id', exerciseId)
        .select(`
          *,
          muscle_groups (
            id,
            name
          )
        `)
        .single()

      if (error) throw error

      setExercises(prev => 
        prev.map(ex => ex.id === exerciseId ? data : ex)
      )
    } catch (error) {
      console.error('Error toggling exercise visibility:', error)
      alert('Error updating exercise visibility. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteExercise = async (exerciseId: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseId)

      if (error) throw error

      setExercises(prev => prev.filter(ex => ex.id !== exerciseId))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting exercise:', error)
      alert('Error deleting exercise. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Exercises</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          Add Exercise
        </button>
      </div>

      {/* Add Exercise Form */}
      {showAddForm && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">Add New Exercise</h3>
          <form onSubmit={handleAddExercise} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Exercise Name</label>
              <input
                type="text"
                value={newExercise.name}
                onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 bg-black bg-opacity-75 text-white rounded-lg border border-gray-600 focus:border-white"
                placeholder="Enter exercise name"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Muscle Group</label>
              <select
                value={newExercise.muscle_group_id}
                onChange={(e) => setNewExercise(prev => ({ ...prev, muscle_group_id: e.target.value }))}
                className="w-full p-3 bg-black bg-opacity-75 text-white rounded-lg border border-gray-600 focus:border-white"
                required
              >
                <option value="">Select muscle group</option>
                {muscleGroups.map(mg => (
                  <option key={mg.id} value={mg.id} className="capitalize">
                    {mg.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Description (optional, max 300 characters)</label>
              <textarea
                value={newExercise.description}
                onChange={(e) => setNewExercise(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 bg-black bg-opacity-75 text-white rounded-lg border border-gray-600 focus:border-white resize-none"
                placeholder="Enter exercise description"
                maxLength={300}
                rows={3}
              />
              <div className="text-xs text-gray-400 mt-1">
                {newExercise.description.length}/300 characters
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">External Link Name (optional)</label>
              <input
                type="text"
                value={newExercise.external_link_name}
                onChange={(e) => setNewExercise(prev => ({ ...prev, external_link_name: e.target.value }))}
                className="w-full p-3 bg-black bg-opacity-75 text-white rounded-lg border border-gray-600 focus:border-white"
                placeholder="e.g., 'Tutorial Video', 'Form Guide'"
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">External Link (optional, max 150 characters)</label>
              <input
                type="url"
                value={newExercise.external_link}
                onChange={(e) => setNewExercise(prev => ({ ...prev, external_link: e.target.value }))}
                className="w-full p-3 bg-black bg-opacity-75 text-white rounded-lg border border-gray-600 focus:border-white"
                placeholder="https://example.com"
                maxLength={150}
              />
              <div className="text-xs text-gray-400 mt-1">
                {newExercise.external_link.length}/150 characters
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? 'Adding...' : 'Add Exercise'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setNewExercise({ 
                    name: '', 
                    muscle_group_id: '', 
                    description: '', 
                    external_link: '', 
                    external_link_name: '' 
                  })
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Exercises List */}
      <div className="space-y-6">
        {Object.entries(exercisesByMuscleGroup).map(([muscleGroupName, groupExercises]) => (
          <div key={muscleGroupName} className="border border-gray-600 rounded-lg p-4">
            <h3 className="text-xl font-semibold text-white mb-4 capitalize">{muscleGroupName}</h3>
            <div className="space-y-3">
              {groupExercises.map(exercise => (
                <div 
                  key={exercise.id} 
                  className={`bg-gray-800 rounded-lg p-3 transition-opacity ${
                    exercise.hidden ? 'opacity-50' : 'opacity-100'
                  }`}
                >
                  {editingExercise?.id === exercise.id ? (
                    <form onSubmit={handleUpdateExercise} className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">Exercise Name</label>
                        <input
                          type="text"
                          value={editingExercise.name}
                          onChange={(e) => setEditingExercise(prev => prev ? { ...prev, name: e.target.value } : null)}
                          className="w-full p-2 bg-black bg-opacity-75 text-white rounded border border-gray-600 focus:border-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">Muscle Group</label>
                        <select
                          value={editingExercise.muscle_group_id}
                          onChange={(e) => setEditingExercise(prev => prev ? { ...prev, muscle_group_id: e.target.value } : null)}
                          className="w-full p-2 bg-black bg-opacity-75 text-white rounded border border-gray-600 focus:border-white"
                          required
                        >
                          {muscleGroups.map(mg => (
                            <option key={mg.id} value={mg.id} className="capitalize">
                              {mg.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">Description (max 300 characters)</label>
                        <textarea
                          value={editingExercise.description || ''}
                          onChange={(e) => setEditingExercise(prev => prev ? { ...prev, description: e.target.value } : null)}
                          className="w-full p-2 bg-black bg-opacity-75 text-white rounded border border-gray-600 focus:border-white resize-none"
                          maxLength={300}
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">External Link Name</label>
                        <input
                          type="text"
                          value={editingExercise.external_link_name || ''}
                          onChange={(e) => setEditingExercise(prev => prev ? { ...prev, external_link_name: e.target.value } : null)}
                          className="w-full p-2 bg-black bg-opacity-75 text-white rounded border border-gray-600 focus:border-white"
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-1">External Link (max 150 characters)</label>
                        <input
                          type="url"
                          value={editingExercise.external_link || ''}
                          onChange={(e) => setEditingExercise(prev => prev ? { ...prev, external_link: e.target.value } : null)}
                          className="w-full p-2 bg-black bg-opacity-75 text-white rounded border border-gray-600 focus:border-white"
                          maxLength={150}
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button 
                          type="submit" 
                          disabled={isLoading}
                          className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-500 disabled:opacity-50"
                        >
                          {isLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button 
                          type="button"
                          onClick={() => setEditingExercise(null)}
                          className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <span className={`font-medium ${exercise.hidden ? 'text-gray-400' : 'text-white'}`}>
                          {exercise.name}
                          {exercise.hidden && <span className="text-xs text-gray-500 ml-2">(Hidden)</span>}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingExercise(exercise)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-500"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleHidden(exercise.id, exercise.hidden)}
                            disabled={isLoading}
                            className={`px-3 py-1 rounded text-sm transition-colors disabled:opacity-50 ${
                              exercise.hidden 
                                ? 'bg-green-600 hover:bg-green-500 text-white' 
                                : 'bg-yellow-600 hover:bg-yellow-500 text-white'
                            }`}
                          >
                            {exercise.hidden ? 'Show' : 'Hide'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(exercise.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {exercise.description && (
                        <p className="text-sm text-gray-300 mt-2">
                          {exercise.description}
                        </p>
                      )}
                      {exercise.external_link && exercise.external_link_name && (
                        <a
                          href={exercise.external_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300 underline inline-block mt-1"
                        >
                          {exercise.external_link_name}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Confirm Deletion</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this exercise? This will permanently delete all associated data, including statistics.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleDeleteExercise(deleteConfirm)}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}