import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Search, Trash2, ExternalLink, Filter } from 'lucide-react';
import { api } from '../../lib/api';
import VerifiedBadge from '../../components/VerifiedBadge';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' }
];

export default function AdminGigs() {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadGigs();
  }, [search, status, pagination.page]);

  const loadGigs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      });
      if (search) params.append('search', search);
      if (status) params.append('status', status);

      const response = await api.get(`/admin/gigs?${params}`);
      setGigs(response.data.data.gigs);
      setPagination(response.data.data.pagination);
    } catch (err) {
      console.error('Failed to load gigs:', err);
      setError('Failed to load gigs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (gigId, gigTitle) => {
    if (!window.confirm(`Are you sure you want to delete the gig "${gigTitle}"? This cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(gigId);
      await api.delete(`/admin/gigs/${gigId}`);
      setGigs(gigs.filter(g => g.id !== gigId));
    } catch (err) {
      console.error('Failed to delete gig:', err);
      alert('Failed to delete gig. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    loadGigs();
  };

  if (loading && gigs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && gigs.length === 0) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Gigs</h2>
        <p className="text-gray-600">Review and moderate service listings</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search gigs by title, seller, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <button type="submit" className="btn-primary px-6 py-2">
            <Filter size={18} className="mr-2" />
            Filter
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {gigs.length} of {pagination.total} gigs
      </div>

      {/* Gigs Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gig</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {gigs.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No gigs found
                  </td>
                </tr>
              )}
              {gigs.map((gig) => (
                <tr key={gig.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {gig.thumbnail_url && (
                        <img
                          src={gig.thumbnail_url}
                          alt={gig.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <Link
                          to={`/gigs/${gig.id}`}
                          className="font-medium text-gray-900 hover:text-primary-600 line-clamp-1"
                        >
                          {gig.title}
                        </Link>
                        <p className="text-xs text-gray-500 line-clamp-1">{gig.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/users/${gig.seller_id}`}
                        className="text-sm text-gray-900 hover:text-primary-600 flex items-center gap-1"
                      >
                        {gig.seller_name}
                        <VerifiedBadge verified={gig.seller_verified} />
                      </Link>
                    </div>
                    <p className="text-xs text-gray-500">{gig.seller_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{gig.category}</div>
                    <div className="text-xs text-gray-500">{gig.subcategory}</div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    KSh {Number(gig.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {gig.orders_count || 0}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      gig.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {gig.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDistanceToNow(new Date(gig.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/gigs/${gig.id}`}
                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                        title="View gig"
                      >
                        <ExternalLink size={18} />
                      </Link>
                      <button
                        onClick={() => handleDelete(gig.id, gig.title)}
                        disabled={deleting === gig.id}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        title="Delete gig"
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

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.pages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
