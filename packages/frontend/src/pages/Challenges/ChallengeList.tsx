import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { challengesService, Challenge } from '../../services/challenges.service';
import { ApiError } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Layout/Navbar';

export default function ChallengeList() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const isCoachOrAdmin = user?.role === 'COACH' || user?.role === 'ADMIN';

  useEffect(() => {
    loadChallenges();
  }, [showActiveOnly]);

  const loadChallenges = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await challengesService.getAll({
        isActive: showActiveOnly ? true : undefined,
      });
      setChallenges(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this challenge?')) {
      return;
    }

    try {
      await challengesService.delete(id);
      loadChallenges();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to delete challenge');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMetricTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      TIME: 'Time',
      REPS: 'Reps',
      WEIGHT: 'Weight',
      DISTANCE: 'Distance',
      CUMULATIVE: 'Cumulative',
    };
    return labels[type] || type;
  };

  const isChallengeActive = (challenge: Challenge) => {
    const now = new Date();
    const start = new Date(challenge.startAt);
    const end = new Date(challenge.endAt);
    return challenge.isActive && now >= start && now <= end;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar
        rightContent={
          <div className="flex gap-2 md:gap-4">
            {isCoachOrAdmin && (
              <Link
                to="/challenges/new"
                className="px-3 md:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm text-sm md:text-base whitespace-nowrap"
              >
                Create Challenge
              </Link>
            )}
          </div>
        }
      />

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Challenges
          </h1>
          <p className="text-gray-600">Join monthly challenges and compete on leaderboards</p>
        </div>

        {/* Filter */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-gray-200/50 mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show active challenges only</span>
          </label>
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
            <p className="text-gray-600">Loading challenges...</p>
          </div>
        ) : challenges.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 shadow-lg border border-gray-200/50 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold mb-2">No challenges found</h3>
            <p className="text-gray-600 mb-6">
              {showActiveOnly
                ? 'There are no active challenges at the moment'
                : 'No challenges have been created yet'}
            </p>
            {isCoachOrAdmin && (
              <Link
                to="/challenges/new"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold"
              >
                Create Challenge
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {challenges.map((challenge) => (
              <div
                key={challenge.id}
                className={`bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border-2 transition-all hover:shadow-xl ${
                  isChallengeActive(challenge)
                    ? 'border-green-300 bg-green-50/30'
                    : 'border-gray-200/50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">{challenge.title}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      {isChallengeActive(challenge) && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          Active Now
                        </span>
                      )}
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {getMetricTypeLabel(challenge.metricType)}
                      </span>
                    </div>
                  </div>
                  {isCoachOrAdmin && (
                    <div className="flex gap-2">
                      <Link
                        to={`/challenges/${challenge.id}/edit`}
                        className="text-blue-600 hover:text-blue-700"
                        title="Edit"
                      >
                        ✏️
                      </Link>
                      <button
                        onClick={() => handleDelete(challenge.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>

                {challenge.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">{challenge.description}</p>
                )}

                <div className="text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-medium">Starts:</span> {formatDate(challenge.startAt)}
                  </div>
                  <div>
                    <span className="font-medium">Ends:</span> {formatDate(challenge.endAt)}
                  </div>
                  {challenge.targetValue && (
                    <div>
                      <span className="font-medium">Target:</span> {challenge.targetValue}{' '}
                      {getMetricTypeLabel(challenge.metricType)}
                    </div>
                  )}
                  {challenge._count && (
                    <div>
                      <span className="font-medium">Participants:</span> {challenge._count.entries}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/challenges/${challenge.id}`}
                    className="flex-1 text-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold"
                  >
                    View Challenge
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

