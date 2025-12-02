import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { weightLogsService, WeightLog, WeightLogListResponse } from '../../services/weight-logs.service';
import { ApiError } from '../../lib/api';
import Navbar from '../../components/Layout/Navbar';

export default function WeightLogList() {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

  useEffect(() => {
    loadWeightLogs();
  }, []);

  const loadWeightLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const response: WeightLogListResponse = await weightLogsService.getAll({
        page: 1,
        limit: 50,
      });
      setWeightLogs(response.data);
      setMeta(response.meta);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load weight logs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this weight log?')) {
      return;
    }

    try {
      await weightLogsService.delete(id);
      loadWeightLogs();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to delete weight log');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar
        rightContent={
          <Link
            to="/weight-logs/new"
            className="px-3 md:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm text-sm md:text-base whitespace-nowrap"
          >
            Log Weight
          </Link>
        }
      />

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Weight Logs
          </h1>
          <p className="text-gray-600">Track your strength progress over time</p>
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
            <p className="text-gray-600">Loading weight logs...</p>
          </div>
        ) : weightLogs.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 shadow-lg border border-gray-200/50 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold mb-2">No weight logs yet</h3>
            <p className="text-gray-600 mb-6">Start logging your weights to track your progress</p>
            <Link
              to="/weight-logs/new"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold"
            >
              Log Weight
            </Link>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-gray-200/50">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Exercise</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Weight</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Sets</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Reps</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Workout</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {weightLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="py-3 px-4">{formatDate(log.date)}</td>
                      <td className="py-3 px-4">
                        {log.exercise ? (
                          <Link
                            to={`/weight-logs/analytics/${log.exercise.id}`}
                            className="font-medium text-blue-600 hover:text-blue-700"
                          >
                            {log.exercise.name} 📊
                          </Link>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {log.weight ? (
                          <span className="font-semibold">{log.weight} lbs</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {log.sets ?? <span className="text-gray-400">—</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {log.reps ?? <span className="text-gray-400">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        {log.workoutRun ? (
                          <Link
                            to={`/workouts/${log.workoutRun.workout.id}`}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {log.workoutRun.workout.title}
                          </Link>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/weight-logs/${log.id}/edit`}
                            className="text-blue-600 hover:text-blue-700"
                            title="Edit"
                          >
                            ✏️
                          </Link>
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta.totalPages > 1 && (
              <div className="mt-6 text-center text-gray-600">
                Showing {weightLogs.length} of {meta.total} entries
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

