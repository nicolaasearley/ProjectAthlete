import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { workoutsService, Workout } from '../../services/workouts.service';
import { ApiError } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRoles } from '../../hooks/useRoles';
import Navbar from '../../components/Layout/Navbar';

export default function WorkoutDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isCoach } = useRoles();
  
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (id) {
      loadWorkout();
    }
  }, [id]);

  const loadWorkout = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await workoutsService.getById(id);
      setWorkout(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load workout');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this workout?')) {
      return;
    }

    try {
      await workoutsService.delete(id);
      navigate('/workouts');
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to delete workout');
    }
  };

  const handleCopy = async () => {
    if (!id) return;
    setCopying(true);
    try {
      await workoutsService.copy(id);
      navigate('/workouts');
      alert('Workout copied to your personal workouts!');
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to copy workout');
    } finally {
      setCopying(false);
    }
  };

  const isOwner = workout && user && workout.ownerUserId === user.id;
  // Allow admins/coaches to edit/delete COMMUNITY workouts
  const canEdit = isOwner || (workout?.type === 'COMMUNITY' && (isAdmin || isCoach));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workout...</p>
        </div>
      </div>
    );
  }

  if (error || !workout) {
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
            {error || 'Workout not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar showBackButton={true} backTo="/workouts" backLabel="Back to Workouts" />

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-gray-200/50 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{workout.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    workout.type === 'COMMUNITY'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {workout.type}
                </span>
                {workout.estimatedTimeMinutes && (
                  <span className="text-gray-600">⏱️ {workout.estimatedTimeMinutes} min</span>
                )}
                {workout.owner && (
                  <span className="text-gray-600">by {workout.owner.displayName || workout.owner.email}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/workouts/${workout.id}/execute`}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Start Workout
              </Link>
              {canEdit && (
                <>
                  <Link
                    to={`/workouts/${workout.id}/edit`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
              {!canEdit && workout.type === 'COMMUNITY' && (
                <button
                  onClick={handleCopy}
                  disabled={copying}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {copying ? 'Copying...' : 'Copy to Personal'}
                </button>
              )}
            </div>
          </div>

          {workout.description && (
            <p className="text-gray-600 mb-4">{workout.description}</p>
          )}

          {workout.tags && workout.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {workout.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Exercises */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-gray-200/50 mb-6">
          <h2 className="text-2xl font-bold mb-6">Exercises ({workout.exercises?.length || 0})</h2>
          
          {workout.exercises && workout.exercises.length > 0 ? (
            <div className="space-y-4">
              {workout.exercises.map((exercise, index) => {
                const isGrouped = exercise.groupType && exercise.groupIndex !== undefined;
                const groupType = exercise.groupType;
                const isFirstInGroup = index === 0 || 
                  workout.exercises![index - 1]?.groupIndex !== exercise.groupIndex;
                const isLastInGroup = index === workout.exercises!.length - 1 ||
                  workout.exercises![index + 1]?.groupIndex !== exercise.groupIndex;
                
                return (
                  <div
                    key={exercise.id || index}
                    className={`rounded-lg p-6 border-2 ${
                      isGrouped
                        ? groupType === 'SUPERSET'
                          ? 'bg-purple-50 border-purple-300'
                          : 'bg-orange-50 border-orange-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {isGrouped && isFirstInGroup && (
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${
                        groupType === 'SUPERSET'
                          ? 'bg-purple-600 text-white'
                          : 'bg-orange-600 text-white'
                      }`}>
                        {groupType === 'SUPERSET' ? '⚡ SUPERSET' : '🔄 CIRCUIT'}
                      </div>
                    )}
                    <div className="font-bold text-lg mb-3">
                      {index + 1}. {exercise.name}
                      {isGrouped && !isLastInGroup && (
                        <span className={`ml-2 font-normal ${
                          groupType === 'SUPERSET' ? 'text-purple-600' : 'text-orange-600'
                        }`}>→</span>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      {exercise.sets && (
                        <div>
                          <span className="font-semibold">Sets:</span> {exercise.sets}
                        </div>
                      )}
                      {exercise.reps && (
                        <div>
                          <span className="font-semibold">Reps:</span> {exercise.reps}
                        </div>
                      )}
                      {exercise.weight && (
                        <div>
                          <span className="font-semibold">Weight:</span> {exercise.weight}
                        </div>
                      )}
                      {exercise.tempo && (
                        <div>
                          <span className="font-semibold">Tempo:</span> {exercise.tempo}
                        </div>
                      )}
                      {exercise.rest && (
                        <div>
                          <span className="font-semibold">Rest:</span> {exercise.rest}
                        </div>
                      )}
                    </div>
                    {exercise.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
                        <span className="font-semibold">Notes:</span> {exercise.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No exercises in this workout.</p>
          )}
        </div>

        {/* Notes */}
        {workout.notes && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-gray-200/50">
            <h2 className="text-2xl font-bold mb-4">Notes</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{workout.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

