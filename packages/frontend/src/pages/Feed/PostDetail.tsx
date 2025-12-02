import { useState, useEffect, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postsService, Post, ReactionType } from '../../services/posts.service';
import { commentsService, Comment } from '../../services/comments.service';
import { reactionsService } from '../../services/reactions.service';
import { ApiError } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Layout/Navbar';

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (id) {
      loadPost();
      loadComments();
    }
  }, [id]);

  const loadPost = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const postData = await postsService.getById(id);
      setPost(postData);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!id) return;
    try {
      const commentsData = await commentsService.getByPost(id);
      setComments(commentsData);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const handleReaction = async (reactionType: ReactionType, targetType: 'POST' | 'COMMENT', targetId: string) => {
    if (!user) return;

    try {
      await reactionsService.createOrUpdate({
        targetType,
        targetId,
        reactionType,
      });
      
      if (targetType === 'POST') {
        loadPost();
      } else {
        loadComments();
      }
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Failed to react:', apiError.message);
    }
  };

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await commentsService.create({
        postId: id,
        text: commentText,
        parentCommentId: replyingTo || undefined,
      });
      setCommentText('');
      setReplyingTo(null);
      loadComments();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSubmitReply = async (parentCommentId: string) => {
    if (!id || !replyText[parentCommentId]?.trim()) return;

    setSubmittingComment(true);
    try {
      await commentsService.create({
        postId: id,
        text: replyText[parentCommentId],
        parentCommentId,
      });
      setReplyText({ ...replyText, [parentCommentId]: '' });
      loadComments();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to post reply');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await commentsService.delete(commentId);
      loadComments();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to delete comment');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar showBackButton={true} backTo="/feed" backLabel="Back to Feed" />
        <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-600">
            {error || 'Post not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar showBackButton={true} backTo="/feed" backLabel="Back to Feed" />

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Post */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50 mb-6">
          {/* Post Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {post.user?.displayName?.[0]?.toUpperCase() || post.user?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div className="font-semibold text-lg">
                  {post.user?.displayName || post.user?.email}
                </div>
                <div className="text-sm text-gray-500">{formatDate(post.createdAt)}</div>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-4 whitespace-pre-wrap text-lg">{post.text}</div>

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
                    onClick={() => handleReaction(type, 'POST', post.id)}
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
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600">
            {error}
          </div>
        )}

        {/* Comment Form */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50 mb-6">
          <form onSubmit={handleSubmitComment}>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        </div>

        {/* Comments */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold mb-4">
            {comments.length} Comment{comments.length !== 1 ? 's' : ''}
          </h3>

          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-gray-200/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {comment.user?.displayName?.[0]?.toUpperCase() || comment.user?.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">
                        {comment.user?.displayName || comment.user?.email}
                      </div>
                      <div className="text-xs text-gray-500">{formatDate(comment.createdAt)}</div>
                    </div>
                  </div>
                  {comment.userId === user?.id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                <div className="mb-2 whitespace-pre-wrap">{comment.text}</div>

                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="text-sm text-gray-600 hover:text-blue-600"
                  >
                    Reply
                  </button>
                </div>

                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <div className="mt-2 pl-4 border-l-2 border-gray-200">
                    <textarea
                      value={replyText[comment.id] || ''}
                      onChange={(e) =>
                        setReplyText({ ...replyText, [comment.id]: e.target.value })
                      }
                      placeholder="Write a reply..."
                      rows={2}
                      className="w-full px-3 py-2 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSubmitReply(comment.id)}
                        disabled={submittingComment || !replyText[comment.id]?.trim()}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reply
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText({ ...replyText, [comment.id]: '' });
                        }}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id}>
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {reply.user?.displayName?.[0]?.toUpperCase() || reply.user?.email?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="font-semibold text-xs">
                                {reply.user?.displayName || reply.user?.email}
                              </div>
                              <div className="text-xs text-gray-500">{formatDate(reply.createdAt)}</div>
                            </div>
                          </div>
                          {reply.userId === user?.id && (
                            <button
                              onClick={() => handleDeleteComment(reply.id)}
                              className="text-red-600 hover:text-red-700 text-xs"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{reply.text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

