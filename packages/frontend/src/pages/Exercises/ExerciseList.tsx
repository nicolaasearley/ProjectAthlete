import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { exercisesService, Exercise, ExerciseListResponse } from '../../services/exercises.service';
import { ApiError } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Layout/Navbar';

export default function ExerciseList() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  const isCoachOrAdmin = user?.role === 'COACH' || user?.role === 'ADMIN';

  useEffect(() => {
    loadExercises();
    loadCategories();
  }, [selectedCategory]);

  useEffect(() => {
    // Debounce search
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    const timeout = setTimeout(() => {
      loadExercises();
    }, 500);

    setSearchDebounce(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [search]);

  const loadExercises = async () => {
    setLoading(true);
    setError('');
    try {
      const response: ExerciseListResponse = await exercisesService.getAll({
        page: 1,
        limit: 50,
        category: selectedCategory || undefined,
        search: search || undefined,
      });
      setExercises(response.data);
      setMeta(response.meta);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await exercisesService.getCategories();
      setCategories(cats);
    } catch (err) {
      // Categories are optional
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exercise?')) {
      return;
    }

    try {
      await exercisesService.delete(id);
      loadExercises();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to delete exercise');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar
        rightContent={
          <div className="flex gap-2 md:gap-4">
            {isCoachOrAdmin && (
              <Link
                to="/exercises/new"
                className="px-3 md:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm text-sm md:text-base whitespace-nowrap"
              >
                Add Exercise
              </Link>
            )}
          </div>
        }
      />

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Exercise Library
          </h1>
          <p className="text-gray-600">Browse exercises and add them to your workouts</p>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Exercises
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or description..."
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
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
            <p className="text-gray-600">Loading exercises...</p>
          </div>
        ) : exercises.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 shadow-lg border border-gray-200/50 text-center">
            <div className="text-6xl mb-4">💪</div>
            <h3 className="text-2xl font-bold mb-2">No exercises found</h3>
            <p className="text-gray-600 mb-6">
              {search || selectedCategory
                ? 'Try adjusting your search or filter criteria'
                : 'Start by adding exercises to the library'}
            </p>
            {isCoachOrAdmin && (
              <Link
                to="/exercises/new"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold"
              >
                Add Exercise
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold flex-1">{exercise.name}</h3>
                  {isCoachOrAdmin && (
                    <div className="flex gap-2">
                      <Link
                        to={`/exercises/${exercise.id}/edit`}
                        className="text-blue-600 hover:text-blue-700"
                        title="Edit"
                      >
                        ✏️
                      </Link>
                      <button
                        onClick={() => handleDelete(exercise.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
                {exercise.category && (
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-2">
                    {exercise.category}
                  </span>
                )}
                {exercise.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{exercise.description}</p>
                )}
                <Link
                  to={`/exercises/${exercise.id}`}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                >
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="mt-6 text-center text-gray-600">
            Showing {exercises.length} of {meta.total} exercises
          </div>
        )}
      </div>
    </div>
  );
}

