import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { weightLogsService, ExerciseProgression } from '../../services/weight-logs.service';
import { exercisesService, Exercise } from '../../services/exercises.service';
import { ApiError } from '../../lib/api';
import Navbar from '../../components/Layout/Navbar';

export default function WeightLogAnalytics() {
  const { exerciseId } = useParams();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [progression, setProgression] = useState<ExerciseProgression[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (exerciseId) {
      loadExercise();
      loadProgression();
    }
  }, [exerciseId]);

  const loadExercise = async () => {
    if (!exerciseId) return;
    try {
      const exerciseData = await exercisesService.getById(exerciseId);
      setExercise(exerciseData);
    } catch (err) {
      console.error('Failed to load exercise:', err);
    }
  };

  const loadProgression = async () => {
    if (!exerciseId) return;
    setLoading(true);
    setError('');
    try {
      const data = await weightLogsService.getExerciseProgression(exerciseId);
      setProgression(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load progression data');
    } finally {
      setLoading(false);
    }
  };

  if (!exerciseId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Link to="/weight-logs" className="text-blue-600 hover:text-blue-700">
              ← Back to Weight Logs
            </Link>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-600">
            Exercise ID is required
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading progression data...</p>
        </div>
      </div>
    );
  }

  const maxWeight = Math.max(...progression.map((p) => Number(p.weight)), 0);
  const minWeight = Math.min(...progression.map((p) => Number(p.weight)), 0);
  const range = maxWeight - minWeight || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar showBackButton={true} backTo="/weight-logs" backLabel="Back to Weight Logs" />

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Weight Progression
          </h1>
          {exercise && (
            <p className="text-gray-600 text-lg">{exercise.name}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600">
            {error}
          </div>
        )}

        {progression.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 shadow-lg border border-gray-200/50 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold mb-2">No data yet</h3>
            <p className="text-gray-600 mb-6">Log some weights for this exercise to see your progression</p>
            <Link
              to="/weight-logs/new"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold"
            >
              Log Weight
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {maxWeight.toFixed(1)} lbs
                </div>
                <div className="text-sm text-gray-600">Max Weight</div>
              </div>
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50 text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {minWeight.toFixed(1)} lbs
                </div>
                <div className="text-sm text-gray-600">Min Weight</div>
              </div>
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {progression.length}
                </div>
                <div className="text-sm text-gray-600">Data Points</div>
              </div>
            </div>

            {/* Chart Visualization */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-gray-200/50 mb-6">
              <h2 className="text-2xl font-bold mb-6">Weight Over Time</h2>
              <div className="relative" style={{ height: '400px' }}>
                {/* Chart Container */}
                <div className="absolute inset-0 flex items-end justify-between gap-2">
                  {progression.map((point, index) => {
                    const weight = Number(point.weight);
                    const height = ((weight - minWeight) / range) * 100;
                    const date = new Date(point.date);
                    const isMax = weight === maxWeight;
                    
                    return (
                      <div
                        key={point.id}
                        className="flex-1 flex flex-col items-center group relative"
                        style={{ minWidth: '60px' }}
                      >
                        {/* Bar */}
                        <div
                          className={`w-full rounded-t-lg transition-all hover:opacity-80 ${
                            isMax
                              ? 'bg-gradient-to-t from-green-600 to-green-400'
                              : 'bg-gradient-to-t from-blue-600 to-blue-400'
                          }`}
                          style={{ height: `${height}%`, minHeight: '4px' }}
                          title={`${weight} lbs on ${date.toLocaleDateString()}`}
                        >
                          {/* Weight Label on Hover */}
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            {weight} lbs
                          </div>
                        </div>
                        
                        {/* Date Label */}
                        <div className="mt-2 text-xs text-gray-600 transform -rotate-45 origin-left whitespace-nowrap">
                          {date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-gray-500 pr-2">
                  <span>{maxWeight.toFixed(0)}</span>
                  <span>{((maxWeight + minWeight) / 2).toFixed(0)}</span>
                  <span>{minWeight.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50">
              <h2 className="text-2xl font-bold mb-4">Recent Logs</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Weight</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Sets</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Reps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progression
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((point) => {
                        const date = new Date(point.date);
                        return (
                          <tr key={point.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="py-3 px-4">
                              {date.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold">
                              {point.weight} lbs
                            </td>
                            <td className="py-3 px-4 text-right">
                              {point.sets || '—'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {point.reps || '—'}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

