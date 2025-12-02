import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard';
import WorkoutList from './pages/Workouts/WorkoutList';
import WorkoutDetail from './pages/Workouts/WorkoutDetail';
import WorkoutForm from './pages/Workouts/WorkoutForm';
import WeightLogList from './pages/WeightLogs/WeightLogList';
import WeightLogForm from './pages/WeightLogs/WeightLogForm';
import WorkoutRunList from './pages/WorkoutRuns/WorkoutRunList';
import WorkoutRunExecute from './pages/WorkoutRuns/WorkoutRunExecute';
import Profile from './pages/Profile/Profile';
import ExerciseList from './pages/Exercises/ExerciseList';
import ExerciseForm from './pages/Exercises/ExerciseForm';
import ExerciseDetail from './pages/Exercises/ExerciseDetail';
import ChallengeList from './pages/Challenges/ChallengeList';
import ChallengeDetail from './pages/Challenges/ChallengeDetail';
import ChallengeForm from './pages/Challenges/ChallengeForm';
import FeedList from './pages/Feed/FeedList';
import PostForm from './pages/Feed/PostForm';
import PostDetail from './pages/Feed/PostDetail';
import NotificationsList from './pages/Notifications/NotificationsList';
import WeightLogAnalytics from './pages/WeightLogs/WeightLogAnalytics';
import AdminDashboard from './pages/Admin/AdminDashboard';
import UserManagement from './pages/Admin/UserManagement';
import FloatingActionButton from './components/Layout/FloatingActionButton';

function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Project Athlete v2
            </Link>
            <div className="flex gap-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Transform Your Fitness Journey
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Track workouts, join challenges, and connect with a community
            of athletes. Built for serious fitness enthusiasts.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-semibold"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-white transition-all shadow-md border border-gray-200 font-semibold"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="text-4xl mb-4">💪</div>
            <h3 className="text-xl font-bold mb-2">Personal Workouts</h3>
            <p className="text-gray-600">
              Create and track your custom workouts with detailed exercise logs.
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold mb-2">Challenges</h3>
            <p className="text-gray-600">
              Join monthly challenges and compete on leaderboards.
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold mb-2">Community</h3>
            <p className="text-gray-600">
              Share your progress and connect with other athletes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <>
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workouts"
        element={
          <ProtectedRoute>
            <WorkoutList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workouts/new"
        element={
          <ProtectedRoute>
            <WorkoutForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workouts/:id"
        element={
          <ProtectedRoute>
            <WorkoutDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workouts/:id/edit"
        element={
          <ProtectedRoute>
            <WorkoutForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/weight-logs"
        element={
          <ProtectedRoute>
            <WeightLogList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/weight-logs/new"
        element={
          <ProtectedRoute>
            <WeightLogForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/weight-logs/:id/edit"
        element={
          <ProtectedRoute>
            <WeightLogForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workout-runs"
        element={
          <ProtectedRoute>
            <WorkoutRunList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workouts/:workoutId/execute"
        element={
          <ProtectedRoute>
            <WorkoutRunExecute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercises"
        element={
          <ProtectedRoute>
            <ExerciseList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercises/new"
        element={
          <ProtectedRoute>
            <ExerciseForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercises/:id"
        element={
          <ProtectedRoute>
            <ExerciseDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercises/:id/edit"
        element={
          <ProtectedRoute>
            <ExerciseForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/challenges"
        element={
          <ProtectedRoute>
            <ChallengeList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/challenges/new"
        element={
          <ProtectedRoute>
            <ChallengeForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/challenges/:id"
        element={
          <ProtectedRoute>
            <ChallengeDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/challenges/:id/edit"
        element={
          <ProtectedRoute>
            <ChallengeForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feed"
        element={
          <ProtectedRoute>
            <FeedList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feed/new"
        element={
          <ProtectedRoute>
            <PostForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feed/:id"
        element={
          <ProtectedRoute>
            <PostDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/weight-logs/analytics/:exerciseId"
        element={
          <ProtectedRoute>
            <WeightLogAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      </Routes>
      <FloatingActionButton />
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
