import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRoles } from '../hooks/useRoles';
import Navbar from '../components/Layout/Navbar';

export default function Dashboard() {
  const { user } = useAuth();
  const { isAdmin } = useRoles();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8 md:py-16 max-w-6xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Dashboard
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200/50">
            <div className="text-3xl md:text-4xl mb-3 md:mb-4">💪</div>
            <h3 className="text-lg md:text-xl font-bold mb-2">My Workouts</h3>
            <p className="text-sm md:text-base text-gray-600 mb-4">Create and manage your personal workouts</p>
            <Link
              to="/workouts"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              View Workouts →
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Weight Logs</h3>
            <p className="text-gray-600 mb-4">Track your strength progress over time</p>
            <Link
              to="/weight-logs"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              View Logs →
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="text-4xl mb-4">🏋️</div>
            <h3 className="text-xl font-bold mb-2">Workout History</h3>
            <p className="text-gray-600 mb-4">View your completed and in-progress workouts</p>
            <Link
              to="/workout-runs"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              View History →
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold mb-2">Exercise Library</h3>
            <p className="text-gray-600 mb-4">Browse and search the exercise database</p>
            <Link
              to="/exercises"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Browse Exercises →
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold mb-2">Challenges</h3>
            <p className="text-gray-600 mb-4">Join monthly challenges and compete</p>
            <Link
              to="/challenges"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              View Challenges →
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold mb-2">Community Feed</h3>
            <p className="text-gray-600 mb-4">Connect with other athletes and share your journey</p>
            <Link
              to="/feed"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              View Feed →
            </Link>
          </div>

          {isAdmin && (
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border-2 border-purple-300">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-bold mb-2">Admin Panel</h3>
              <p className="text-gray-600 mb-4">Manage users, content, and system settings</p>
              <Link
                to="/admin"
                className="text-purple-600 hover:text-purple-700 font-semibold"
              >
                Go to Admin →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

