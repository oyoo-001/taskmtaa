import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatRelativeTime } from '../utils/dateUtils';
import api from '../lib/api';

export default function MyBids() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bids', 'my-bids'],
    queryFn: async () => {
      const { data } = await api.get('/bids/my-bids');
      return data.data;
    },
  });

  const bids = data?.bids || [];

  const getBidStatusBadgeClass = (status) => {
    const classes = {
      pending: 'badge-open',
      accepted: 'badge-completed',
      rejected: 'badge-cancelled',
    };
    return `badge ${classes[status] || ''}`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bids</h1>

        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            Failed to load your bids
          </div>
        )}

        {!isLoading && !error && bids.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">
              You haven't placed any bids yet
            </p>
            <Link to="/" className="btn btn-primary">
              Browse Available Tasks
            </Link>
          </div>
        )}

        {!isLoading && !error && bids.length > 0 && (
          <div className="space-y-4">
            {bids.map((bid) => (
              <Link
                key={bid.id}
                to={`/tasks/${bid.task_id}`}
                className="card p-6 hover:shadow-lg transition-shadow block"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {bid.task_title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {bid.task_description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full">
                        {bid.task_category}
                      </span>
                      <div className="flex items-center">
                        <MapPin size={14} className="mr-1" />
                        <span>{bid.task_location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 text-right space-y-2">
                    <span className={getBidStatusBadgeClass(bid.status)}>
                      {bid.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Task Budget</p>
                    <p className="font-semibold text-green-600">
                      KSh {bid.task_budget?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Your Bid</p>
                    <p className="font-semibold text-blue-600">
                      KSh {bid.bid_amount?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Bid Placed</p>
                    <p className="text-sm text-gray-700">
                      {formatRelativeTime(bid.created_at)}
                    </p>
                  </div>
                </div>

                {bid.pitch_note && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Your Pitch</p>
                    <p className="text-sm text-gray-700">{bid.pitch_note}</p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
