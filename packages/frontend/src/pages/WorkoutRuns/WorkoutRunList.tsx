import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { workoutRunsService, WorkoutRun, WorkoutRunListResponse } from '../../services/workout-runs.service';
import { ApiError } from '../../lib/api';
import Navbar from '../../components/Layout/Navbar';

export default function WorkoutRunList() {
  const [workoutRuns, setWorkoutRuns] = useState<WorkoutRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    loadWorkoutRuns();
  }, []);

  const loadWorkoutRuns = async () => {
    setLoading(true);
    setError('');
    try {
      const response: WorkoutRunListResponse = await workoutRunsService.getAll({
        page: 1,
        limit: 20,
      });
      setWorkoutRuns(response.data);
      setMeta(response.meta);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load workout runs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workout run?')) {
      return;
    }

    try {
      await workoutRunsService.delete(id);
      loadWorkoutRuns();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to delete workout run');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Workout History
          </h1>
          <p className="text-gray-600">View your completed and in-progress workouts</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading workout history...</p>
          </div>
        ) : workoutRuns.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 shadow-lg border border-gray-200/50 text-center">
            <div className="text-6xl mb-4">🏋️</div>
            <h3 className="text-2xl font-bold mb-2">No workout history yet</h3>
            <p className="text-gray-600 mb-6">Start a workout to begin tracking your progress</p>
            <Link
              to="/workouts"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold"
            >
              Browse Workouts
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {workoutRuns.map((run) => (
              <div
                key={run.id}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        to={run.workout ? `/workouts/${run.workout.id}` : '#'}
                        className="text-2xl font-bold hover:text-blue-600 transition-colors"
                      >
                        {run.workout?.title || 'Unknown Workout'}
                      </Link>
                      {!run.completedAt && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                          In Progress
                        </span>
                      )}
                      {run.completedAt && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          Completed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{formatDate(run.date)}</span>
                      {run.totalTimeSeconds && (
                        <span>⏱️ {formatTime(run.totalTimeSeconds)}</span>
                      )}
                      {run.startedAt && (
                        <span>
                          Started: {new Date(run.startedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    {run.notes && (
                      <p className="text-gray-600 mt-2 text-sm">{run.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {run.completedAt ? (
                      <>
                        <Link
                          to={`/workout-runs/${run.id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(run.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <Link
                        to={`/workout-runs/${run.id}/execute`}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Continue
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

