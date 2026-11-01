import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Search, Trash2, MapPin, Briefcase, Star } from 'lucide-react';
import { api } from '../../lib/api';
import VerifiedBadge from '../../components/VerifiedBadge';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const CATEGORIES = [
  '',
  'Housekeeping',
  'Bush & Yard Clearing',
  'Farming & Agriculture',
  'Tutoring & Training',
  'Errands & Delivery',
  'Other'
];

function statusClass(status) {
  const map = {
    open: 'bg-green-100 text-green-700',
    assigned: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-gray-200 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
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
        const response = await api.get('/admin/tasks', {
          params: {
            search: search || undefined,
            status: status || undefined,
            category: category || undefined,
            page,
          },
        });
        if (!active) return;
        setTasks(response.data.data.tasks);
        setPagination(response.data.data.pagination);
      } catch (err) {
        console.error('Failed to load tasks:', err);
        if (active) setError(err.response?.data?.error?.message || 'Failed to load jobs');
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, status, category, page, refreshKey]);

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;

    setBusyId(task.id);
    try {
      await api.delete(`/admin/tasks/${task.id}`);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete job');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-900">Posted Jobs</h2>
        <p className="text-gray-600">Every job posted across the platform</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search title, description, location or poster..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="input py-2 lg:w-44"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="input py-2 lg:w-52"
        >
          {CATEGORIES.map((option) => (
            <option key={option || 'all'} value={option}>
              {option || 'All categories'}
            </option>
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
                <th className="text-left px-4 py-3 font-medium">Job</th>
                <th className="text-left px-4 py-3 font-medium">Poster</th>
                <th className="text-left px-4 py-3 font-medium">Budget</th>
                <th className="text-left px-4 py-3 font-medium">Bids</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    Loading jobs...
                  </td>
                </tr>
              )}

              {!loading && tasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    No jobs match these filters
                  </td>
                </tr>
              )}

              {!loading && tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <Briefcase size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <Link
                          to={`/tasks/${task.id}`}
                          className="font-medium text-gray-900 hover:text-primary-600 line-clamp-1"
                        >
                          {task.title}
                        </Link>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={12} />
                          <span className="truncate max-w-[14rem]">{task.location_name}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {task.category} · {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 flex items-center gap-1">
                      <span className="truncate max-w-[10rem]">{task.poster_name}</span>
                      <VerifiedBadge verified={task.poster_verified} />
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[12rem]">{task.poster_email}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-green-700 whitespace-nowrap">
                    KSh {Number(task.budget).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{task.bids_count}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusClass(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleDelete(task)}
                      disabled={busyId === task.id}
                      title="Delete job"
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <p className="flex items-center gap-1">
          <Star size={14} className="text-yellow-400" />
          {pagination.total} job{pagination.total === 1 ? '' : 's'} · page {pagination.page} of {pagination.pages}
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
