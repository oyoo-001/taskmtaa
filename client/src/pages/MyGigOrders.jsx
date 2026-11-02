import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ClipboardList, XCircle } from 'lucide-react';
import api from '../lib/api';
import VerifiedBadge from '../components/VerifiedBadge';
import { formatRelativeTime } from '../utils/dateUtils';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import { useState } from 'react';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-primary-100 text-primary-800',
  declined: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default function MyGigOrders() {
  const queryClient = useQueryClient();
  
  // Modal states
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, orderId: null });
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['gig-orders'],
    queryFn: async () => {
      const { data } = await api.get('/gig-orders/mine');
      return data.data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/gig-orders/${id}/status`, { status: 'cancelled' });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gig-orders'] });
      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'Request Cancelled',
        message: 'Your gig request has been cancelled.'
      });
    },
    onError: (error) => {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Cancellation Failed',
        message: error.response?.data?.error?.message || 'Failed to cancel request. Please try again.'
      });
    }
  });

  const orders = data?.orders || [];
  
  const handleCancelClick = (orderId) => {
    setConfirmModal({
      isOpen: true,
      orderId,
      title: 'Cancel Gig Request',
      message: 'Cancel this gig request?',
      type: 'warning'
    });
  };
  
  const executeCancel = () => {
    const { orderId } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false });
    cancelMutation.mutate(orderId);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList size={26} className="text-primary-600" />
              My Gig Orders
            </h1>
            <p className="mt-1 text-gray-600">
              Track the gigs you've requested and their status.
            </p>
          </div>
          <Link
            to="/gigs"
            className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 font-semibold"
          >
            Browse gigs
            <ArrowRight size={18} />
          </Link>
        </div>

        {isLoading && (
          <div className="mt-10 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        )}

        {error && (
          <p className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            Could not load your gig orders.
          </p>
        )}

        {!isLoading && !error && orders.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <ClipboardList size={44} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">No gig orders yet</p>
            <p className="mt-1 text-sm text-gray-400">
              Find a service you need and send the seller a request.
            </p>
            <Link
              to="/gigs"
              className="btn-primary mt-5 inline-flex px-5 py-2 font-semibold"
            >
              Explore gigs
            </Link>
          </div>
        )}

        {orders.length > 0 && (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {order.seller_avatar ? (
                        <img
                          src={order.seller_avatar}
                          alt={order.seller_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
                          {(order.seller_name || '?').charAt(0).toUpperCase()}
                        </span>
                      )}
                      <Link
                        to={`/users/${order.seller_id}`}
                        className="text-sm font-medium text-gray-900 hover:text-primary-700 flex items-center gap-1"
                      >
                        {order.seller_name}
                        <VerifiedBadge verified={order.seller_verified} size={14} />
                      </Link>
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(order.created_at)}
                      </span>
                    </div>

                    <Link
                      to={`/gigs/${order.gig_id}`}
                      className="mt-2 inline-flex items-center gap-1 text-base font-semibold text-primary-700 hover:text-primary-800"
                    >
                      {order.gig_title}
                      <ArrowRight size={15} />
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
                        STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {['pending', 'accepted'].includes(order.status) && (
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      onClick={() => handleCancelClick(order.id)}
                      disabled={cancelMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      <XCircle size={16} />
                      Cancel request
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={executeCancel}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText="Cancel Request"
        cancelText="Keep Request"
      />
      
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}
