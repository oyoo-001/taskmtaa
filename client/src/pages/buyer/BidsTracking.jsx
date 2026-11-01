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
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

export default function BidsTracking() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected

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
    try {
      await api.patch(`/bids/${bidId}/accept`);
      // Refresh bids
      fetchBids();
    } catch (error) {
      console.error('Error accepting bid:', error);
      alert('Failed to accept bid');
    }
  };

  const handleRejectBid = async (bidId) => {
    try {
      await api.patch(`/bids/${bidId}/reject`);
      fetchBids();
    } catch (error) {
      console.error('Error rejecting bid:', error);
      alert('Failed to reject bid');
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
          <div className="text-sm text-gray-600">Rejected</div>
          <div className="text-3xl font-bold text-red-600 mt-1">{stats.rejected}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'accepted', 'rejected'].map(status => (
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
    </div>
  );
}
