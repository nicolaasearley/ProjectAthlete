import { Link } from 'react-router-dom';
import { useRoles } from '../../hooks/useRoles';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Layout/Navbar';

export default function AdminDashboard() {
  const { isAdmin } = useRoles();
  const { user } = useAuth();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
          <Link to="/dashboard" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage users, content, and system settings</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/admin/users"
            className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all"
          >
            <div className="text-4xl mb-4">👥</div>
            <h2 className="text-xl font-bold mb-2">User Management</h2>
            <p className="text-gray-600 text-sm">Manage users, roles, and permissions</p>
          </Link>

          <Link
            to="/challenges"
            className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all"
          >
            <div className="text-4xl mb-4">🏆</div>
            <h2 className="text-xl font-bold mb-2">Challenges</h2>
            <p className="text-gray-600 text-sm">Create and manage challenges</p>
          </Link>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-bold mb-2">System Stats</h2>
            <p className="text-gray-600 text-sm">View system statistics and health</p>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-gray-200/50">
          <h2 className="text-2xl font-bold mb-4">Welcome, {user?.displayName || user?.email}!</h2>
          <p className="text-gray-600 mb-4">
            You have administrator access to the Project Athlete platform. Use the quick action cards above to manage different aspects of the system.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• <strong>User Management:</strong> View, edit, and manage user accounts and roles</p>
            <p>• <strong>Challenges:</strong> Create and manage monthly challenges for the community</p>
            <p>• <strong>System Stats:</strong> Monitor system health and usage statistics</p>
          </div>
        </div>
      </div>
    </div>
  );
}

