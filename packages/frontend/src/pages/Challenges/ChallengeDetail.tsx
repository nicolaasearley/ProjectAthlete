import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { challengesService, Challenge, LeaderboardEntry, ChallengeEntry } from '../../services/challenges.service';
import { ApiError } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { getTodayDateString, formatDateForDisplay } from '../../utils/dateUtils';
import Navbar from '../../components/Layout/Navbar';

export default function ChallengeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myEntries, setMyEntries] = useState<ChallengeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'entries'>('leaderboard');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [entryFormData, setEntryFormData] = useState({
    value: '',
    date: getTodayDateString(),
    notes: '',
  });

  // Removed unused isCoachOrAdmin variable
  const isOwner = challenge?.coachId === user?.id;

  useEffect(() => {
    if (id) {
      loadChallenge();
      loadLeaderboard();
      if (user?.id) {
        loadMyEntries();
      }
    }
  }, [id, user?.id]);

  const loadChallenge = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const challengeData = await challengesService.getById(id);
      setChallenge(challengeData);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load challenge');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    if (!id) return;
    try {
      const leaderboardData = await challengesService.getLeaderboard(id);
      setLeaderboard(leaderboardData);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    }
  };

  const loadMyEntries = async () => {
    if (!id || !user?.id) return;
    try {
      const entries = await challengesService.getEntries(id, user.id);
      setMyEntries(entries);
    } catch (err) {
      console.error('Failed to load entries:', err);
    }
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setError('');
    try {
      // Send date in YYYY-MM-DD format - backend will handle parsing
      await challengesService.createEntry({
        challengeId: id,
        value: parseFloat(entryFormData.value),
        date: entryFormData.date, // Send as YYYY-MM-DD
        notes: entryFormData.notes || undefined,
      });
      setShowEntryForm(false);
      setEntryFormData({
        value: '',
        date: getTodayDateString(),
        notes: '',
      });
      loadLeaderboard();
      loadMyEntries();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to create entry');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      await challengesService.deleteEntry(entryId);
      loadLeaderboard();
      loadMyEntries();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to delete entry');
    }
  };

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString);
  };

  const getMetricTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      TIME: 'seconds',
      REPS: 'reps',
      WEIGHT: 'lbs',
      DISTANCE: 'miles',
      CUMULATIVE: 'units',
    };
    return labels[type] || type;
  };

  const isChallengeActive = (challenge: Challenge) => {
    const now = new Date();
    const start = new Date(challenge.startAt);
    const end = new Date(challenge.endAt);
    return challenge.isActive && now >= start && now <= end;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Link to="/challenges" className="text-blue-600 hover:text-blue-700">
              ← Back to Challenges
            </Link>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-600">
            {error || 'Challenge not found'}
          </div>
        </div>
      </div>
    );
  }

  const active = isChallengeActive(challenge);
  const myRank = leaderboard.findIndex((entry) => entry.userId === user?.id) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar showBackButton={true} backTo="/challenges" backLabel="Back to Challenges" />

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-gray-200/50 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{challenge.title}</h1>
              <div className="flex items-center gap-2 mb-4">
                {active && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    Active Now
                  </span>
                )}
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {getMetricTypeLabel(challenge.metricType)}
                </span>
              </div>
            </div>
            {isOwner && (
              <Link
                to={`/challenges/${challenge.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit
              </Link>
            )}
          </div>

          {challenge.description && (
            <p className="text-gray-600 mb-4">{challenge.description}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Start Date</span>
              <div className="font-semibold">{formatDate(challenge.startAt)}</div>
            </div>
            <div>
              <span className="text-gray-500">End Date</span>
              <div className="font-semibold">{formatDate(challenge.endAt)}</div>
            </div>
            {challenge.targetValue && (
              <div>
                <span className="text-gray-500">Target</span>
                <div className="font-semibold">
                  {challenge.targetValue} {getMetricTypeLabel(challenge.metricType)}
                </div>
              </div>
            )}
            <div>
              <span className="text-gray-500">Participants</span>
              <div className="font-semibold">{leaderboard.length}</div>
            </div>
          </div>

          {user && myRank > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-lg font-semibold text-blue-900">
                Your Rank: #{myRank} with {leaderboard[myRank - 1]?.total || 0}{' '}
                {getMetricTypeLabel(challenge.metricType)}
              </div>
            </div>
          )}
        </div>

        {/* Prominent Log Entry Button */}
        {active && user && (
          <div className="mb-6 flex justify-center">
            <button
              onClick={() => {
                setShowEntryForm(!showEntryForm);
                setActiveTab('entries'); // Switch to entries tab when opening form
              }}
              className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 active:scale-95 transition-all shadow-lg hover:shadow-xl font-semibold text-base md:text-lg flex items-center gap-2 touch-manipulation"
            >
              <span>{showEntryForm ? '✕ Cancel' : '+ Log Entry'}</span>
            </button>
          </div>
        )}

        {/* Entry Form - Show above tabs if active */}
        {showEntryForm && active && user && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50 mb-6">
            <h2 className="text-2xl font-bold mb-4">Log Challenge Entry</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-600">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmitEntry} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={entryFormData.value}
                    onChange={(e) =>
                      setEntryFormData({ ...entryFormData, value: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={entryFormData.date}
                    onChange={(e) =>
                      setEntryFormData({ ...entryFormData, date: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={entryFormData.notes}
                  onChange={(e) =>
                    setEntryFormData({ ...entryFormData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional notes about this entry..."
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Submit Entry
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEntryForm(false);
                    setError('');
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {error && !showEntryForm && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50 mb-6">
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                activeTab === 'leaderboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Leaderboard
            </button>
            <button
              onClick={() => setActiveTab('entries')}
              className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                activeTab === 'entries'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              My Entries ({myEntries.length})
            </button>
          </div>

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div>
              {leaderboard.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  No entries yet. Be the first to join!
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.userId}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        entry.userId === user?.id
                          ? 'bg-blue-50 border-2 border-blue-200'
                          : index < 3
                          ? 'bg-yellow-50 border border-yellow-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`text-2xl font-bold ${
                            index === 0
                              ? 'text-yellow-600'
                              : index === 1
                              ? 'text-gray-500'
                              : index === 2
                              ? 'text-orange-600'
                              : 'text-gray-400'
                          }`}
                        >
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-semibold">
                            {entry.displayName}
                            {entry.userId === user?.id && ' (You)'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {entry.entryCount} entry{entry.entryCount !== 1 ? 'ies' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-xl font-bold">
                        {entry.total.toLocaleString()} {getMetricTypeLabel(challenge.metricType)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* My Entries Tab */}
          {activeTab === 'entries' && (
            <div>
              {!showEntryForm && active && (
                <div className="mb-4 text-center">
                  <p className="text-gray-600 mb-2">Want to log another entry?</p>
                  <button
                    onClick={() => setShowEntryForm(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    + Log Another Entry
                  </button>
                </div>
              )}

              {myEntries.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  You haven't logged any entries yet.
                  {active && ' Log your first entry above!'}
                </div>
              ) : (
                <div className="space-y-2">
                  {myEntries
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div>
                          <div className="font-semibold">
                            {entry.value} {getMetricTypeLabel(challenge.metricType)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(entry.date)}
                            {entry.notes && ` • ${entry.notes}`}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

