import { useState, useEffect } from 'react';
import { Search, Star, TrendingDown } from 'lucide-react';
import { api } from '../../lib/api';
import VerifiedBadge from '../../components/VerifiedBadge';

function Stars({ value = 0 }) {
  const rounded = Math.round(Number(value));
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= rounded ? 'text-yellow-400 fill-current' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

export default function AdminRatings() {
  const [ratings, setRatings] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/admin/ratings', {
          params: { search: search || undefined },
        });
        if (!active) return;
        setRatings(response.data.data.ratings);
      } catch (err) {
        console.error('Failed to load ratings:', err);
        if (active) setError(err.response?.data?.error?.message || 'Failed to load ratings');
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  const visible = ratings.filter((user) => {
    if (filter === 'low') return Number(user.rating) < 4;
    if (filter === 'high') return Number(user.rating) >= 4.5;
    if (filter === 'no_reviews') return user.reviews_count === 0;
    return true;
  });

  const platformAverage = ratings.length
    ? ratings.reduce((sum, user) => sum + Number(user.rating || 0), 0) / ratings.length
    : 0;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Ratings</h2>
          <p className="text-gray-600">Average scores and review distribution per user</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
          <p className="text-xs text-gray-500">Platform average</p>
          <p className="text-xl font-bold text-gray-900 flex items-center gap-1">
            <Star size={18} className="text-yellow-400 fill-current" />
            {platformAverage.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input py-2 sm:w-52"
        >
          <option value="all">All users</option>
          <option value="high">High rated (4.5+)</option>
          <option value="low">Low rated (below 4)</option>
          <option value="no_reviews">No reviews yet</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">User</th>
                <th className="text-left px-4 py-3 font-medium">Average</th>
                <th className="text-left px-4 py-3 font-medium">Reviews</th>
                <th className="text-left px-4 py-3 font-medium">Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                    Loading ratings...
                  </td>
                </tr>
              )}

              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                    No users match this filter
                  </td>
                </tr>
              )}

              {!loading && visible.map((user) => {
                const total = user.reviews_count || 0;
                const bars = [
                  { label: '5', value: user.five_star, color: 'bg-green-500' },
                  { label: '4', value: user.four_star, color: 'bg-green-400' },
                  { label: '3', value: user.three_star, color: 'bg-yellow-400' },
                  { label: '2', value: user.two_star, color: 'bg-orange-400' },
                  { label: '1', value: user.one_star, color: 'bg-red-500' },
                ];

                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random`}
                          alt={user.full_name}
                          className="w-9 h-9 rounded-full"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 flex items-center gap-1">
                            <span className="truncate max-w-[12rem]">{user.full_name}</span>
                            <VerifiedBadge verified={user.is_verified} />
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[14rem]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{Number(user.rating || 0).toFixed(2)}</p>
                      <Stars value={user.rating} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{total}</p>
                      {total > 0 && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <TrendingDown size={12} />
                          avg {Number(user.reviews_average).toFixed(1)} from reviews
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {total === 0 ? (
                        <span className="text-xs text-gray-400">No reviews yet</span>
                      ) : (
                        <div className="space-y-0.5 min-w-[10rem]">
                          {bars.map((bar) => (
                            <div key={bar.label} className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 w-3">{bar.label}</span>
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${bar.color}`}
                                  style={{ width: `${total ? (bar.value / total) * 100 : 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-5 text-right">{bar.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
