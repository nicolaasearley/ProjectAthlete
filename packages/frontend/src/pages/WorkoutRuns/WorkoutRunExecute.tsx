import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { workoutRunsService, WorkoutRun } from '../../services/workout-runs.service';
import { workoutsService, Workout, Exercise } from '../../services/workouts.service';
import { ApiError } from '../../lib/api';
import Navbar from '../../components/Layout/Navbar';

export default function WorkoutRunExecute() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [workoutRun, setWorkoutRun] = useState<WorkoutRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exerciseResults, setExerciseResults] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [startTime] = useState(new Date());

  useEffect(() => {
    if (workoutId) {
      loadWorkout();
    }
  }, [workoutId]);

  const loadWorkout = async () => {
    if (!workoutId) return;
    setLoading(true);
    setError('');
    try {
      const workoutData = await workoutsService.getById(workoutId);
      setWorkout(workoutData);

      // Initialize exercise results
      const initialResults: Record<string, any> = {};
      if (workoutData.exercises) {
        workoutData.exercises.forEach((ex: Exercise) => {
          initialResults[ex.id] = {
            sets: ex.sets || '',
            reps: ex.reps || '',
            weight: ex.weight || '',
            completed: false,
          };
        });
      }
      setExerciseResults(initialResults);

      // Create workout run
      const run = await workoutRunsService.create({
        workoutId,
        date: new Date().toISOString().split('T')[0],
      });
      setWorkoutRun(run);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to start workout');
    } finally {
      setLoading(false);
    }
  };

  const updateExerciseResult = (exerciseId: string, field: string, value: any) => {
    setExerciseResults({
      ...exerciseResults,
      [exerciseId]: {
        ...exerciseResults[exerciseId],
        [field]: value,
      },
    });
  };

  const toggleExerciseCompleted = (exerciseId: string) => {
    updateExerciseResult(exerciseId, 'completed', !exerciseResults[exerciseId]?.completed);
  };

  const handleComplete = async () => {
    if (!workoutRun) return;

    setIsCompleting(true);
    try {
      await workoutRunsService.complete(workoutRun.id, exerciseResults, notes);
      navigate(`/workout-runs/${workoutRun.id}`);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to complete workout');
    } finally {
      setIsCompleting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getElapsedTime = () => {
    const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    return formatTime(elapsed);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render for timer
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Starting workout...</p>
        </div>
      </div>
    );
  }

  if (error && !workout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Link to="/workouts" className="text-blue-600 hover:text-blue-700">
              ← Back to Workouts
            </Link>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-600">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!workout || !workoutRun) {
    return null;
  }

  const exercises = (workout.exercises || []) as Exercise[];
  const completedCount = Object.values(exerciseResults).filter((r: any) => r.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar
        rightContent={
          <div className="flex items-center gap-2 md:gap-4">
            <div className="text-sm md:text-lg font-semibold text-gray-700 whitespace-nowrap">
              ⏱️ {getElapsedTime()}
            </div>
            <Link to="/workouts" className="px-3 md:px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors text-sm md:text-base">
              Cancel
            </Link>
          </div>
        }
      />

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-gray-200/50 mb-6">
          <h1 className="text-4xl font-bold mb-2">{workout.title}</h1>
          {workout.description && (
            <p className="text-gray-600 mb-4">{workout.description}</p>
          )}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {completedCount} / {exercises.length} exercises completed
            </span>
            {workout.estimatedTimeMinutes && (
              <span className="text-sm text-gray-500">
                Estimated: {workout.estimatedTimeMinutes} min
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600">
            {error}
          </div>
        )}

        {/* Exercises */}
        <div className="space-y-4 mb-6">
          {exercises.map((exercise, index) => {
            const result = exerciseResults[exercise.id] || {};
            return (
              <div
                key={exercise.id || index}
                className={`bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border-2 transition-all ${
                  result.completed
                    ? 'border-green-300 bg-green-50/50'
                    : 'border-gray-200/50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-gray-400">
                        {index + 1}
                      </span>
                      <h3 className="text-2xl font-bold">{exercise.name}</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm text-gray-600 ml-10">
                      {exercise.sets && <div>Sets: {exercise.sets}</div>}
                      {exercise.reps && <div>Reps: {exercise.reps}</div>}
                      {exercise.weight && <div>Weight: {exercise.weight}</div>}
                      {exercise.tempo && <div>Tempo: {exercise.tempo}</div>}
                      {exercise.rest && <div>Rest: {exercise.rest}</div>}
                    </div>
                    {exercise.notes && (
                      <p className="text-sm text-gray-500 mt-2 ml-10">{exercise.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleExerciseCompleted(exercise.id || index.toString())}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      result.completed
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {result.completed ? '✓ Done' : 'Mark Done'}
                  </button>
                </div>

                {/* Log Results */}
                <div className="ml-10 grid grid-cols-3 gap-3 mt-4">
                  <input
                    type="text"
                    placeholder="Sets"
                    value={result.sets || ''}
                    onChange={(e) =>
                      updateExerciseResult(exercise.id || index.toString(), 'sets', e.target.value)
                    }
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Reps"
                    value={result.reps || ''}
                    onChange={(e) =>
                      updateExerciseResult(exercise.id || index.toString(), 'reps', e.target.value)
                    }
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Weight (lbs)"
                    value={result.weight || ''}
                    onChange={(e) =>
                      updateExerciseResult(exercise.id || index.toString(), 'weight', e.target.value)
                    }
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Notes */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Workout Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="How did the workout feel? Any notes..."
          />
        </div>

        {/* Complete Button */}
        <div className="flex gap-4">
          <button
            onClick={handleComplete}
            disabled={isCompleting || completedCount === 0}
            className="flex-1 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCompleting ? 'Completing...' : `Complete Workout (${getElapsedTime()})`}
          </button>
        </div>
      </div>
    </div>
  );
}

