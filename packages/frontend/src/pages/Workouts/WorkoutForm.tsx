import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { workoutsService, Exercise } from '../../services/workouts.service';
import { ApiError } from '../../lib/api';
import Navbar from '../../components/Layout/Navbar';

export default function WorkoutForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'PERSONAL' as 'PERSONAL' | 'COMMUNITY',
    exercises: [] as Exercise[],
    estimatedTimeMinutes: '',
    tags: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Set<number>>(new Set());
  const [currentExercise, setCurrentExercise] = useState<Partial<Exercise>>({
    name: '',
    sets: '',
    reps: '',
    weight: '',
    tempo: '',
    rest: '',
    notes: '',
  });

  // Load workout if editing
  useEffect(() => {
    if (isEdit && id) {
      loadWorkout();
    }
  }, [isEdit, id]);

  const loadWorkout = async () => {
    if (!id) return;
    try {
      const workout = await workoutsService.getById(id);
      setFormData({
        title: workout.title,
        description: workout.description || '',
        type: workout.type,
        exercises: workout.exercises || [],
        estimatedTimeMinutes: workout.estimatedTimeMinutes?.toString() || '',
        tags: workout.tags?.join(', ') || '',
        notes: workout.notes || '',
      });
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load workout');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const workoutData = {
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        exercises: formData.exercises.map((ex, idx) => {
          const exercise: any = {
            id: ex.id,
            name: ex.name,
            order: ex.order || idx,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            tempo: ex.tempo,
            rest: ex.rest,
            notes: ex.notes,
          };
          
          // Only include grouping properties if they have values
          if (ex.groupType && ex.groupType !== 'NONE') {
            exercise.groupType = ex.groupType;
          }
          if (ex.groupIndex !== undefined) {
            exercise.groupIndex = ex.groupIndex;
          }
          
          return exercise;
        }),
        estimatedTimeMinutes: formData.estimatedTimeMinutes ? parseInt(formData.estimatedTimeMinutes) : undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        notes: formData.notes || undefined,
      };

      if (isEdit && id) {
        await workoutsService.update(id, workoutData);
      } else {
        await workoutsService.create(workoutData);
      }

      navigate('/workouts');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || `Failed to ${isEdit ? 'update' : 'create'} workout`);
    } finally {
      setLoading(false);
    }
  };

  const addExercise = () => {
    if (!currentExercise.name) {
      alert('Please enter an exercise name');
      return;
    }

    const exercise: Exercise = {
      id: `ex-${Date.now()}`,
      name: currentExercise.name!,
      order: formData.exercises.length,
      sets: currentExercise.sets || undefined,
      reps: currentExercise.reps || undefined,
      weight: currentExercise.weight || undefined,
      tempo: currentExercise.tempo || undefined,
      rest: currentExercise.rest || undefined,
      notes: currentExercise.notes || undefined,
    };

    setFormData({
      ...formData,
      exercises: [...formData.exercises, exercise],
    });

    setCurrentExercise({
      name: '',
      sets: '',
      reps: '',
      weight: '',
      tempo: '',
      rest: '',
      notes: '',
    });
  };

  const removeExercise = (index: number) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.filter((_, i) => i !== index),
    });
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newExercises = [...formData.exercises];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newExercises.length) return;

    [newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]];
    
    // Update order
    newExercises.forEach((ex, idx) => {
      ex.order = idx;
    });

    setFormData({ ...formData, exercises: newExercises });
  };

  const toggleExerciseSelection = (index: number) => {
    const newSelected = new Set(selectedExercises);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedExercises(newSelected);
  };

  const groupSelectedExercises = (groupType: 'SUPERSET' | 'CIRCUIT') => {
    if (selectedExercises.size < 2) {
      alert('Please select at least 2 exercises to group');
      return;
    }

    const selectedIndices = Array.from(selectedExercises).sort((a, b) => a - b);
    const newExercises = [...formData.exercises];
    
    // Find the next available group index
    let maxGroupIndex = -1;
    newExercises.forEach(ex => {
      if (ex.groupIndex !== undefined && ex.groupIndex > maxGroupIndex) {
        maxGroupIndex = ex.groupIndex;
      }
    });
    const newGroupIndex = maxGroupIndex + 1;

    // Update selected exercises with group info
    selectedIndices.forEach(idx => {
      newExercises[idx] = {
        ...newExercises[idx],
        groupType,
        groupIndex: newGroupIndex,
      };
    });

    setFormData({ ...formData, exercises: newExercises });
    setSelectedExercises(new Set());
  };

  const ungroupExercises = () => {
    if (selectedExercises.size === 0) {
      alert('Please select exercises to ungroup');
      return;
    }

    const newExercises = [...formData.exercises];
    selectedExercises.forEach(idx => {
      newExercises[idx] = {
        ...newExercises[idx],
        groupType: undefined,
        groupIndex: undefined,
      };
    });

    setFormData({ ...formData, exercises: newExercises });
    setSelectedExercises(new Set());
  };

  const clearSelection = () => {
    setSelectedExercises(new Set());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar showBackButton={true} backTo="/workouts" backLabel="Back to Workouts" />

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {isEdit ? 'Edit Workout' : 'Create Workout'}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-md rounded-2xl p-4 md:p-8 shadow-lg border border-gray-200/50">
          {/* Basic Info */}
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Push Day, Pull Day, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'PERSONAL' | 'COMMUNITY' })}
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PERSONAL">Personal</option>
                <option value="COMMUNITY">Community</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  value={formData.estimatedTimeMinutes}
                  onChange={(e) => setFormData({ ...formData, estimatedTimeMinutes: e.target.value })}
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="push, chest, triceps"
                />
              </div>
            </div>
          </div>

          {/* Exercises */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Exercises *</h3>
              {selectedExercises.size > 0 && (
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-gray-600">
                    {selectedExercises.size} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => groupSelectedExercises('SUPERSET')}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
                  >
                    Group as Superset
                  </button>
                  <button
                    type="button"
                    onClick={() => groupSelectedExercises('CIRCUIT')}
                    className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-semibold"
                  >
                    Group as Circuit
                  </button>
                  <button
                    type="button"
                    onClick={ungroupExercises}
                    className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold"
                  >
                    Ungroup
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
            
            {/* Add Exercise Form */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
              <input
                type="text"
                placeholder="Exercise name *"
                value={currentExercise.name || ''}
                onChange={(e) => setCurrentExercise({ ...currentExercise, name: e.target.value })}
                className="w-full px-4 py-2.5 md:py-2 text-base bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              />
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <input
                  type="text"
                  placeholder="Sets"
                  value={currentExercise.sets || ''}
                  onChange={(e) => setCurrentExercise({ ...currentExercise, sets: e.target.value })}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="text"
                  placeholder="Reps"
                  value={currentExercise.reps || ''}
                  onChange={(e) => setCurrentExercise({ ...currentExercise, reps: e.target.value })}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="text"
                  placeholder="Weight"
                  value={currentExercise.weight || ''}
                  onChange={(e) => setCurrentExercise({ ...currentExercise, weight: e.target.value })}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="text"
                  placeholder="Tempo"
                  value={currentExercise.tempo || ''}
                  onChange={(e) => setCurrentExercise({ ...currentExercise, tempo: e.target.value })}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="text"
                  placeholder="Rest"
                  value={currentExercise.rest || ''}
                  onChange={(e) => setCurrentExercise({ ...currentExercise, rest: e.target.value })}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={addExercise}
                className="w-full px-4 py-3 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all font-semibold touch-manipulation"
              >
                Add Exercise
              </button>
            </div>

            {/* Exercise List */}
            {formData.exercises.length > 0 && (
              <div className="space-y-3">
                {formData.exercises.map((exercise, index) => {
                  const isGrouped = exercise.groupType && exercise.groupIndex !== undefined;
                  const groupType = exercise.groupType;
                  const isFirstInGroup = index === 0 || 
                    formData.exercises[index - 1]?.groupIndex !== exercise.groupIndex;
                  const isLastInGroup = index === formData.exercises.length - 1 ||
                    formData.exercises[index + 1]?.groupIndex !== exercise.groupIndex;
                  
                  return (
                    <div
                      key={exercise.id}
                      className={`rounded-lg p-4 flex items-start gap-4 ${
                        isGrouped
                          ? groupType === 'SUPERSET'
                            ? 'bg-purple-50 border-2 border-purple-300'
                            : 'bg-orange-50 border-2 border-orange-300'
                          : 'bg-gray-50 border border-gray-200'
                      } ${selectedExercises.has(index) ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedExercises.has(index)}
                          onChange={() => toggleExerciseSelection(index)}
                          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        {isGrouped && isFirstInGroup && (
                          <div className={`px-2 py-1 rounded text-xs font-semibold ${
                            groupType === 'SUPERSET'
                              ? 'bg-purple-600 text-white'
                              : 'bg-orange-600 text-white'
                          }`}>
                            {groupType === 'SUPERSET' ? 'SUPERSET' : 'CIRCUIT'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold mb-2">
                          {index + 1}. {exercise.name}
                          {isGrouped && !isLastInGroup && (
                            <span className="ml-2 text-sm font-normal text-gray-500">→</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {exercise.sets && <div>Sets: {exercise.sets}</div>}
                          {exercise.reps && <div>Reps: {exercise.reps}</div>}
                          {exercise.weight && <div>Weight: {exercise.weight}</div>}
                          {exercise.tempo && <div>Tempo: {exercise.tempo}</div>}
                          {exercise.rest && <div>Rest: {exercise.rest}</div>}
                          {exercise.notes && <div>Notes: {exercise.notes}</div>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => moveExercise(index, 'up')}
                          disabled={index === 0}
                          className="px-2 py-1 text-gray-600 hover:text-blue-600 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveExercise(index, 'down')}
                          disabled={index === formData.exercises.length - 1}
                          className="px-2 py-1 text-gray-600 hover:text-blue-600 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExercise(index)}
                          className="px-2 py-1 text-red-600 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes..."
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || formData.exercises.length === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : isEdit ? 'Update Workout' : 'Create Workout'}
            </button>
            <Link
              to="/workouts"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

