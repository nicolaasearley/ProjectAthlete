import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { workoutsService, Workout, WorkoutListResponse } from '../../services/workouts.service';
import { ApiError } from '../../lib/api';
import Navbar from '../../components/Layout/Navbar';

export default function WorkoutList() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'PERSONAL' | 'COMMUNITY'>('all');
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  useEffect(() => {
    loadWorkouts();
  }, [filter, search]);

  const loadWorkouts = async () => {
    setLoading(true);
    setError('');
    try {
      const query: any = {
        page: 1,
        limit: 20,
      };
      
      if (filter !== 'all') {
        query.type = filter;
      }
      
      if (search) {
        query.search = search;
      }

      const response: WorkoutListResponse = await workoutsService.getAll(query);
      setWorkouts(response.data);
      setMeta(response.meta);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) {
      return;
    }

    try {
      await workoutsService.delete(id);
      loadWorkouts();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to delete workout');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar
        rightContent={
          <div className="flex gap-2 md:gap-4">
            <Link
              to="/workouts/new"
              className="px-3 md:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm text-sm md:text-base whitespace-nowrap"
            >
              Create Workout
            </Link>
          </div>
        }
      />

      {/* Content */}
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            My Workouts
          </h1>
          <p className="text-sm md:text-base text-gray-600">Manage your personal and community workouts</p>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200/50 mb-6">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search workouts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2.5 md:py-2 text-base bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2.5 md:py-2 rounded-lg transition-all text-sm md:text-base touch-manipulation ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/50 text-gray-700 hover:bg-white active:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('PERSONAL')}
                className={`px-4 py-2.5 md:py-2 rounded-lg transition-all text-sm md:text-base touch-manipulation ${
                  filter === 'PERSONAL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/50 text-gray-700 hover:bg-white active:bg-gray-100'
                }`}
              >
                Personal
              </button>
              <button
                onClick={() => setFilter('COMMUNITY')}
                className={`px-4 py-2.5 md:py-2 rounded-lg transition-all text-sm md:text-base touch-manipulation ${
                  filter === 'COMMUNITY'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/50 text-gray-700 hover:bg-white active:bg-gray-100'
                }`}
              >
                Community
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading workouts...</p>
          </div>
        ) : workouts.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 shadow-lg border border-gray-200/50 text-center">
            <div className="text-6xl mb-4">💪</div>
            <h3 className="text-2xl font-bold mb-2">No workouts yet</h3>
            <p className="text-gray-600 mb-6">Create your first workout to get started</p>
            <Link
              to="/workouts/new"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold"
            >
              Create Workout
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workouts.map((workout) => (
              <div
                key={workout.id}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{workout.title}</h3>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        workout.type === 'COMMUNITY'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {workout.type}
                    </span>
                  </div>
                  {workout.type === 'PERSONAL' && workout.ownerUserId === workout.ownerUserId && (
                    <div className="flex gap-2">
                      <Link
                        to={`/workouts/${workout.id}/edit`}
                        className="text-blue-600 hover:text-blue-700"
                        title="Edit"
                      >
                        ✏️
                      </Link>
                      <button
                        onClick={() => handleDelete(workout.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>

                {workout.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{workout.description}</p>
                )}

                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    {workout.exercises?.length || 0} exercise{workout.exercises?.length !== 1 ? 's' : ''}
                  </p>
                  {workout.estimatedTimeMinutes && (
                    <p className="text-sm text-gray-500">⏱️ {workout.estimatedTimeMinutes} min</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/workouts/${workout.id}`}
                    className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    View
                  </Link>
                  {workout.type === 'COMMUNITY' && (
                    <button
                      onClick={() => {
                        workoutsService.copy(workout.id).then(() => {
                          loadWorkouts();
                          alert('Workout copied to your personal workouts!');
                        });
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      title="Copy to personal"
                    >
                      📋
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

