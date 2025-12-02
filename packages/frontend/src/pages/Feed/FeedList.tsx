import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postsService, Post, PostListResponse } from '../../services/posts.service';
import { reactionsService, ReactionType } from '../../services/reactions.service';
import { ApiError } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Layout/Navbar';

export default function FeedList() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const response: PostListResponse = await postsService.getAll({
        page: 1,
        limit: 20,
      });
      setPosts(response.data);
      setMeta(response.meta);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (post: Post, reactionType: ReactionType) => {
    if (!user) return;

    try {
      await reactionsService.createOrUpdate({
        targetType: 'POST',
        targetId: post.id,
        reactionType,
      });

      // Reload posts to get updated reaction counts
      loadPosts();
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Failed to react:', apiError.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await postsService.delete(id);
      loadPosts();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to delete post');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getReactionEmoji = (type: ReactionType) => {
    const emojis: Record<ReactionType, string> = {
      LIKE: '👍',
      LOVE: '❤️',
      FIRE: '🔥',
      THUMBS_UP: '👏',
      CELEBRATE: '🎉',
    };
    return emojis[type] || '👍';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar
        rightContent={
          <div className="flex gap-2 md:gap-4 items-center">
            <Link
              to="/feed/new"
              className="px-3 md:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm text-sm md:text-base whitespace-nowrap"
            >
              New Post
            </Link>
          </div>
        }
      />

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Community Feed
        </h1>

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
            <p className="text-gray-600">Loading feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 shadow-lg border border-gray-200/50 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-bold mb-2">No posts yet</h3>
            <p className="text-gray-600 mb-6">Be the first to share your fitness journey!</p>
            <Link
              to="/feed/new"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold"
            >
              Create Post
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all"
              >
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                      {post.user?.displayName?.[0]?.toUpperCase() || post.user?.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-semibold">
                        {post.user?.displayName || post.user?.email}
                      </div>
                      <div className="text-sm text-gray-500">{formatDate(post.createdAt)}</div>
                    </div>
                  </div>
                  {post.userId === user?.id && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {/* Post Content */}
                <div className="mb-4 whitespace-pre-wrap">{post.text}</div>

                {post.location && (
                  <div className="text-sm text-gray-500 mb-4">📍 {post.location}</div>
                )}

                {post.exerciseTags && post.exerciseTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.exerciseTags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Reactions */}
                <div className="flex items-center gap-4 mb-4 pt-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    {(['LIKE', 'LOVE', 'FIRE', 'THUMBS_UP', 'CELEBRATE'] as ReactionType[]).map((type) => {
                      const count = post.reactionCounts?.[type] || 0;
                      const isActive = post.userReaction === type;
                      return (
                        <button
                          key={type}
                          onClick={() => handleReaction(post, type)}
                          className={`px-3 py-1 rounded-full text-sm transition-all ${
                            isActive
                              ? 'bg-blue-100 text-blue-700 font-semibold'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {getReactionEmoji(type)} {count > 0 && count}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comments Count */}
                <Link
                  to={`/feed/${post.id}`}
                  className="text-sm text-gray-600 hover:text-blue-600"
                >
                  {post._count?.comments || 0} comment{(post._count?.comments || 0) !== 1 ? 's' : ''}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

