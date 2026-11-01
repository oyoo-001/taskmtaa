import { useState, useEffect } from 'react';
import {
  Search,
  BadgeCheck,
  ShieldBan,
  ShieldCheck,
  Trash2,
  Mail,
  Phone,
  Star,
  X,
  Briefcase,
  Calendar,
  Award
} from 'lucide-react';
import { api } from '../../lib/api';
import VerifiedBadge from '../../components/VerifiedBadge';

  const STATUS_OPTIONS = [
  { value: 'all', label: 'All users' },
  { value: 'active', label: 'Active' },
  { value: 'verified', label: 'Verified' },
  { value: 'unverified', label: 'Unverified' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'featured', label: 'Featured' },
  { value: 'admin', label: 'Admins' },
];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/admin/users', {
          params: { search: search || undefined, status: status === 'all' ? undefined : status, page },
        });
        if (!active) return;
        setUsers(response.data.data.users);
        setPagination(response.data.data.pagination);
      } catch (err) {
        console.error('Failed to load users:', err);
        if (active) setError(err.response?.data?.error?.message || 'Failed to load users');
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, status, page, refreshKey]);

  const refresh = () => setRefreshKey((key) => key + 1);

  const openDetail = async (user) => {
    setDetail({ user, tasks: [], reviews: [] });
    setDetailLoading(true);
    setDetailError(null);
    try {
      const response = await api.get(`/admin/users/${user.id}`);
      setDetail(response.data.data);
    } catch (err) {
      setDetailError(err.response?.data?.error?.message || 'Failed to load user details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleVerify = async (user) => {
    setBusyId(user.id);
    try {
      await api.patch(`/admin/users/${user.id}/verify`, { is_verified: !user.is_verified });
      refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update verification');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleFeatured = async (user) => {
    setBusyId(user.id);
    try {
      await api.patch(`/admin/users/${user.id}/featured`, { is_featured: !user.is_featured });
      refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update featured status');
    } finally {
      setBusyId(null);
    }
  };

  const handleSuspend = async (user) => {
    if (user.is_suspended) {
      if (!window.confirm(`Reinstate ${user.full_name}?`)) return;
      setBusyId(user.id);
      try {
        await api.patch(`/admin/users/${user.id}/suspend`, { suspend: false });
        refresh();
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to reinstate user');
      } finally {
        setBusyId(null);
      }
      return;
    }

    const reason = window.prompt(`Reason for suspending ${user.full_name}:`);
    if (reason === null) return;
    if (!reason.trim()) {
      setError('A suspension reason is required');
      return;
    }

    setBusyId(user.id);
    try {
      await api.patch(`/admin/users/${user.id}/suspend`, { suspend: true, reason: reason.trim() });
      refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to suspend user');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (user) => {
    const confirmed = window.confirm(
      `Permanently delete ${user.full_name}? Their tasks, bids and messages will also be removed.`
    );
    if (!confirmed) return;

    setBusyId(user.id);
    try {
      await api.delete(`/admin/users/${user.id}`);
      refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete user');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <p className="text-gray-600">View, verify, suspend or delete accounts</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email or phone..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="input py-2 sm:w-48"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
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
                <th className="text-left px-4 py-3 font-medium">Contact</th>
                <th className="text-left px-4 py-3 font-medium">Rating</th>
                <th className="text-left px-4 py-3 font-medium">Activity</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              )}

              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    No users match this filter
                  </td>
                </tr>
              )}

              {!loading && users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random`}
                        alt={user.full_name}
                        className="w-9 h-9 rounded-full"
                      />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => openDetail(user)}
                          className="font-medium text-gray-900 flex items-center gap-1 hover:text-primary-600 text-left"
                        >
                          <span className="truncate max-w-[12rem]">{user.full_name}</span>
                          <VerifiedBadge verified={user.is_verified} />
                        </button>
                        <p className="text-xs text-gray-500">#{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="flex items-center gap-1 text-gray-700">
                      <Mail size={14} className="text-gray-400" />
                      <span className="truncate max-w-[13rem]">{user.email}</span>
                    </p>
                    {user.phone_number && (
                      <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Phone size={12} className="text-gray-400" />
                        {user.phone_number}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-gray-900 font-medium">
                      <Star size={14} className="text-yellow-400 fill-current" />
                      {Number(user.rating || 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-gray-500">{user.reviews_count} reviews</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <p>{user.posted_tasks} posted</p>
                    <p>{user.bids_placed} bids</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      {user.is_admin && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">Admin</span>
                      )}
                      {user.is_suspended ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">Suspended</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">Active</span>
                      )}
                      {user.is_verified && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">Verified</span>
                      )}
                      {user.is_featured && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">Featured</span>
                      )}
                    </div>
                    {user.is_suspended && user.suspension_reason && (
                      <p className="text-xs text-red-600 mt-1 max-w-[10rem] truncate" title={user.suspension_reason}>
                        {user.suspension_reason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleVerify(user)}
                        disabled={busyId === user.id}
                        title={user.is_verified ? 'Remove verification' : 'Verify user'}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                          user.is_verified
                            ? 'text-blue-600 hover:bg-blue-50'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        <BadgeCheck size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(user)}
                        disabled={busyId === user.id}
                        title={user.is_featured ? 'Remove from featured' : 'Mark as featured'}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                          user.is_featured
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        <Award size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSuspend(user)}
                        disabled={busyId === user.id}
                        title={user.is_suspended ? 'Reinstate user' : 'Suspend user'}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                          user.is_suspended
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-amber-600 hover:bg-amber-50'
                        }`}
                      >
                        {user.is_suspended ? <ShieldCheck size={18} /> : <ShieldBan size={18} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user)}
                        disabled={busyId === user.id || user.is_admin}
                        title="Delete user"
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <p>
          {pagination.total} user{pagination.total === 1 ? '' : 's'} · page {pagination.page} of {pagination.pages}
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

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
              <h3 className="font-semibold text-gray-900">User details</h3>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                aria-label="Close user details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {detailError && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {detailError}
                </div>
              )}

              {detailLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <img
                      src={detail.user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(detail.user.full_name)}&background=random`}
                      alt={detail.user.full_name}
                      className="w-14 h-14 rounded-full"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-semibold text-gray-900 flex items-center gap-1">
                        {detail.user.full_name}
                        <VerifiedBadge verified={detail.user.is_verified} size={18} />
                      </p>
                      <p className="text-sm text-gray-500">{detail.user.email}</p>
                      {detail.user.phone_number && (
                        <p className="text-sm text-gray-500">{detail.user.phone_number}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {detail.user.is_admin && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">Admin</span>
                        )}
                        {detail.user.is_suspended && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">Suspended</span>
                        )}
                        {detail.user.is_verified && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">Verified</span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium flex items-center gap-1">
                          <Star size={12} className="text-yellow-400 fill-current" />
                          {Number(detail.user.rating || 0).toFixed(2)} rating
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-gray-900">{detail.user.posted_tasks}</p>
                      <p className="text-xs text-gray-500">Jobs posted</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-gray-900">{detail.user.bids_placed}</p>
                      <p className="text-xs text-gray-500">Bids placed</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-gray-900">{detail.user.reviews_count}</p>
                      <p className="text-xs text-gray-500">Reviews</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-gray-900">{detail.user.completed_tasks_count}</p>
                      <p className="text-xs text-gray-500">Completed</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar size={13} />
                    Joined {new Date(detail.user.created_at).toLocaleDateString()}
                  </p>

                  {detail.user.is_suspended && detail.user.suspension_reason && (
                    <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                      Suspension reason: {detail.user.suspension_reason}
                    </p>
                  )}

                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                      <Briefcase size={16} />
                      Posted jobs
                    </h4>
                    {detail.tasks.length === 0 ? (
                      <p className="text-sm text-gray-500">No jobs posted</p>
                    ) : (
                      <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                        {detail.tasks.map((task) => (
                          <div key={task.id} className="px-3 py-2 flex items-center justify-between gap-2 text-sm">
                            <span className="text-gray-900 truncate">{task.title}</span>
                            <span className="text-xs text-gray-500 whitespace-nowrap capitalize">
                              {task.status.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                      <Star size={16} className="text-yellow-400" />
                      Reviews received
                    </h4>
                    {detail.reviews.length === 0 ? (
                      <p className="text-sm text-gray-500">No reviews yet</p>
                    ) : (
                      <div className="space-y-2">
                        {detail.reviews.map((review) => (
                          <div key={review.id} className="border border-gray-200 rounded-lg p-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900 flex items-center gap-1">
                                {review.reviewer_name}
                                <VerifiedBadge verified={review.reviewer_verified} size={13} />
                              </span>
                              <span className="flex items-center gap-1 text-gray-700">
                                <Star size={13} className="text-yellow-400 fill-current" />
                                {review.rating}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">{review.task_title}</p>
                            {review.comment && (
                              <p className="text-gray-700 mt-1">{review.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
