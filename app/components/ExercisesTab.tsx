'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Exercises</h2>
        <Button onClick={() => setShowAddForm(true)}>
          Add Exercise
        </Button>
      </div>

      {/* Add Exercise Form */}
      {showAddForm && (
        <Card className="p-2">
          <CardHeader>
            <CardTitle className="text-white">Add New Exercise</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <form onSubmit={handleAddExercise} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exercise-name" className="text-white">Exercise Name</Label>
                <Input
                  id="exercise-name"
                  type="text"
                  value={newExercise.name}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter exercise name"
                  required
                  className="bg-black/20 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="muscle-group" className="text-white">Muscle Group</Label>
                <select
                  id="muscle-group"
                  value={newExercise.muscle_group_id}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, muscle_group_id: e.target.value }))}
                  className="w-full p-3 bg-black/20 border border-white/20 rounded-md text-white"
                  required
                >
                  <option value="">Select muscle group</option>
                  {muscleGroups.map(mg => (
                    <option key={mg.id} value={mg.id} className="capitalize bg-black">
                      {mg.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description (optional, max 300 characters)</Label>
                <textarea
                  id="description"
                  value={newExercise.description}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 bg-black/20 border border-white/20 rounded-md text-white placeholder:text-white/50 resize-none"
                  placeholder="Enter exercise description"
                  maxLength={300}
                  rows={3}
                />
                <div className="text-xs text-gray-400">
                  {newExercise.description.length}/300 characters
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="link-name" className="text-white">External Link Name (optional)</Label>
                <Input
                  id="link-name"
                  type="text"
                  value={newExercise.external_link_name}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, external_link_name: e.target.value }))}
                  placeholder="e.g., 'Tutorial Video', 'Form Guide'"
                  maxLength={100}
                  className="bg-black/20 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="external-link" className="text-white">External Link (optional, max 150 characters)</Label>
                <Input
                  id="external-link"
                  type="url"
                  value={newExercise.external_link}
                  onChange={(e) => setNewExercise(prev => ({ ...prev, external_link: e.target.value }))}
                  placeholder="https://example.com"
                  maxLength={150}
                  className="bg-black/20 border-white/20 text-white placeholder:text-white/50"
                />
                <div className="text-xs text-gray-400">
                  {newExercise.external_link.length}/150 characters
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Exercise'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
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
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Exercises List */}
      <div className="space-y-6">
        {Object.entries(exercisesByMuscleGroup).map(([muscleGroupName, groupExercises]) => (
          <Card key={muscleGroupName} className="p-2">
            <CardHeader>
              <CardTitle className="text-white capitalize">{muscleGroupName}</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-3">
                {groupExercises.map(exercise => (
                  <Card 
                    key={exercise.id} 
                    className={`p-2 transition-opacity ${
                      exercise.hidden ? 'opacity-50' : 'opacity-100'
                    }`}
                  >
                    <CardContent className="p-2">
                      {editingExercise?.id === exercise.id ? (
                        <form onSubmit={handleUpdateExercise} className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-white">Exercise Name</Label>
                            <Input
                              type="text"
                              value={editingExercise.name}
                              onChange={(e) => setEditingExercise(prev => prev ? { ...prev, name: e.target.value } : null)}
                              className="bg-black/20 border-white/20 text-white"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-white">Muscle Group</Label>
                            <select
                              value={editingExercise.muscle_group_id}
                              onChange={(e) => setEditingExercise(prev => prev ? { ...prev, muscle_group_id: e.target.value } : null)}
                              className="w-full p-2 bg-black/20 border border-white/20 rounded-md text-white"
                              required
                            >
                              {muscleGroups.map(mg => (
                                <option key={mg.id} value={mg.id} className="capitalize bg-black">
                                  {mg.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-white">Description (max 300 characters)</Label>
                            <textarea
                              value={editingExercise.description || ''}
                              onChange={(e) => setEditingExercise(prev => prev ? { ...prev, description: e.target.value } : null)}
                              className="w-full p-2 bg-black/20 border border-white/20 rounded-md text-white resize-none"
                              maxLength={300}
                              rows={3}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-white">External Link Name</Label>
                            <Input
                              type="text"
                              value={editingExercise.external_link_name || ''}
                              onChange={(e) => setEditingExercise(prev => prev ? { ...prev, external_link_name: e.target.value } : null)}
                              className="bg-black/20 border-white/20 text-white"
                              maxLength={100}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-white">External Link (max 150 characters)</Label>
                            <Input
                              type="url"
                              value={editingExercise.external_link || ''}
                              onChange={(e) => setEditingExercise(prev => prev ? { ...prev, external_link: e.target.value } : null)}
                              className="bg-black/20 border-white/20 text-white"
                              maxLength={150}
                            />
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button type="submit" disabled={isLoading} size="sm">
                              {isLoading ? 'Saving...' : 'Save'}
                            </Button>
                            <Button 
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingExercise(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${exercise.hidden ? 'text-gray-400' : 'text-white'}`}>
                                {exercise.name}
                              </span>
                              {exercise.hidden && <Badge variant="secondary">Hidden</Badge>}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingExercise(exercise)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant={exercise.hidden ? "default" : "secondary"}
                                onClick={() => handleToggleHidden(exercise.id, exercise.hidden)}
                                disabled={isLoading}
                              >
                                {exercise.hidden ? 'Show' : 'Hide'}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteConfirm(exercise.id)}
                              >
                                Delete
                              </Button>
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4 p-2">
            <CardHeader>
              <CardTitle className="text-white">Confirm Deletion</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this exercise? This will permanently delete all associated data, including statistics.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteExercise(deleteConfirm)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}