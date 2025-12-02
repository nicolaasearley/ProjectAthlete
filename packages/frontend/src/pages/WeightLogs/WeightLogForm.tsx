import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { weightLogsService, CreateWeightLogRequest, UpdateWeightLogRequest } from '../../services/weight-logs.service';
import { exercisesService, Exercise } from '../../services/exercises.service';
import { ApiError } from '../../lib/api';
import Navbar from '../../components/Layout/Navbar';

export default function WeightLogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    exerciseId: searchParams.get('exerciseId') || '',
    workoutRunId: '',
    weight: '',
    reps: '',
    sets: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseOptions, setExerciseOptions] = useState<Exercise[]>([]);
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      loadWeightLog();
    }
    if (formData.exerciseId && !selectedExercise) {
      loadExercise(formData.exerciseId);
    }
  }, [isEdit, id, formData.exerciseId]);

  useEffect(() => {
    if (exerciseSearch.length > 2) {
      const timeout = setTimeout(() => {
        searchExercises();
      }, 300);
      return () => clearTimeout(timeout);
    } else {
      setExerciseOptions([]);
    }
  }, [exerciseSearch]);

  const loadExercise = async (exerciseId: string) => {
    try {
      const exercise = await exercisesService.getById(exerciseId);
      setSelectedExercise(exercise);
    } catch (err) {
      console.error('Failed to load exercise:', err);
    }
  };

  const searchExercises = async () => {
    try {
      const response = await exercisesService.getAll({
        search: exerciseSearch,
        limit: 10,
      });
      setExerciseOptions(response.data);
    } catch (err) {
      console.error('Failed to search exercises:', err);
    }
  };

  const selectExercise = (exercise: Exercise) => {
    setFormData({ ...formData, exerciseId: exercise.id });
    setSelectedExercise(exercise);
    setShowExerciseSearch(false);
    setExerciseSearch('');
    setExerciseOptions([]);
  };

  const loadWeightLog = async () => {
    if (!id) return;
    try {
      const log = await weightLogsService.getById(id);
      setFormData({
        exerciseId: log.exerciseId || '',
        workoutRunId: log.workoutRunId || '',
        weight: log.weight?.toString() || '',
        reps: log.reps?.toString() || '',
        sets: log.sets?.toString() || '',
        date: log.date.split('T')[0],
        notes: log.notes || '',
      });
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load weight log');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEdit && id) {
        const updateData: UpdateWeightLogRequest = {
          exerciseId: formData.exerciseId || undefined,
          workoutRunId: formData.workoutRunId || undefined,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          reps: formData.reps ? parseInt(formData.reps) : undefined,
          sets: formData.sets ? parseInt(formData.sets) : undefined,
          date: formData.date,
          notes: formData.notes || undefined,
        };
        await weightLogsService.update(id, updateData);
      } else {
        const createData: CreateWeightLogRequest = {
          exerciseId: formData.exerciseId || undefined,
          workoutRunId: formData.workoutRunId || undefined,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          reps: formData.reps ? parseInt(formData.reps) : undefined,
          sets: formData.sets ? parseInt(formData.sets) : undefined,
          date: formData.date,
          notes: formData.notes || undefined,
        };
        await weightLogsService.create(createData);
      }

      navigate('/weight-logs');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || `Failed to ${isEdit ? 'update' : 'create'} weight log`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar showBackButton={true} backTo="/weight-logs" backLabel="Back to Weight Logs" />

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {isEdit ? 'Edit Weight Log' : 'Log Weight'}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-gray-200/50">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exercise (optional)
              </label>
              {selectedExercise ? (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="flex-1 font-medium">{selectedExercise.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExercise(null);
                      setFormData({ ...formData, exerciseId: '' });
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={exerciseSearch}
                    onChange={(e) => {
                      setExerciseSearch(e.target.value);
                      setShowExerciseSearch(true);
                    }}
                    onFocus={() => setShowExerciseSearch(true)}
                    placeholder="Search for an exercise..."
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {showExerciseSearch && exerciseOptions.length > 0 && (
                    <>
                      <div
                        className="fixed inset-0 z-0"
                        onClick={() => setShowExerciseSearch(false)}
                      />
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {exerciseOptions.map((exercise) => (
                          <button
                            key={exercise.id}
                            type="button"
                            onClick={() => selectExercise(exercise)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium">{exercise.name}</div>
                            {exercise.category && (
                              <div className="text-sm text-gray-500">{exercise.category}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    <Link to="/exercises" className="text-blue-600 hover:text-blue-700">
                      Browse exercise library
                    </Link>
                  </p>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sets
                </label>
                <input
                  type="number"
                  value={formData.sets}
                  onChange={(e) => setFormData({ ...formData, sets: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reps
                </label>
                <input
                  type="number"
                  value={formData.reps}
                  onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
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

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : isEdit ? 'Update Log' : 'Save Log'}
              </button>
              <Link
                to="/weight-logs"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

