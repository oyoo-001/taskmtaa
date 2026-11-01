import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Search, Trash2, MessageSquare, Star, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import VerifiedBadge from '../../components/VerifiedBadge';

function Stars({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= value ? 'text-yellow-400 fill-current' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

export default function AdminFeedback() {
  const [tab, setTab] = useState('reviews');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = tab === 'reviews' ? '/admin/feedback/reviews' : '/admin/feedback/messages';
        const response = await api.get(endpoint, {
          params: { search: search || undefined, page },
        });
        if (!active) return;
        if (tab === 'reviews') {
          setReviews(response.data.data.reviews);
        } else {
          setMessages(response.data.data.messages);
        }
        setPagination(response.data.data.pagination);
      } catch (err) {
        console.error('Failed to load feedback:', err);
        if (active) setError(err.response?.data?.error?.message || 'Failed to load feedback');
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [tab, search, page, refreshKey]);

  const switchTab = (nextTab) => {
    setTab(nextTab);
    setSearch('');
    setPage(1);
  };

  const deleteReview = async (review) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;
    setBusyId(review.id);
    try {
      await api.delete(`/admin/feedback/reviews/${review.id}`);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete review');
    } finally {
      setBusyId(null);
    }
  };

  const deleteMessage = async (message) => {
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    setBusyId(message.id);
    try {
      await api.delete(`/admin/feedback/messages/${message.id}`);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete message');
    } finally {
      setBusyId(null);
    }
  };

  const items = tab === 'reviews' ? reviews : messages;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-900">Feedback & Messages</h2>
        <p className="text-gray-600">Review ratings, written feedback and platform chat</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex rounded-lg overflow-hidden border border-gray-300">
          <button
            type="button"
            onClick={() => switchTab('reviews')}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${
              tab === 'reviews' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Star size={16} />
            Reviews
          </button>
          <button
            type="button"
            onClick={() => switchTab('messages')}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-l border-gray-300 transition-colors ${
              tab === 'messages' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MessageSquare size={16} />
            Messages
          </button>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={tab === 'reviews' ? 'Search feedback, users or jobs...' : 'Search messages, users or jobs...'}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
          {tab === 'reviews' ? 'No reviews found' : 'No messages found'}
        </div>
      )}

      <div className="space-y-3">
        {!loading && tab === 'reviews' && reviews.map((review) => (
          <article key={review.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={review.reviewer_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.reviewer_name)}&background=random`}
                  alt={review.reviewer_name}
                  className="w-9 h-9 rounded-full"
                />
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 flex items-center gap-1 flex-wrap">
                    <span className="font-medium flex items-center gap-1">
                      {review.reviewer_name}
                      <VerifiedBadge verified={review.reviewer_verified} />
                    </span>
                    <ArrowRight size={14} className="text-gray-400" />
                    <span className="font-medium flex items-center gap-1">
                      {review.reviewee_name}
                      <VerifiedBadge verified={review.reviewee_verified} />
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 truncate">{review.task_title}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Stars value={review.rating} />
                <button
                  type="button"
                  onClick={() => deleteReview(review)}
                  disabled={busyId === review.id}
                  title="Delete review"
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {review.comment && (
              <p className="mt-3 text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                {review.comment}
              </p>
            )}

            <p className="mt-2 text-xs text-gray-400">
              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            </p>
          </article>
        ))}

        {!loading && tab === 'messages' && messages.map((message) => (
          <article key={message.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={message.sender_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender_name)}&background=random`}
                  alt={message.sender_name}
                  className="w-9 h-9 rounded-full"
                />
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 flex items-center gap-1 flex-wrap">
                    <span className="font-medium flex items-center gap-1">
                      {message.sender_name}
                      <VerifiedBadge verified={message.sender_verified} />
                    </span>
                    <ArrowRight size={14} className="text-gray-400" />
                    <span className="font-medium flex items-center gap-1">
                      {message.receiver_name}
                      <VerifiedBadge verified={message.receiver_verified} />
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 truncate">{message.task_title}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => deleteMessage(message)}
                disabled={busyId === message.id}
                title="Delete message"
                className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 flex-shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <p className="mt-3 text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap break-words">
              {message.message_text}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              {message.is_read ? ' · Read' : ' · Unread'}
            </p>
          </article>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <p>
          {pagination.total} {tab === 'reviews' ? 'review' : 'message'}{pagination.total === 1 ? '' : 's'} · page {pagination.page} of {pagination.pages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pagination.page <= 1}
            className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={pagination.page >= pagination.pages}
            className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
