import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  StarIcon,
  ClockIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

export default function TaskerAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get(`/analytics/tasker?days=${timeRange}`);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching tasker analytics:', error);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tasker Analytics</h1>
            <p className="text-gray-600 mt-2">Track your earnings and performance</p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Total Earnings</div>
            <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            KSh {analytics.totalEarnings.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            From {analytics.completedTasks} completed tasks
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Total Bids</div>
            <ChartBarIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {analytics.totalBids}
          </div>
          <div className="flex items-center mt-2 text-sm">
            <TrophyIcon className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-green-600">
              {analytics.bidsByStatus.accepted || 0} won
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Success Rate</div>
            <ArrowTrendingUpIcon className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {analytics.bidSuccessRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 mt-2">
            Bid acceptance rate
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Rating</div>
            <StarIcon className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {analytics.averageRating.toFixed(1)}
          </div>
          <div className="flex items-center mt-2">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={`h-5 w-5 ${
                  i < Math.round(analytics.averageRating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Earnings Over Time */}
      {analytics.earningsOverTime && analytics.earningsOverTime.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Earnings Trend</h2>
          <div className="space-y-2">
            {analytics.earningsOverTime.map((item) => (
              <div key={item.date} className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">
                  {new Date(item.date).toLocaleDateString()}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  KSh {parseFloat(item.amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bid Status Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Bid Status Distribution</h2>
        <div className="space-y-4">
          {Object.entries(analytics.bidsByStatus).map(([status, count]) => {
            const percentage = analytics.totalBids > 0 ? (count / analytics.totalBids) * 100 : 0;
            const colors = {
              pending: 'bg-yellow-500',
              accepted: 'bg-green-500',
              rejected: 'bg-red-500',
            };

            return (
              <div key={status}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                  <span className="text-sm text-gray-600">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${colors[status]}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tasks by Category */}
      {analytics.tasksByCategory && analytics.tasksByCategory.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Top Categories</h2>
          <div className="space-y-3">
            {analytics.tasksByCategory.map((item, index) => (
              <div key={item.category} className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary-100 text-primary-700 rounded-full font-semibold text-sm mr-3">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{item.category}</span>
                    <span className="text-sm text-gray-600">{item.count} tasks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            <ClockIcon className="h-5 w-5 inline mr-2" />
            Response Time
          </h3>
          <div className="text-3xl font-bold text-green-900 mb-2">
            {analytics.avgResponseTimeMinutes.toFixed(0)} min
          </div>
          <p className="text-green-800 text-sm">
            {analytics.avgResponseTimeMinutes < 30
              ? "Excellent! You respond very quickly to new tasks."
              : analytics.avgResponseTimeMinutes < 120
              ? "Good response time. Quick responses increase your chances."
              : "Consider responding faster to new tasks to increase your success rate."}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            <TrophyIcon className="h-5 w-5 inline mr-2" />
            Success Rate
          </h3>
          <div className="text-3xl font-bold text-blue-900 mb-2">
            {analytics.bidSuccessRate.toFixed(1)}%
          </div>
          <p className="text-blue-800 text-sm">
            {analytics.bidSuccessRate > 30
              ? "Outstanding! You're winning many of your bids."
              : analytics.bidSuccessRate > 15
              ? "Good performance! Keep improving your bids."
              : "Consider writing more detailed bid pitches and competitive pricing."}
          </p>
        </div>
      </div>
    </div>
  );
}
