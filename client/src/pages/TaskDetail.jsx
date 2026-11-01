import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  DollarSign,
  Calendar,
  User,
  MessageSquare,
  CheckCircle,
  XCircle,
  Star,
  Trash2,
  EyeOff,
  Eye,
  Award,
  Clock,
  Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatRelativeTime, formatKenyanDate } from '../utils/dateUtils';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import VerifiedBadge from '../components/VerifiedBadge';

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { joinTaskRoom, leaveTaskRoom } = useSocket();
  const [bidAmount, setBidAmount] = useState('');
  const [pitchNote, setPitchNote] = useState('');
  const [showBidModal, setShowBidModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch task details
  const { data, isLoading, error } = useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const { data } = await api.get(`/tasks/${id}`);
      return data.data;
    },
  });

  useEffect(() => {
    if (user && id) {
      joinTaskRoom(parseInt(id));
      return () => leaveTaskRoom(parseInt(id));
    }
  }, [id, user, joinTaskRoom, leaveTaskRoom]);

  // Place bid mutation
  const placeBidMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/bids/task/${id}`, {
        bid_amount: parseFloat(bidAmount),
        pitch_note: pitchNote.trim() || undefined, // Send undefined if empty
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['task', id]);
      setShowBidModal(false);
      setBidAmount('');
      setPitchNote('');
    },
  });

  // Accept bid mutation
  const acceptBidMutation = useMutation({
    mutationFn: async (bidId) => {
      const { data } = await api.patch(`/bids/${bidId}/accept`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['task', id]);
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      navigate('/my-tasks');
    },
  });

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status) => {
      const { data } = await api.patch(`/tasks/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['task', id]);
    },
  });

  const handlePlaceBid = (e) => {
    e.preventDefault();
    placeBidMutation.mutate();
  };

  const handleAcceptBid = (bidId) => {
    if (confirm('Are you sure you want to accept this bid?')) {
      acceptBidMutation.mutate(bidId);
    }
  };

  const handleDeleteTask = () => {
    deleteTaskMutation.mutate();
    setShowDeleteConfirm(false);
  };

  const handleCancelTask = () => {
    if (confirm('Are you sure you want to cancel this task?')) {
      updateStatusMutation.mutate('cancelled');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          Task not found or failed to load
        </div>
      </div>
    );
  }

  const task = data.task;
  const isOwner = user?.id === task.poster_id;
  const hasBid = task.bids?.some((bid) => bid.tasker_id === user?.id);
  const canBid = user && !isOwner && !hasBid && task.status === 'open';

  const getStatusBadgeClass = (status) => {
    const classes = {
      open: 'badge-open',
      assigned: 'badge-assigned',
      in_progress: 'badge-in-progress',
      completed: 'badge-completed',
      cancelled: 'badge-cancelled',
    };
    return `badge ${classes[status] || ''}`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with actions */}
        {isOwner && task.status === 'open' && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Users size={20} className="text-gray-400" />
              <span className="text-sm text-gray-600">
                {task.bids_count || 0} {task.bids_count === 1 ? 'applicant' : 'applicants'} so far
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleCancelTask}
                className="btn btn-secondary text-sm flex items-center space-x-1"
                disabled={updateStatusMutation.isPending}
              >
                <EyeOff size={16} />
                <span>Hide Task</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn bg-red-50 text-red-600 hover:bg-red-100 text-sm flex items-center space-x-1"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Header Card */}
            <div className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-start space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900 flex-1">{task.title}</h1>
                    <span className={getStatusBadgeClass(task.status)}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1" />
                      <span>Posted {formatRelativeTime(task.created_at)}</span>
                    </div>
                    <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full font-medium">
                      {task.category}
                    </span>
                    <div className="flex items-center text-gray-500">
                      <Clock size={16} className="mr-1" />
                      <span>Open for bids</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget Display */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Task Budget</p>
                    <p className="text-3xl font-bold text-green-700">
                      KSh {task.budget?.toLocaleString()}
                    </p>
                  </div>
                  <Award size={48} className="text-green-600 opacity-20" />
                </div>
              </div>

              {/* Description */}
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{task.description}</p>
              </div>

              {/* Location */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <MapPin size={20} className="text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Task Location</p>
                    <p className="text-gray-900 font-medium">{task.location_name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bids Section */}
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Applications ({task.bids_count || 0})
                </h2>
                {isOwner && task.bids_count > 0 && (
                  <span className="text-sm text-gray-600">
                    Review and select the best applicant
                  </span>
                )}
              </div>

              {task.bids && task.bids.length > 0 ? (
                <div className="space-y-4">
                  {task.bids.map((bid) => (
                    <div
                      key={bid.id}
                      className={`border-2 rounded-lg p-4 transition-all ${
                        bid.status === 'accepted'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                            <User size={24} className="text-primary-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 flex items-center gap-1">
                              {bid.tasker_name}
                              <VerifiedBadge verified={bid.tasker_verified} size={15} />
                            </p>
                            <div className="flex items-center text-sm text-gray-600">
                              <Star size={14} className="text-yellow-400 mr-1" fill="currentColor" />
                              <span>{Number(bid.tasker_rating || 5).toFixed(1)} rating</span>
                              {bid.tasker_verified && (
                                <span className="ml-2 text-green-600">✓ Verified</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            KSh {bid.bid_amount?.toLocaleString()}
                          </p>
                          <span className={`badge ${bid.status === 'accepted' ? 'badge-completed' : 'badge-open'} text-xs mt-1`}>
                            {bid.status}
                          </span>
                        </div>
                      </div>

                      {bid.pitch_note && (
                        <div className="bg-white rounded p-3 mb-3 border border-gray-100">
                          <p className="text-sm text-gray-700">{bid.pitch_note}</p>
                        </div>
                      )}

                      {isOwner && bid.status === 'pending' && task.status === 'open' && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleAcceptBid(bid.id)}
                            className="btn btn-primary text-sm flex items-center space-x-1 flex-1"
                            disabled={acceptBidMutation.isPending}
                          >
                            <CheckCircle size={16} />
                            <span>Accept Application</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Users size={48} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500 text-lg mb-2">No applications yet</p>
                  <p className="text-gray-400 text-sm">Be the first to apply for this task!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Poster Card */}
            <div className="card p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-3">Posted By</h3>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <User size={24} className="text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 flex items-center gap-1">
                    {task.poster_name}
                    <VerifiedBadge verified={task.poster_verified} size={15} />
                  </p>
                  <div className="flex items-center text-sm text-gray-600">
                    <Star size={14} className="text-yellow-400 mr-1" fill="currentColor" />
                    <span>{Number(task.poster_rating || 5).toFixed(1)} rating</span>
                  </div>
                </div>
              </div>
              {task.poster_verified && (
                <p className="text-sm text-green-600">✓ Verified User</p>
              )}
            </div>

            {/* Action Card */}
            {canBid && (
              <div className="card p-6 bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-200">
                <div className="text-center mb-4">
                  <Award size={48} className="mx-auto text-primary-600 mb-2" />
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Ready to Apply?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Submit your best offer and pitch
                  </p>
                </div>
                <button
                  onClick={() => setShowBidModal(true)}
                  className="btn btn-primary w-full py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
                >
                  Apply for this Task
                </button>
              </div>
            )}

            {hasBid && !isOwner && (
              <div className="card p-6 bg-green-50 border-2 border-green-200">
                <div className="text-center">
                  <CheckCircle size={48} className="mx-auto text-green-600 mb-2" />
                  <p className="text-green-800 font-medium">
                    ✓ You have applied for this task
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Wait for the poster to review your application
                  </p>
                </div>
              </div>
            )}

            {!user && (
              <div className="card p-6 text-center">
                <p className="text-gray-600 mb-4">
                  Sign in to apply for this task
                </p>
                <Link 
                  to="/login"
                  state={{ 
                    from: { pathname: `/tasks/${id}` },
                    message: 'Please log in to apply for this task'
                  }}
                  className="btn btn-primary w-full"
                >
                  Login to Apply
                </Link>
                <p className="text-sm text-gray-600 mt-3">
                  Don't have an account?{' '}
                  <Link 
                    to="/register"
                    state={{ 
                      from: { pathname: `/tasks/${id}` },
                      message: 'Create an account to apply for this task'
                    }}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Sign up here
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Submit Your Application</h2>
            <form onSubmit={handlePlaceBid} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Offer (KSh) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  className="input"
                  placeholder={`Task budget: KSh ${task.budget}`}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Competitive offers increase your chances
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why you're the best fit (Optional)
                </label>
                <textarea
                  rows={4}
                  className="input"
                  placeholder="Tell the poster about your experience, availability, and why you should be chosen..."
                  value={pitchNote}
                  onChange={(e) => setPitchNote(e.target.value)}
                />
              </div>
              {placeBidMutation.isError && (
                <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                  {placeBidMutation.error.response?.data?.error?.message || 'Failed to submit application'}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBidModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={placeBidMutation.isPending}
                  className="btn btn-primary flex-1"
                >
                  {placeBidMutation.isPending ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Delete Task?</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this task? This action cannot be undone and all associated bids will be removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                disabled={deleteTaskMutation.isPending}
                className="btn bg-red-600 text-white hover:bg-red-700 flex-1"
              >
                {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
