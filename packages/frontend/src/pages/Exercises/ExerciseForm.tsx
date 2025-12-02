import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { exercisesService, CreateExerciseRequest, UpdateExerciseRequest } from '../../services/exercises.service';
import { ApiError } from '../../lib/api';
import Navbar from '../../components/Layout/Navbar';

export default function ExerciseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      loadExercise();
    }
  }, [isEdit, id]);

  const loadExercise = async () => {
    if (!id) return;
    try {
      const exercise = await exercisesService.getById(id);
      setFormData({
        name: exercise.name || '',
        description: exercise.description || '',
        category: exercise.category || '',
      });
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load exercise');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEdit && id) {
        const updateData: UpdateExerciseRequest = {
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category || undefined,
        };
        await exercisesService.update(id, updateData);
      } else {
        const createData: CreateExerciseRequest = {
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category || undefined,
        };
        await exercisesService.create(createData);
      }

      navigate('/exercises');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || `Failed to ${isEdit ? 'update' : 'create'} exercise`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar showBackButton={true} backTo="/exercises" backLabel="Back to Exercises" />

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {isEdit ? 'Edit Exercise' : 'Create Exercise'}
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
                Exercise Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Bench Press"
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., STRENGTH, CARDIO, MOBILITY"
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">Optional category for organization</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the exercise, proper form, muscles worked, etc."
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : isEdit ? 'Update Exercise' : 'Create Exercise'}
              </button>
              <Link
                to="/exercises"
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

