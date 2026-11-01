import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { formatRelativeTime, formatKenyanDate } from '../../utils/dateUtils';
import { 
  CheckCircleIcon, 
  StarIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export default function SuccessfulJobs() {
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletedTasks();
  }, []);

  const fetchCompletedTasks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/tasks/my-posted');
      const completed = data.data.tasks.filter(t => t.status === 'completed');
      setCompletedTasks(completed);
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = completedTasks.reduce((sum, task) => sum + parseFloat(task.budget || 0), 0);
  const avgRating = completedTasks.length > 0
    ? completedTasks.reduce((sum, task) => sum + (Number(task.tasker_rating) || 0), 0) / completedTasks.length
    : 0;

  const renderStars = (rating) => {
    const stars = [];
    const numRating = Number(rating) || 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= numRating ? (
          <StarIconSolid key={i} className="h-5 w-5 text-yellow-400" />
        ) : (
          <StarIcon key={i} className="h-5 w-5 text-gray-300" />
        )
      );
    }
    return stars;
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
        <h1 className="text-3xl font-bold text-gray-900">Successful Jobs</h1>
        <p className="text-gray-600 mt-2">Review your completed tasks and payments</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-green-800">Completed Jobs</div>
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-4xl font-bold text-green-900">{completedTasks.length}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-blue-800">Total Spent</div>
            <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-4xl font-bold text-blue-900">${totalSpent.toFixed(2)}</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-yellow-800">Avg. Rating Given</div>
            <StarIcon className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="text-4xl font-bold text-yellow-900">{avgRating.toFixed(1)}</div>
        </div>
      </div>

      {/* Completed Tasks List */}
      {completedTasks.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No completed jobs yet</h3>
          <p className="text-gray-600">Your successfully completed tasks will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {completedTasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link 
                      to={`/tasks/${task.id}`}
                      className="text-xl font-semibold text-gray-900 hover:text-primary-600"
                    >
                      {task.title}
                    </Link>
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-gray-600 mb-3">{task.description}</p>
                  
                  {/* Task Details */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Completed {formatKenyanDate(task.updated_at)}
                    </span>
                    {task.accepted_bid && (
                      <span>
                        Tasker: <span className="font-medium text-gray-900">{task.accepted_bid.bidder?.name}</span>
                      </span>
                    )}
                  </div>

                  {/* Rating Given */}
                  {task.tasker_rating && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-sm text-gray-700 mb-1">Your Rating:</div>
                      <div className="flex items-center gap-2">
                        {renderStars(task.tasker_rating)}
                        <span className="text-sm font-medium text-gray-700">
                          {Number(task.tasker_rating).toFixed(1)}
                        </span>
                      </div>
                      {task.tasker_review && (
                        <p className="text-sm text-gray-600 mt-2">{task.tasker_review}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right ml-6">
                  <div className="text-2xl font-bold text-gray-900">
                    KSh {task.budget}
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 bg-green-100 text-green-800">
                    Paid
                  </span>
                </div>
              </div>

              {/* View Details Button */}
              <div className="pt-4 border-t border-gray-200">
                <Link
                  to={`/tasks/${task.id}`}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 
                    rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Achievements Section */}
      {completedTasks.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-8 border border-primary-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🎉 Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {completedTasks.length >= 1 && (
              <div className="bg-white rounded-lg p-4 border border-primary-200">
                <div className="text-2xl mb-2">🌟</div>
                <div className="font-semibold text-gray-900">First Job Complete</div>
                <div className="text-sm text-gray-600">Successfully completed your first task</div>
              </div>
            )}
            {completedTasks.length >= 5 && (
              <div className="bg-white rounded-lg p-4 border border-primary-200">
                <div className="text-2xl mb-2">🚀</div>
                <div className="font-semibold text-gray-900">On a Roll</div>
                <div className="text-sm text-gray-600">Completed 5+ tasks</div>
              </div>
            )}
            {avgRating >= 4.5 && (
              <div className="bg-white rounded-lg p-4 border border-primary-200">
                <div className="text-2xl mb-2">⭐</div>
                <div className="font-semibold text-gray-900">Great Reviewer</div>
                <div className="text-sm text-gray-600">Average rating given: {avgRating.toFixed(1)}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
