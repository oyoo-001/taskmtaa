import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

export default function Analytics() {
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
      const { data } = await api.get(`/analytics/buyer?days=${timeRange}`);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
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
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-2">Track your job posting performance</p>
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
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Total Posts</div>
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{analytics.totalTasks}</div>
          <div className="text-sm text-gray-600 mt-2">
            Total tasks posted
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Total Spent</div>
            <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            KSh {analytics.totalSpent.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            On {analytics.tasksByStatus.completed || 0} completed jobs
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Avg. Bids/Task</div>
            <UserGroupIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {analytics.avgBidsPerTask.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            {analytics.totalBids} total bids
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Avg. Completion</div>
            <ClockIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {analytics.avgCompletionTimeHours.toFixed(1)}h
          </div>
          <div className="text-sm text-gray-600 mt-2">
            Average time to complete
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Task Status Distribution</h2>
        <div className="space-y-4">
          {Object.entries(analytics.tasksByStatus).map(([status, count]) => {
            const percentage = analytics.totalTasks > 0 ? (count / analytics.totalTasks) * 100 : 0;
            const colors = {
              open: 'bg-green-500',
              in_progress: 'bg-blue-500',
              assigned: 'bg-purple-500',
              completed: 'bg-gray-500',
              cancelled: 'bg-red-500',
            };
            
            return (
              <div key={status}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {status.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-600">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${colors[status] || 'bg-gray-400'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Response Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Response Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-1">Avg. First Bid Time</div>
            <div className="text-2xl font-bold text-gray-900">
              {analytics.avgFirstBidTimeMinutes.toFixed(0)} min
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Bid Acceptance Rate</div>
            <div className="text-2xl font-bold text-gray-900">
              {analytics.bidAcceptanceRate.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Completion Rate</div>
            <div className="text-2xl font-bold text-gray-900">
              {analytics.totalTasks > 0 
                ? ((analytics.tasksByStatus.completed || 0) / analytics.totalTasks * 100).toFixed(1)
                : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6 border border-primary-200">
          <h3 className="text-lg font-semibold text-primary-900 mb-2">Quick Insight</h3>
          <p className="text-primary-800">
            {analytics.avgBidsPerTask > 5
              ? "Your posts are getting great attention! You're attracting many qualified taskers."
              : analytics.avgBidsPerTask < 2
              ? "Consider increasing your budget or adding more details to attract more bids."
              : "You're getting a healthy number of bids per task."}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Performance</h3>
          <p className="text-blue-800">
            {analytics.bidAcceptanceRate > 75
              ? "Excellent! You're accepting most qualified bids."
              : analytics.bidAcceptanceRate > 50
              ? "Good job! You're working with many taskers."
              : "Review bids carefully and accept qualified taskers to complete tasks."}
          </p>
        </div>
      </div>
    </div>
  );
}
