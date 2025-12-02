import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { challengesService, CreateChallengeRequest, UpdateChallengeRequest, ChallengeMetricType } from '../../services/challenges.service';
import { ApiError } from '../../lib/api';
import Navbar from '../../components/Layout/Navbar';

const METRIC_TYPES: { value: ChallengeMetricType; label: string }[] = [
  { value: 'TIME', label: 'Time (seconds)' },
  { value: 'REPS', label: 'Reps' },
  { value: 'WEIGHT', label: 'Weight (lbs)' },
  { value: 'DISTANCE', label: 'Distance (miles)' },
  { value: 'CUMULATIVE', label: 'Cumulative' },
];

export default function ChallengeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    metricType: 'REPS' as ChallengeMetricType,
    startAt: new Date().toISOString().split('T')[0],
    endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    targetValue: '',
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      loadChallenge();
    }
  }, [isEdit, id]);

  const loadChallenge = async () => {
    if (!id) return;
    try {
      const challenge = await challengesService.getById(id);
      setFormData({
        title: challenge.title || '',
        description: challenge.description || '',
        metricType: challenge.metricType,
        startAt: challenge.startAt.split('T')[0],
        endAt: challenge.endAt.split('T')[0],
        targetValue: challenge.targetValue?.toString() || '',
        isActive: challenge.isActive,
      });
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load challenge');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEdit && id) {
        const updateData: UpdateChallengeRequest = {
          title: formData.title,
          description: formData.description || undefined,
          metricType: formData.metricType,
          startAt: new Date(formData.startAt).toISOString(),
          endAt: new Date(formData.endAt).toISOString(),
          targetValue: formData.targetValue ? parseFloat(formData.targetValue) : undefined,
          isActive: formData.isActive,
        };
        await challengesService.update(id, updateData);
      } else {
        const createData: CreateChallengeRequest = {
          title: formData.title,
          description: formData.description || undefined,
          metricType: formData.metricType,
          startAt: new Date(formData.startAt).toISOString(),
          endAt: new Date(formData.endAt).toISOString(),
          targetValue: formData.targetValue ? parseFloat(formData.targetValue) : undefined,
          isActive: formData.isActive,
        };
        await challengesService.create(createData);
      }

      navigate('/challenges');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || `Failed to ${isEdit ? 'update' : 'create'} challenge`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar showBackButton={true} backTo="/challenges" backLabel="Back to Challenges" />

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {isEdit ? 'Edit Challenge' : 'Create Challenge'}
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
                Challenge Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., January Push-Up Challenge"
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                placeholder="Describe the challenge, rules, prizes, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metric Type *
              </label>
              <select
                required
                value={formData.metricType}
                onChange={(e) =>
                  setFormData({ ...formData, metricType: e.target.value as ChallengeMetricType })
                }
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {METRIC_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startAt}
                  onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.endAt}
                  onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Value (optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                placeholder="Optional target to reach"
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Optional: Set a target value participants should aim for
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Active Challenge</span>
              </label>
              <p className="mt-1 text-sm text-gray-500">
                Active challenges can accept new entries
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : isEdit ? 'Update Challenge' : 'Create Challenge'}
              </button>
              <Link
                to="/challenges"
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

