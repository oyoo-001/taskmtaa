import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Inbox,
  PauseCircle,
  Pencil,
  PlayCircle,
  PlusCircle,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import api from '../lib/api';
import VerifiedBadge from '../components/VerifiedBadge';
import { formatRelativeTime } from '../utils/dateUtils';

const ORDER_STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-primary-100 text-primary-800',
  declined: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default function MyGigs() {
  const queryClient = useQueryClient();

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['my-gigs'] });
    queryClient.invalidateQueries({ queryKey: ['received-gig-orders'] });
    queryClient.invalidateQueries({ queryKey: ['gigs'] });
  };

  const { data: gigsData, isLoading: loadingGigs, error: gigsError } = useQuery({
    queryKey: ['my-gigs'],
    queryFn: async () => {
      const { data } = await api.get('/gigs/mine');
      return data.data;
    },
  });

  const { data: ordersData, isLoading: loadingOrders, error: ordersError } = useQuery({
    queryKey: ['received-gig-orders'],
    queryFn: async () => {
      const { data } = await api.get('/gig-orders/received');
      return data.data;
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch(`/gigs/${id}`, { status });
      return data.data;
    },
    onSuccess: refreshAll,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/gigs/${id}`);
      return data.data;
    },
    onSuccess: refreshAll,
  });

  const orderStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch(`/gig-orders/${id}/status`, { status });
      return data.data;
    },
    onSuccess: refreshAll,
  });

  const gigs = gigsData?.gigs || [];
  const orders = ordersData?.orders || [];
  const pendingOrders = orders.filter((order) => order.status === 'pending');

  const handleDelete = (gig) => {
    if (window.confirm(`Delete "${gig.title}"? This also removes its requests.`)) {
      deleteMutation.mutate(gig.id);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles size={26} className="text-primary-600" />
              My Gigs
            </h1>
            <p className="mt-1 text-gray-600">
              Manage the services you offer and respond to buyer requests.
            </p>
          </div>
          <Link
            to="/gigs/create"
            className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 font-semibold"
          >
            <PlusCircle size={18} />
            Create a Gig
          </Link>
        </div>

        {/* Incoming requests */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Inbox size={18} className="text-primary-600" />
              Buyer requests
              {pendingOrders.length > 0 && (
                <span className="rounded-full bg-primary-600 px-2 py-0.5 text-xs font-bold text-white">
                  {pendingOrders.length} new
                </span>
              )}
            </h2>
            {orders.length > 0 && (
              <span className="text-sm text-gray-500">{orders.length} total</span>
            )}
          </div>

          {loadingOrders && (
            <div className="mt-4 flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          )}

          {ordersError && (
            <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              Could not load requests.
            </p>
          )}

          {!loadingOrders && !ordersError && orders.length === 0 && (
            <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <Inbox size={36} className="mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500">
                No requests yet. Share your gig link to get your first buyer.
              </p>
            </div>
          )}

          {orders.length > 0 && (
            <div className="mt-4 space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {order.buyer_avatar ? (
                          <img
                            src={order.buyer_avatar}
                            alt={order.buyer_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
                            {(order.buyer_name || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                        <p className="font-medium text-gray-900 flex items-center gap-1">
                          {order.buyer_name}
                          <VerifiedBadge verified={order.buyer_verified} size={14} />
                        </p>
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(order.created_at)}
                        </span>
                      </div>

                      <Link
                        to={`/gigs/${order.gig_id}`}
                        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800"
                      >
                        {order.gig_title}
                        <ArrowRight size={14} />
                      </Link>

                      {order.requirements && (
                        <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-line">
                          {order.requirements}
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-lg font-bold text-gray-900">
                        KSh {Number(order.amount).toLocaleString()}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          ORDER_STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {order.status === 'pending' && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                      <button
                        type="button"
                        onClick={() => orderStatusMutation.mutate({ id: order.id, status: 'accepted' })}
                        disabled={orderStatusMutation.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                      >
                        <CheckCircle2 size={16} />
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => orderStatusMutation.mutate({ id: order.id, status: 'declined' })}
                        disabled={orderStatusMutation.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        <XCircle size={16} />
                        Decline
                      </button>
                    </div>
                  )}

                  {order.status === 'accepted' && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                      <button
                        type="button"
                        onClick={() => orderStatusMutation.mutate({ id: order.id, status: 'completed' })}
                        disabled={orderStatusMutation.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        <CheckCircle2 size={16} />
                        Mark completed
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* My listings */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">My listings</h2>
            {gigs.length > 0 && (
              <span className="text-sm text-gray-500">{gigs.length} total</span>
            )}
          </div>

          {loadingGigs && (
            <div className="mt-4 flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          )}

          {gigsError && (
            <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              Could not load your gigs.
            </p>
          )}

          {!loadingGigs && !gigsError && gigs.length === 0 && (
            <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <Sparkles size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600 font-medium">You haven't published a gig yet</p>
              <p className="mt-1 text-sm text-gray-400">
                Turn what you're good at into a listing buyers can find.
              </p>
              <Link
                to="/gigs/create"
                className="btn-primary mt-5 inline-flex items-center gap-2 px-5 py-2 font-semibold"
              >
                <PlusCircle size={18} />
                Publish your first gig
              </Link>
            </div>
          )}

          {gigs.length > 0 && (
            <div className="mt-4 space-y-3">
              {gigs.map((gig) => (
                <div
                  key={gig.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      {(gig.thumbnail_url || gig.image_thumbnails?.[0]) && (
                        <img
                          src={gig.thumbnail_url || gig.image_thumbnails[0]}
                          alt={gig.title}
                          className="mb-2 h-20 w-32 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/gigs/${gig.id}`}
                          className="font-semibold text-gray-900 hover:text-primary-700"
                        >
                          {gig.title}
                        </Link>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                            gig.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {gig.status === 'active' ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {gig.category}
                        {gig.subcategory ? ` · ${gig.subcategory}` : ''} • KSh{' '}
                        {Number(gig.amount).toLocaleString()} • Delivery in{' '}
                        {gig.delivery_days} day{gig.delivery_days !== 1 ? 's' : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={13} />
                          {gig.orders_count} request{gig.orders_count === 1 ? '' : 's'}
                        </span>
                        {gig.pending_orders_count > 0 && (
                          <span className="font-semibold text-primary-700">
                            {gig.pending_orders_count} pending
                          </span>
                        )}
                        <span>{gig.completed_orders_count} completed</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                      <Link
                        to={`/gigs/${gig.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil size={15} />
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            id: gig.id,
                            status: gig.status === 'active' ? 'paused' : 'active',
                          })
                        }
                        disabled={toggleStatusMutation.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                      >
                        {gig.status === 'active' ? (
                          <>
                            <PauseCircle size={15} />
                            Pause
                          </>
                        ) : (
                          <>
                            <PlayCircle size={15} />
                            Activate
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(gig)}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
