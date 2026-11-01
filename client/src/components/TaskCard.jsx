import { MapPin, DollarSign, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../utils/dateUtils';
import VerifiedBadge from './VerifiedBadge';

export default function TaskCard({ task }) {
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
    <Link to={`/tasks/${task.id}`} className="card hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex justify-between items-start mb-3 gap-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {task.title}
          </h3>
          {task.status && (
            <span className={getStatusBadgeClass(task.status)}>
              {task.status.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {task.description}
        </p>

        {/* Category */}
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
            {task.category}
          </span>
        </div>

        {/* Meta Info */}
        <div className="space-y-2 text-sm text-gray-600 mt-auto">
          {/* Budget */}
          <div className="flex items-center">
            <DollarSign size={16} className="mr-2 text-green-600" />
            <span className="font-semibold text-green-600">
              KSh {task.budget?.toLocaleString()}
            </span>
          </div>

          {/* Location & Distance */}
          <div className="flex items-center">
            <MapPin size={16} className="mr-2 text-primary-600" />
            <span className="truncate">
              {task.location_name}
              {task.distance_formatted && (
                <span className="ml-2 text-primary-600 font-medium">
                  • {task.distance_formatted} away
                </span>
              )}
            </span>
          </div>

          {/* Posted By & Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0">
              <User size={16} className="mr-2 flex-shrink-0" />
              <span className="truncate flex items-center gap-1">
                {task.poster_name}
                <VerifiedBadge verified={task.poster_verified} size={14} />
              </span>
            </div>
            <div className="flex items-center text-gray-500">
              <Calendar size={14} className="mr-1" />
              <span className="text-xs">
                {formatRelativeTime(task.created_at)}
              </span>
            </div>
          </div>

          {/* Bids Count */}
          {task.bids_count !== undefined && (
            <div className="pt-2 border-t border-gray-100">
              <span className="text-primary-600 font-medium">
                {task.bids_count} {task.bids_count === 1 ? 'bid' : 'bids'}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
