import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { exercisesService, Exercise } from '../../services/exercises.service';
import { ApiError } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Layout/Navbar';

export default function ExerciseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isCoachOrAdmin = user?.role === 'COACH' || user?.role === 'ADMIN';

  useEffect(() => {
    if (id) {
      loadExercise();
    }
  }, [id]);

  const loadExercise = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const exerciseData = await exercisesService.getById(id);
      setExercise(exerciseData);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load exercise');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exercise...</p>
        </div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar showBackButton={true} backTo="/exercises" backLabel="Back to Exercises" />
        <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-600">
            {error || 'Exercise not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar showBackButton={true} backTo="/exercises" backLabel="Back to Exercises" />

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-gray-200/50">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{exercise.name}</h1>
              {exercise.category && (
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {exercise.category}
                </span>
              )}
            </div>
            {isCoachOrAdmin && (
              <Link
                to={`/exercises/${exercise.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit
              </Link>
            )}
          </div>

          {exercise.description && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{exercise.description}</p>
            </div>
          )}

          {exercise.defaultMetrics && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Default Metrics</h2>
              <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                {JSON.stringify(exercise.defaultMetrics, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200 flex gap-4">
            <Link
              to={`/weight-logs/new?exerciseId=${exercise.id}`}
              className="inline-block px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-semibold"
            >
              Log Weight
            </Link>
            <Link
              to={`/weight-logs/analytics/${exercise.id}`}
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold"
            >
              View Progression Chart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

