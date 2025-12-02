import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { postsService, CreatePostRequest, Privacy } from '../../services/posts.service';
import { ApiError } from '../../lib/api';
import Navbar from '../../components/Layout/Navbar';

export default function PostForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    text: '',
    privacy: 'PUBLIC' as Privacy,
    location: '',
    exerciseTags: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const postData: CreatePostRequest = {
        text: formData.text,
        privacy: formData.privacy,
        location: formData.location || undefined,
        exerciseTags: formData.exerciseTags
          ? formData.exerciseTags.split(',').map((tag) => tag.trim()).filter(Boolean)
          : undefined,
      };

      await postsService.create(postData);
      navigate('/feed');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar showBackButton={true} backTo="/feed" backLabel="Back to Feed" />

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Create Post
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
                What's on your mind? *
              </label>
              <textarea
                required
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Share your workout, progress, or motivation..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Privacy
              </label>
              <select
                value={formData.privacy}
                onChange={(e) => setFormData({ ...formData, privacy: e.target.value as Privacy })}
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
                <option value="FRIENDS_ONLY">Friends Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (optional)
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Where are you?"
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exercise Tags (optional)
              </label>
              <input
                type="text"
                value={formData.exerciseTags}
                onChange={(e) => setFormData({ ...formData, exerciseTags: e.target.value })}
                placeholder="e.g., Bench Press, Running, Yoga (comma separated)"
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Separate multiple exercises with commas
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Posting...' : 'Post'}
              </button>
              <Link
                to="/feed"
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

