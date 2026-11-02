import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { formatRelativeTime, formatKenyanDate } from '../../utils/dateUtils';
import { 
  UserCircleIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ChatBubbleLeftIcon,
  ClipboardDocumentListIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import ConfirmModal from '../../components/ConfirmModal';
import AlertModal from '../../components/AlertModal';

export default function BidsTracking() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected, completed
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Modal states
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, bidId: null });
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      setLoading(true);
      // Fetch all tasks posted by the buyer with their bids
      const { data } = await api.get('/tasks/my-posted');
      
      // Fetch detailed bids for each task
      const tasksWithBids = await Promise.all(
        data.data.tasks.map(async (task) => {
          try {
            const taskData = await api.get(`/tasks/${task.id}`);
            return taskData.data.data.task;
          } catch (error) {
            console.error(`Error fetching task ${task.id}:`, error);
            return { ...task, bids: [] };
          }
        })
      );
      
      // Extract all bids from all tasks
      const allBids = tasksWithBids.flatMap(task => 
        (task.bids || []).map(bid => ({
          ...bid,
          task: {
            id: task.id,
            title: task.title,
            budget: task.budget,
            status: task.status
          }
        }))
      );
      
      setBids(allBids);
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBid = async (bidId, taskId) => {
    setConfirmModal({
      isOpen: true,
      action: 'accept',
      bidId,
      taskId,
      title: 'Accept Bid',
      message: 'Are you sure you want to accept this bid? Other pending bids will be automatically rejected.',
      type: 'success'
    });
  };

  const handleRejectBid = async (bidId) => {
    setConfirmModal({
      isOpen: true,
      action: 'reject',
      bidId,
      title: 'Reject Bid',
      message: 'Are you sure you want to reject this bid? This action cannot be undone.',
      type: 'danger'
    });
  };

  const executeAction = async () => {
    const { action, bidId, taskId } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false });

    try {
      if (action === 'accept') {
        await api.patch(`/bids/${bidId}/accept`);
        setAlertModal({
          isOpen: true,
          type: 'success',
          title: 'Bid Accepted',
          message: 'The bid has been accepted successfully!'
        });
      } else if (action === 'reject') {
        await api.patch(`/bids/${bidId}/reject`);
        setAlertModal({
          isOpen: true,
          type: 'info',
          title: 'Bid Rejected',
          message: 'The bid has been rejected.'
        });
      } else if (action === 'complete') {
        await api.patch(`/bids/${bidId}/complete`);
        setAlertModal({
          isOpen: true,
          type: 'success',
          title: 'Bid Completed',
          message: 'Bid marked as completed! You can now rate the tasker.'
        });
      }
      fetchBids();
    } catch (error) {
      console.error(`Error ${action}ing bid:`, error);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Action Failed',
        message: error.response?.data?.error?.message || `Failed to ${action} bid. Please try again.`
      });
    }
  };

  const filteredBids = bids.filter(bid => {
    if (filter === 'all') return true;
    return bid.status === filter;
  });

  const stats = {
    total: bids.length,
    pending: bids.filter(b => b.status === 'pending').length,
    accepted: bids.filter(b => b.status === 'accepted').length,
    rejected: bids.filter(b => b.status === 'rejected').length,
    completed: bids.filter(b => b.status === 'completed').length,
  };

  const handleCompleteBid = async (bidId) => {
    setConfirmModal({
      isOpen: true,
      action: 'complete',
      bidId,
      title: 'Mark as Completed',
      message: 'Are you sure the tasker has completed the work? This will allow you to rate them.',
      type: 'info'
    });
  };

  const openRatingModal = (bid) => {
    setSelectedBid(bid);
    setRating(0);
    setComment('');
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      setAlertModal({
        isOpen: true,
        type: 'warning',
        title: 'Rating Required',
        message: 'Please select a rating between 1 and 5 stars before submitting.'
      });
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/bids/${selectedBid.id}/rate`, {
        rating,
        comment
      });
      setShowRatingModal(false);
      fetchBids();
      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'Rating Submitted',
        message: 'Thank you for rating the tasker! Your feedback helps build a better community.'
      });
    } catch (error) {
      console.error('Error submitting rating:', error);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Submission Failed',
        message: error.response?.data?.error?.message || 'Failed to submit rating. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bids Tracking</h1>
        <p className="text-gray-600 mt-2">Review and manage bids on your job postings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Total Bids</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Accepted</div>
          <div className="text-3xl font-bold text-green-600 mt-1">{stats.accepted}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-3xl font-bold text-blue-600 mt-1">{stats.completed}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Rejected</div>
          <div className="text-3xl font-bold text-red-600 mt-1">{stats.rejected}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'accepted', 'completed', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors
              ${filter === status 
                ? 'bg-primary-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Bids List */}
      {filteredBids.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bids found</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'You haven\'t received any bids yet.' 
              : `No ${filter} bids.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBids.map((bid) => (
            <div key={bid.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Link 
                    to={`/tasks/${bid.task.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                  >
                    {bid.task.title}
                  </Link>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center">
                      <UserCircleIcon className="h-4 w-4 mr-1" />
                      {bid.tasker_name || 'Unknown Bidder'}
                    </span>
                    <span className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {formatRelativeTime(bid.created_at)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">
                    KSh {bid.bid_amount?.toLocaleString()}
                  </div>
                  <div className={`
                    inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mt-2
                    ${bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${bid.status === 'accepted' ? 'bg-green-100 text-green-800' : ''}
                    ${bid.status === 'completed' ? 'bg-blue-100 text-blue-800' : ''}
                    ${bid.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {bid.status}
                  </div>
                </div>
              </div>

              {bid.pitch_note && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{bid.pitch_note}</p>
                </div>
              )}

              <div className="flex gap-3">
                {bid.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAcceptBid(bid.id, bid.task.id)}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg
                        hover:bg-green-700 transition-colors font-medium"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectBid(bid.id)}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg
                        hover:bg-red-700 transition-colors font-medium"
                    >
                      <XCircleIcon className="h-5 w-5 mr-2" />
                      Reject
                    </button>
                  </>
                )}
                {bid.status === 'accepted' && (
                  <button
                    onClick={() => handleCompleteBid(bid.id)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg
                      hover:bg-blue-700 transition-colors font-medium"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Mark as Completed
                  </button>
                )}
                {bid.status === 'completed' && (
                  <button
                    onClick={() => openRatingModal(bid)}
                    className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg
                      hover:bg-yellow-700 transition-colors font-medium"
                  >
                    <StarIcon className="h-5 w-5 mr-2" />
                    Rate Tasker
                  </button>
                )}
                <Link
                  to={`/messages?user=${bid.tasker_id}&task=${bid.task.id}`}
                  className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 
                    rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
                  Message
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Rate {selectedBid.tasker_name}
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How was your experience?
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    {star <= (hoverRating || rating) ? (
                      <StarIconSolid className="h-10 w-10 text-yellow-400" />
                    ) : (
                      <StarIcon className="h-10 w-10 text-gray-300" />
                    )}
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Comments (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Share your experience working with this tasker..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmitRating}
                disabled={submitting || rating === 0}
                className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg font-medium
                  hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                  transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </button>
              <button
                onClick={() => setShowRatingModal(false)}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700
                  hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed
                  transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={executeAction}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText="Confirm"
        cancelText="Cancel"
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
